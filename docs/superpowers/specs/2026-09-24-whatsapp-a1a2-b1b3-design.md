# QRslice WhatsApp A1+A2 / B1+B3 — Design Spec

**Date:** 2026-09-24
**Approach:** Minimal extension (Approach 1, single cron pipe)
**Scope:** A1 images/PDFs + A2 buttons/lists now; B1 keyword auto-replies + B3 human handoff inbox now; A4 bulk + B2 AI + B4 webhooks next sprint
**Branch:** `release/production-hardening` (Baileys base PR #3 merged to `main`)

## 1. Goals & Non-Goals

**Goals**
- Send rich outbound via existing `whatsapp-dispatch` cron: images, PDFs, captions, quick-reply buttons/lists
- Receive inbound via Baileys `messages.upsert`, auto-reply to keywords (MENU/HELP/TRACK), create tickets for human handoff
- Staff inbox to view tickets and reply (reuses `POST /api/whatsapp/send` → cron)
- No new queue, no new infra, reuse stale reclaim + throwOnError guarantees from Task 6

**Non-Goals (next sprint)**
- A4 bulk/broadcast scheduling
- B2 LLM chatbot
- B4 external webhook forwarder
- Real-time Realtime/subscription (polling is enough)
- Multi-device per tenant

## 2. Architecture

- Stack: Next.js 16 App Router + Baileys `^7.0.0-rc14` + Supabase + Vercel cron `*/2 * * * *` (`vercel.json:12`)
- Single outbound pipe: `POST /api/whatsapp/send` inserts `whatsapp_messages{pending}` → cron `GET /api/cron/whatsapp-dispatch` claims `pending→sending` → `connect(waitForOpen 25s)→getSocket→sendMessage→release` → `sent` (throwOnError before event/last_seen_at, SENDING_STALE_MS 5m reclaim)
- Inbound pipe: `BaileysConnectionManager.handleMessagesUpsert` → insert `whatsapp_inbound_messages` → `keyword-router` → enqueue reply `pending` (same cron) or open `whatsapp_tickets`
- Human reply: Inbox composer → `POST /api/whatsapp/send` → cron

Existing files touched only; no BullMQ re-add (deleted in `981ec32`).

## 3. Data Model

### 3.1 Extend outbox

Migration `supabase/migrations/20260926000002_whatsapp_a1a2_payload.sql`:

- `whatsapp_messages.media_url text`
- `media_type text check (image|document|video|audio)`
- `caption text`
- `buttons jsonb` — `[{id,title}]` max 3, or url buttons `[{type:"url",title,url}]`
- `inbound_id uuid references whatsapp_inbound_messages(id)`

All nullable, backward compatible (null → current text path).

### 3.2 Inbound + tickets

Migration `supabase/migrations/20260926000003_whatsapp_inbound.sql`:

- `whatsapp_inbound_messages(id uuid pk, tenant_id uuid fk restaurants, remote_jid text, push_name text, message_type text, body text, media_url text, raw jsonb, received_at timestamptz default now(), inbound_id text unique)` — dedupe key `msg.key.id`
- `whatsapp_tickets(id uuid pk, tenant_id uuid, customer_jid text, customer_phone text, push_name text, status text check(open|closed) default open, last_message_at timestamptz, last_outbound_at timestamptz, unread_count int default 1, created_at timestamptz)`

Storage: Supabase Storage bucket `whatsapp-media` private; `createSignedUrl` 1h for Baileys fetch; validate `media_url` https, ≤5 MB image / ≤10 MB PDF, else 422.

## 4. Outbound A1+A2

**Send API** `src/app/api/whatsapp/send/route.ts:9`:

Extend `sendSchema`:

```ts
media_url: z.string().url().optional(),
media_type: z.enum(["image","document","video","audio"]).optional(),
caption: z.string().max(1024).optional(),
buttons: z.array(z.object({id:z.string().min(1).max(20), title:z.string().min(1).max(20)})).max(3).optional(),
```

Validate `media_url` requires `media_type`; store in new columns + `template_variables` for compat. JID + `hasSession` checks unchanged.

**Dispatch** `src/app/api/cron/whatsapp-dispatch/route.ts:47`:

After `toWhatsAppJid` + bill text, branch on `row.media_type`:

- `image` → `socket.sendMessage(jid, {image:{url:media_url}, caption: caption||text, buttons?})`
- `document` → `{document:{url}, mimetype:"application/pdf", fileName:"Invoice.pdf", caption}`
- `buttons` only → `{text, buttons: buttons.map(b=>({buttonId:b.id, buttonText:{displayText:b.title}, type:1}))}`
- else `{text}`

Uses same `connect(autoReconnect:false) → waitForOpen → getSocket → sendMessage → release`. Capture `provider_message_id`, `sent_at`, clear `error_message`. On failure, `retry_count++`, exponential `scheduled_at = now+min(2**retry*30s,15m)`.

**SettingsTab** `src/features/admin/tabs/SettingsTab.tsx:154`:

Template editor adds image/ PDF toggles + quick-reply editor (3 rows), preview via `renderWhatsAppMessage` + `renderButtonsPreview`. `handleSaveWaSettings` sends behavioral + media defaults (optional). No credential fields.

## 5. Inbound B1+B3

**Wire-up** `src/integrations/whatsapp/baileys/connection-manager.ts:326`:

`handleMessagesUpsert(tenantId, messages: WAMessage[])` for each `!fromMe`:

- Extract `body` = `conversation || extendedTextMessage.text || imageMessage.caption || documentMessage.caption || ""`, `remoteJid = msg.key.remoteJid!`, `msgId = msg.key.id!`
- Insert `whatsapp_inbound_messages` `onConflict inbound_id do nothing` → if 0 rows, skip (dedupe)
- Upsert `whatsapp_tickets` `(tenant_id, customer_jid)` → `last_message_at=now(), unread_count=unread_count+1`

**Keyword router** `src/integrations/whatsapp/keyword-router.ts` (pure):

```ts
export function routeKeyword(body: string, ctx:{restaurantSlug?:string}): {reply:string, buttons?:Button[]}|null
```

- `MENU` (exact, case-insensitive, trim) → `Hi! Browse menu: https://{slug}.qrslice.com/menu` + `[{id:"menu",title:"View Menu"}]`
- `HELP` → `Need help? Call +91… or reply SUPPORT`
- `TRACK <orderNo>` → lookup `orders` by `order_number` scoped to tenant → `Order ORD-123: preparing (ETA 12m)` or `not found`

If matched → enqueue `whatsapp_messages{tenant_id, recipient_phone: jidToPhone(remoteJid), message_type:"keyword_reply", status:pending, template_variables:{text:reply}, buttons, inbound_id}`. Single reply per inbound (dedupe via inbound_id).

If unmatched → leave ticket `open` for handoff.

## 6. Inbox UI (B3)

**New** `src/features/admin/tabs/InboxTab.tsx` + admin nav entry `AdminClient.tsx`:

- Left: `GET /api/whatsapp/tickets` list `where tenant_id=auth.restaurantId order by last_message_at desc` — filter `Open/All`, row shows `customer_phone` (jid→phone), `pushName`, `unread_count` badge, relative time, status dot.
- Center: thread `GET /api/whatsapp/inbound?customer_jid=` union `inbound` + `messages` ordered by time — left/right bubbles, `body`, `media_url` thumb, `sent/delivered/read` via `whatsapp_message_events`.
- Composer: textarea `Send` → `POST /api/whatsapp/send {phone, variables:{text: body}}` → `pending` → cron ≤2m → poll status. `Close ticket` → `PATCH /api/whatsapp/tickets/:id {status:closed}`.
- Poll every 5s; clear `unread_count` on open.

Auth: `getSessionUser()` tenant-scoped; allow `staff` to reply (relax `send/route.ts:22` for `manual_reply`), `owner` still gates broadcast.

No new deps, Tailwind 4 same card style.

## 7. Security & Validation

- Tenant scoping: all queries `eq tenant_id/rights`; `orders` fetch `eq restaurant_id`; cron `Bearer CRON_SECRET`.
- Media: reject `media_url` not https or oversize → 422 `Invalid media_url`; Storage signed URL 1h, private bucket.
- Webhook-like inbound: `remoteJid` validated via `toWhatsAppJid` reverse; ignore `fromMe` and empty body; history replay safe via dedupe.
- Tickets: staff reads own tenant only.

## 8. Error Handling

- Outbound media fetch fail or `sendMessage` throw → same retry path as text; error stored in `error_message`.
- `status:sent` write remains `throwOnError` before `event/last_seen_at` (existing guarantee) → duplicate needs 2 DB fails.
- Inbound insert fail (FK) → log, skip ticket; ticket upsert fail → log, still enqueue reply if keyword matched.

## 9. Testing

- `dispatch/route.test.ts` + `sends image with caption`, `sends buttons`, `rejects oversize media_url` — assert `sendMessage` payload.
- `keyword-router.test.ts` — 8 cases: MENU/HELP/TRACK found/not, case-insensitive, trim, no match null.
- `inbound.test.ts` — `handleMessagesUpsert` inserts inbound + ticket + enqueues reply; dedupe on second call.
- `InboxTab.test.tsx` — renders tickets, sends reply via `POST /send`, disabled no selection.
- Full gate: `npx vitest run` (401→~415), `npx tsc --noEmit`, `npm run build`, `grep -r graph.facebook.com src` 0, `grep -r baileys/client` absent except test mock.

## 10. Rollout & Next Sprint Seam

- Rollout: migrations `20260926000002/03` → `NOTIFY pgrst, reload schema` → deploy `main` (Vercel cron auto). No data migration; existing `pending` rows null media → text path.
- Next sprint A4 bulk: `whatsapp_bulk` + `POST /api/whatsapp/broadcast` enqueues N pending, reuses cron.
- B2 AI: swap `keyword-router` body for LLM call, same enqueue.
- B4 webhook: add `if webhook_url` forwarder after inbound insert.

## 11. File Map

- Migrations: `supabase/migrations/20260926000002_…`, `20260926000003_…`
- Modify: `src/app/api/cron/whatsapp-dispatch/route.ts`, `src/app/api/whatsapp/send/route.ts`, `src/integrations/whatsapp/baileys/connection-manager.ts`, `src/features/admin/tabs/SettingsTab.tsx`
- Create: `src/integrations/whatsapp/keyword-router.ts`, `src/features/admin/tabs/InboxTab.tsx`, `src/app/api/whatsapp/tickets/route.ts`, `src/app/api/whatsapp/inbound/route.ts`
- Tests: `src/integrations/whatsapp/keyword-router.test.ts`, `src/app/api/cron/whatsapp-dispatch/route.test.ts` (extend), `test/features/admin/tabs/InboxTab.test.tsx`
