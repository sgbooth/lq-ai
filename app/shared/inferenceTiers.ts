/** Deployment tier meanings; these describe router metadata, not a live health check. */
export const inferenceTiers: Record<number, { label: string; description: string }> = {
  1: {
    label: "On-prem / air-gapped",
    description: "Inference stays inside your environment on a local or self-hosted model.",
  },
  2: {
    label: "Private cloud",
    description:
      "Inference runs in your private cloud account with contractual zero data retention.",
  },
  3: {
    label: "Enterprise with zero data retention",
    description:
      "A commercial provider processes the request under an enterprise zero-data-retention agreement.",
  },
  4: {
    label: "Standard commercial API",
    description: "The provider may retain prompts for abuse review under its published policy.",
  },
  5: {
    label: "Consumer / free API",
    description:
      "The provider may retain prompts and use them for training. Avoid privileged content.",
  },
};
export function tierLabel(tier?: number | null): string {
  return tier && inferenceTiers[tier]
    ? `Tier ${tier} · ${inferenceTiers[tier].label}`
    : "Tier not recorded";
}
