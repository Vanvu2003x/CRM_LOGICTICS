import type { Attendance, CampaignProduct, Campaign, TradeFairParticipation, TradeFair, TradeFairLead, Lead, Order, SocialPost } from "@prisma/client";
import { attendanceMinutes, isLateAttendance, isEarlyAttendance } from "./attendance";
import { socialKpiProgress } from "./social-kpi";
import { uniqueById, percentage } from "./report-metrics";

type LinkedOrder = Pick<Order, "id" | "code" | "status">;
type LinkedLead = Pick<Lead, "id" | "name" | "isInterested" | "interestState" | "callOutcome"> & { order?: LinkedOrder | null };
export function linkedResults(items: { lead?: LinkedLead | null; order?: LinkedOrder | null }[]) {
  const leads = uniqueById(items.flatMap(item => item.lead ? [item.lead] : []));
  const orders = uniqueById(items.flatMap(item => [item.order, item.lead?.order].flatMap(order => order ? [order] : [])));
  return { customers: leads.length, interested: leads.filter(lead => lead.isInterested || lead.interestState === "YES" || lead.callOutcome === "INTERESTED").length,
    orders: orders.length, wins: orders.filter(order => order.status === "COMPLETED").length,
    orderCodes: orders.map(order => order.code).join(" · "), customerNames: leads.map(lead => lead.name).join(" · ") };
}
export function taskTiming(item: { step: string; completedAt: Date | null }, deadline: Date, now: Date) {
  if (item.step === "DONE") return !item.completedAt ? "UNKNOWN" : item.completedAt <= deadline ? "ON_TIME" : "LATE";
  return now > deadline ? "OVERDUE" : "ACTIVE";
}
export function fairSessionCount(session: string) { return session === "BOTH" ? 2 : session === "NONE" ? 0 : 1; }

type ReportPost = SocialPost & { lead: (Lead & { order: Order | null }) | null; order: Order | null };
type ReportFair = TradeFairParticipation & { fair: TradeFair; leads: (TradeFairLead & { crmLead: (Lead & { order: Order | null }) | null })[] };
export function operationReports(input: {
  users: { id: string; name: string; extension: string | null }[];
  attendance: (Attendance & { posts: ReportPost[] })[];
  products: (CampaignProduct & { campaign: Campaign })[];
  fairs: ReportFair[];
  posts: ReportPost[];
  now: Date;
}) {
  const names = new Map(input.users.map(user => [user.id, `${user.name}${user.extension ? ` · ${user.extension}` : ""}`]));
  const employee = (id: string) => names.get(id) || "Nhân viên";
  const attendance = input.attendance.map(session => ({
    id: session.id, employee: employee(session.userId), checkIn: session.checkIn.toISOString(), checkOut: session.checkOut?.toISOString() ?? null,
    minutes: attendanceMinutes([session], input.now), late: isLateAttendance(session), early: isEarlyAttendance(session),
    automatic: session.closeType === "AUTO_END_OF_DAY", closeType: session.closeType,
  }));
  const campaigns = input.products.map(product => ({
    id: product.id, employee: employee(product.userId), campaign: product.campaign.name, title: product.title || "Nội dung truyền thông",
    deadline: (product.deadline || product.campaign.deadline).toISOString(), completedAt: product.completedAt?.toISOString() ?? null,
    timing: taskTiming(product, product.deadline || product.campaign.deadline, input.now), step: product.step,
    penalty: product.type === "PENALTY", link: product.link,
  }));
  const fairs = input.fairs.map(part => ({
    id: part.id, employee: employee(part.userId), fair: part.fair.name, day: part.day?.toISOString() ?? null, session: part.session,
    sessions: fairSessionCount(part.session), resultAt: part.resultAt?.toISOString() ?? null, resultNote: part.resultNote,
    marketingLink: part.marketingLink,
    ...(() => { const result = linkedResults(part.leads.map(lead => ({ lead: lead.crmLead }))); return { ...result, customers: part.leads.length }; })(),
  }));
  const social = input.attendance.map(session => ({
    id: session.id, employee: employee(session.userId), checkIn: session.checkIn.toISOString(), checkOut: session.checkOut?.toISOString() ?? null,
    ...socialKpiProgress(session.posts), ...linkedResults(session.posts),
    links: session.posts.map(post => ({ id: post.id, link: post.link, type: post.type })),
  }));
  const normal = campaigns.filter(item => !item.penalty);
  const penalties = campaigns.filter(item => item.penalty);
  const fairResults = linkedResults(input.fairs.flatMap(part => part.leads.map(lead => ({ lead: lead.crmLead }))));
  // A lead can be linked to several pieces of evidence; count it once in totals.
  const fairCustomers = uniqueById(input.fairs.flatMap(part => part.leads.map(lead => ({ id: lead.crmLeadId || lead.id })))).length;
  const socialPosts = uniqueById(input.attendance.flatMap(session => session.posts));
  return { attendance, campaigns, fairs, social,
    attendanceSummary: { sessions: attendance.length, minutes: attendance.reduce((sum, row) => sum + row.minutes, 0), late: attendance.filter(row => row.late).length, early: attendance.filter(row => row.early).length, automatic: attendance.filter(row => row.automatic).length },
    campaignSummary: { assigned: normal.length, completed: normal.filter(row => row.step === "DONE").length, onTime: normal.filter(row => row.timing === "ON_TIME").length, late: normal.filter(row => row.timing === "LATE" || row.timing === "OVERDUE").length, penalties: penalties.length, missing: penalties.filter(row => row.step !== "DONE").length },
    fairSummary: { ...fairResults, customers: fairCustomers, sessions: fairs.reduce((sum, row) => sum + row.sessions, 0), submitted: fairs.filter(row => row.resultAt).length, marketing: fairs.filter(row => row.marketingLink).length },
    socialSummary: { ...linkedResults(socialPosts), sessions: social.length, posts: socialPosts.filter(post => post.type === "POST").length, comments: socialPosts.filter(post => post.type === "COMMENT").length, met: social.filter(row => row.done).length, rate: percentage(social.filter(row => row.done).length, social.length), unlinked: input.posts.filter(post => !post.attendanceId).length },
  };
}
export type OperationReports = ReturnType<typeof operationReports>;
