export function autoFollowUpAt(callOutcome:string, existing:Date|null, previousNoAnswerCalls:number, startedAt:Date) {
  if (callOutcome !== "NO_ANSWER" || existing || previousNoAnswerCalls >= 2) return null;
  return new Date(startedAt.getTime() + 7 * 86400000);
}
