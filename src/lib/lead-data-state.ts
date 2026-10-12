type LeadData = { salesId?: string | null; callOutcome?: string | null };
export function matchesLeadData(lead: LeadData, allocation: string, classification: string) {
  const assigned = Boolean(lead.salesId);
  const classified = Boolean(lead.callOutcome && lead.callOutcome !== "UNKNOWN");
  return (allocation === "ALL" || (allocation === "POOL" ? !assigned : assigned))
    && (classification === "ALL" || (classification === "CLASSIFIED" ? classified : !classified));
}
export function exhaustedAllocation(leads: { status: string; callOutcome: string; assignedAt: Date | null }[]) {
  const allocations = leads.filter(lead => lead.assignedAt);
  if (!allocations.length || leads.some(lead => lead.status === "NEW" && lead.callOutcome === "UNKNOWN")) return null;
  return Math.max(...allocations.map(lead => lead.assignedAt!.getTime()));
}
