export function getProposalExpiry(expiresAt: string) {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { text: "Expired", expired: true };
  if (diffDays === 0) return { text: "Expires today", expired: false };
  return { text: `Expires in ${diffDays} day${diffDays !== 1 ? "s" : ""}`, expired: false };
}