export type TierLimits = {
  maxTables: number | null;
  maxItems: number | null;
  kds: boolean;
  branding: boolean;
  analytics: boolean;
  multiLocation: boolean;
  crm: boolean;
  loyalty: boolean;
};

// Tier logic for SaaS billing
export function getTierLimits(tier: string = "pro"): TierLimits {
  // Single unified plan: unlock everything
  return {
    maxTables: null,
    maxItems: null,
    kds: true,
    branding: true,
    analytics: true,
    multiLocation: true,
    crm: true,
    loyalty: true,
  };
}
