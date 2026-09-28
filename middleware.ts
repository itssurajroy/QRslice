// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { isPublicPath, isApiRoute } from "./src/lib/middleware/config";
import { resolveTenant } from "./src/lib/middleware/tenant";
import { checkAuthAndProfile } from "./src/lib/middleware/auth";
import { checkRoleAccess } from "./src/lib/middleware/roles";
import { checkSubscriptionAccess } from "./src/lib/middleware/subscription";
import { checkConsentAccess } from "./src/lib/middleware/consent";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Strip spoofable incoming custom context headers before creating the response
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-tenant-id");
  requestHeaders.delete("x-tenant-slug");
  requestHeaders.delete("x-tenant-status");
  requestHeaders.delete("x-user-id");
  requestHeaders.delete("x-user-role");
  requestHeaders.delete("x-restaurant-id");

  // 1. Set baseline secure headers
  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("x-frame-options", "DENY");
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  // Baseline CSP: default deny-by-default with explicit image sources.
  // images.unsplash.com serves menu/dish photography (seed data + fallbacks).
  response.headers.set(
    "content-security-policy",
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co data: blob:; " +
      "img-src 'self' https://*.supabase.co https://images.unsplash.com data: blob:;"
  );

  // 2. Maintenance Mode Check
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true") {
    // Only block API and operational routes, let marketing be.
    if (!isPublicPath(pathname) && !pathname.startsWith("/super")) {
      if (isApiRoute(pathname)) {
        return NextResponse.json({ error: "Maintenance Mode" }, { status: 503 });
      }
      return NextResponse.rewrite(new URL("/maintenance", request.url));
    }
  }

  // 3. Resolve Tenant (fast edge cache)
  const tenant = await resolveTenant(request);
  if (tenant) {
    requestHeaders.set("x-tenant-id", tenant.id);
    requestHeaders.set("x-tenant-slug", tenant.slug);
    requestHeaders.set("x-tenant-status", getTenantState(tenant));
  } else if (!isPublicPath(pathname) && !pathname.startsWith("/super") && !isApiRoute(pathname)) {
    // If tenant isn't found for a route that requires one (like /c/[slug] or /pos), we could 404
    // But it's safer to let the app handle it unless it's a subdomain 404.
    // For now, we just pass through and let the page throw a 404.
  }

  // 4. Fast path for public routes
  if (isPublicPath(pathname)) {
    return response;
  }

  // 5. Auth Check (only for protected routes)
  const authResult = await checkAuthAndProfile(request, response);
  response = authResult.response; // Update response with any cookie changes from Supabase
  const user = authResult.user;
  const profile = authResult.profile;

  if (!user || !profile) {
    if (isApiRoute(pathname)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Attach auth context headers downstream only (never leak to browser response headers)
  requestHeaders.set("x-user-id", user.id);
  requestHeaders.set("x-user-role", profile.role);
  if (profile.restaurant_id) {
    requestHeaders.set("x-restaurant-id", profile.restaurant_id);
  }

  // 5.5 DPDP Consent Guard
  const consentCheck = await checkConsentAccess(request, user);
  if (!consentCheck.allowed) {
    if (isApiRoute(pathname)) {
      return NextResponse.json({ error: consentCheck.error }, { status: 403 });
    }
    // Allow users to reach the consent page to re-opt-in, or logout.
    if (!pathname.startsWith("/privacy") && !pathname.startsWith("/login") && !pathname.startsWith("/logout")) {
      const redirectUrl = new URL("/privacy/consent-required", request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 6. Role & Isolation Guard
  const roleCheck = checkRoleAccess(pathname, profile, tenant?.id || null);
  if (!roleCheck.allowed) {
    if (isApiRoute(pathname)) {
      return NextResponse.json({ error: roleCheck.error }, { status: 403 });
    }
    if (roleCheck.redirect) {
      return NextResponse.redirect(new URL(roleCheck.redirect, request.url));
    }
    // Fallback block
    return NextResponse.rewrite(new URL("/403", request.url));
  }

  // 7. Subscription / Trial Guard
  const subCheck = checkSubscriptionAccess(pathname, tenant, profile.role);
  if (!subCheck.allowed && subCheck.redirect) {
    if (isApiRoute(pathname)) {
      return NextResponse.json({ error: subCheck.error }, { status: 402 });
    }
    return NextResponse.redirect(new URL(subCheck.redirect, request.url));
  }

  return response;
}

// Helper
function getTenantState(tenant: any) {
  if (tenant.plan === "active") return "active";
  if (tenant.plan === "suspended") return "suspended";
  if (tenant.plan === "cancelled") return "cancelled";
  if (tenant.plan === "trial") {
    if (!tenant.trial_ends_at || new Date(tenant.trial_ends_at).getTime() > Date.now()) {
      return "trial";
    }
    return "expired";
  }
  return "expired";
}

// Ensure middleware only runs on necessary paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt, sitemap.xml, llms.txt (SEO & AI crawler endpoints)
     * - file extensions (.png, .jpg, .svg, .txt, .xml, .json, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots\\.txt|sitemap\\.xml|llms\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json)$).*)",
  ],
};
