export type CampaignHistoryEntry = {
  at?: string;
  by?: string;
  from?: string;
  to?: string;
  link?: string;
  notes?: string;
};

function validLink(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

export function campaignArtifacts(history: string | null | undefined) {
  let entries: CampaignHistoryEntry[] = [];
  try {
    const parsed = JSON.parse(history || "[]");
    if (Array.isArray(parsed)) entries = parsed;
  } catch {
    entries = [];
  }

  const scriptLink = entries.find(entry =>
    entry.from === "SCRIPT_DRAFT" && entry.to === "SCRIPT_APPROVED" && validLink(entry.link),
  )?.link;
  const productLink = entries.find(entry =>
    (entry.from === "PRODUCT_DRAFT" || entry.from === "PRODUCT_APPROVED") && validLink(entry.link),
  )?.link;
  const feedback = entries.filter(entry => typeof entry.notes === "string" && entry.notes.trim().length > 0);

  return { entries, scriptLink, productLink, feedback };
}
