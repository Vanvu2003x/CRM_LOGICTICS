import { operationReports } from "./operation-reports";
import { db } from "./db";
import { assertOwner, manager, permittedUserIds, publicUserSelect, type PublicUser } from "./auth";
import { periodBounds } from "./business-rules";
import { todayInVietnam } from "./dashboard";
import { socialWinMetrics } from "./social-kpi";
import { attendanceMinutes, percentage, uniqueById } from "./report-metrics";

type ReportQuery = { date?: string; period?: string; sales?: string; team?: string };

function amountsByCurrency(items: { invoiceAmount: number | null; invoiceCurrency: string }[]) {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (!item.invoiceAmount) continue;
    totals.set(item.invoiceCurrency, (totals.get(item.invoiceCurrency) || 0) + item.invoiceAmount);
  }
  return [...totals.entries()].map(([currency, amount]) => ({ currency, amount }));
}

export async function analytics(user: PublicUser, query: ReportQuery = {}) {
  const day = query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date) ? query.date : todayInVietnam();
  const period = query.period === "day" || query.period === "week" ? query.period : "month";
  const { start, end } = periodBounds(day, period);
  const now = new Date();
  let ids = await permittedUserIds(user);

  if (query.sales) {
    await assertOwner(user, query.sales);
    ids = [query.sales];
  }
  if (query.team) {
    const members = await db.user.findMany({
      where: { teamId: query.team, role: { in: ["SALES", "MANAGER"] } },
      select: { id: true },
    });
    ids = members.map((member) => member.id).filter((id) => !ids || ids.includes(id));
  }

  const salesScope = ids ? { salesId: { in: ids } } : {};
  const userScope = ids ? { userId: { in: ids } } : {};
  const userWhere = ids ? { id: { in: ids } } : { role: { in: ["ADMIN", "SALES", "MANAGER"] } };
  const range = { gte: start, lt: end };
  const [users, calls, leads, orders, posts, attendance, products, fairs, teams] = await Promise.all([
    db.user.findMany({ where: userWhere, select: publicUserSelect, orderBy: { name: "asc" } }),
    db.callLog.findMany({ where: { ...salesScope, startedAt: range } }),
    db.lead.findMany({ where: salesScope }),
    db.order.findMany({ where: salesScope, include: { lead: { select: { source: true, originRef: true } } } }),
    db.socialPost.findMany({ where: { ...userScope, createdAt: range }, include: { order: true, lead: { include: { order: true } } } }),
    db.attendance.findMany({ where: { ...userScope, checkIn: range }, include: { posts: { include: { order: true, lead: { include: { order: true } } } } }, orderBy: { checkIn: "desc" } }),
    db.campaignProduct.findMany({ where: { ...userScope, OR: [{ createdAt: range }, { deadline: range }, { completedAt: range }, { deadline: null, campaign: { deadline: range } }] }, include: { campaign: true }, orderBy: { deadline: "asc" } }),
    db.tradeFairParticipation.findMany({
      where: { ...userScope, day: range, session: { not: "NONE" } },
      include: { fair: true, leads: { include: { crmLead: { include: { order: true } } } } },
      orderBy: { day: "desc" },
    }),
    db.team.findMany({ where: ids ? { users: { some: { id: { in: ids } } } } : {}, orderBy: { name: "asc" } }),
  ]);

  const within = (date: Date | null) => Boolean(date && date >= start && date < end);
  const createdLeads = leads.filter((lead) => within(lead.createdAt));
  const createdOrders = orders.filter((order) => within(order.createdAt));
  const completed = orders.filter((order) => within(order.completedAt));
  const failed = orders.filter((order) => within(order.failedAt));
  const paid = orders.filter((order) => within(order.paidAt));
  const answered = calls.filter((call) => call.status === "ANSWERED");
  const interested = createdLeads.filter((lead) => lead.isInterested || lead.interestState === "YES");
  const responseHours = createdLeads
    .filter((lead) => lead.firstContactAt)
    .map((lead) => Math.max(0, (lead.firstContactAt!.getTime() - lead.createdAt.getTime()) / 3_600_000));
  const currentReceivables = orders.filter((order) => order.invoiceAmount && !order.paidAt);
  const sevenDaysLater = new Date(now.getTime() + 7 * 86_400_000);
  const overdueInvoices = currentReceivables.filter((order) => order.dueDate && order.dueDate < now);
  const upcomingInvoices = currentReceivables.filter((order) => order.dueDate && order.dueDate >= now && order.dueDate <= sevenDaysLater);

  const sales = users.map((employee) => {
    const employeeCalls = calls.filter((call) => call.salesId === employee.id);
    const employeeLeads = createdLeads.filter((lead) => lead.salesId === employee.id);
    const employeeOrders = createdOrders.filter((order) => order.salesId === employee.id);
    const employeeCompleted = completed.filter((order) => order.salesId === employee.id);
    const employeePaid = paid.filter((order) => order.salesId === employee.id);
    const employeePosts = posts.filter((post) => post.userId === employee.id);
    const employeeAttendance = attendance.filter((item) => item.userId === employee.id);
    const employeeProducts = products.filter((product) => product.userId === employee.id);
    const employeeFairs = fairs.filter((fair) => fair.userId === employee.id);
    const employeeFairLeads = employeeFairs.flatMap((fair) => fair.leads);
    const employeeFairOrders = uniqueById(employeeFairLeads.flatMap((lead) => lead.crmLead?.order ? [lead.crmLead.order] : []));
    const social = socialWinMetrics(employeePosts);
    const socialLeads = uniqueById(employeePosts.flatMap((post) => post.lead ? [post.lead] : []));
    const metSocialSessions = employeeAttendance.filter((session) => {
      const sessionPosts = employeePosts.filter((post) => post.attendanceId === session.id);
      return sessionPosts.filter((post) => post.type === "POST").length >= 3
        && sessionPosts.filter((post) => post.type === "COMMENT").length >= 5;
    }).length;
    return {
      id: employee.id,
      name: employee.name,
      teamId: employee.teamId,
      extension: employee.extension,
      calls: employeeCalls.length,
      answeredCalls: employeeCalls.filter((call) => call.status === "ANSWERED").length,
      answerRate: percentage(employeeCalls.filter((call) => call.status === "ANSWERED").length, employeeCalls.length),
      duration: employeeCalls.reduce((sum, call) => sum + call.billsec, 0),
      leads: employeeLeads.length,
      interestedLeads: employeeLeads.filter((lead) => lead.isInterested || lead.interestState === "YES").length,
      orders: employeeOrders.length,
      completed: employeeCompleted.length,
      failed: failed.filter((order) => order.salesId === employee.id).length,
      conversionRate: percentage(employeeCompleted.length, employeeOrders.length),
      collected: employeePaid.reduce((sum, order) => sum + (order.invoiceAmount || 0), 0),
      collectedByCurrency: amountsByCurrency(employeePaid),
      overdue: leads.filter((lead) => lead.salesId === employee.id && lead.followUpAt && lead.followUpAt < now && ["NEW", "IN_PROGRESS"].includes(lead.status)).length,
      workMinutes: Math.round(attendanceMinutes(employeeAttendance, now)),
      attendanceSessions: employeeAttendance.length,
      socialPosts: employeePosts.filter((post) => post.type === "POST").length,
      socialComments: employeePosts.filter((post) => post.type === "COMMENT").length,
      socialQualified: social.qualified,
      socialLeads: socialLeads.length,
      socialWins: social.wins,
      metSocialSessions,
      campaigns: employeeProducts.filter((product) => product.type !== "PENALTY").length,
      campaignsDone: employeeProducts.filter((product) => product.type !== "PENALTY" && product.step === "DONE").length,
      penalties: employeeProducts.filter((product) => product.type === "PENALTY").length,
      fairSessions: employeeFairs.length,
      fairLeads: employeeFairLeads.length,
      fairHot: employeeFairLeads.filter((lead) => lead.quality === "HOT").length,
      fairWins: employeeFairOrders.filter((order) => order.status === "COMPLETED").length,
    };
  }).sort((a, b) => b.completed - a.completed || b.collected - a.collected || b.calls - a.calls);

  const sourceNames = [...new Set(createdLeads.map((lead) => lead.source || "MANUAL"))];
  const sources = sourceNames.map((source) => {
    const sourceLeads = createdLeads.filter((lead) => (lead.source || "MANUAL") === source);
    const sourceOrders = createdOrders.filter((order) => (order.lead?.source || "MANUAL") === source);
    const sourceCompleted = completed.filter((order) => (order.lead?.source || "MANUAL") === source);
    return {
      source,
      leads: sourceLeads.length,
      orders: sourceOrders.length,
      completed: sourceCompleted.length,
      conversionRate: percentage(sourceCompleted.length, sourceOrders.length),
      collected: paid.filter((order) => (order.lead?.source || "MANUAL") === source).reduce((sum, order) => sum + (order.invoiceAmount || 0), 0),
      collectedByCurrency: amountsByCurrency(paid.filter((order) => (order.lead?.source || "MANUAL") === source)),
    };
  }).sort((a, b) => b.completed - a.completed || b.leads - a.leads);

  const trend = [];
  for (let time = start.getTime(); time < end.getTime(); time += 86_400_000) {
    const date = new Date(time);
    const next = new Date(time + 86_400_000);
    const inDay = (value: Date | null) => Boolean(value && value >= date && value < next);
    trend.push({
      name: date.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit" }),
      calls: calls.filter((call) => inDay(call.startedAt)).length,
      leads: createdLeads.filter((lead) => inDay(lead.createdAt)).length,
      completed: completed.filter((order) => inDay(order.completedAt)).length,
    });
  }

  const fairLeads = fairs.flatMap((fair) => fair.leads);
  const fairOrders = uniqueById(fairLeads.flatMap((lead) => lead.crmLead?.order ? [lead.crmLead.order] : []));
  const fairWins = fairOrders.filter((order) => order.status === "COMPLETED");
  const socialWin = socialWinMetrics(posts);
  const socialLeads = uniqueById(posts.flatMap((post) => post.lead ? [post.lead] : []));
  const metSessions = attendance.filter((session) => {
    const sessionPosts = posts.filter((post) => post.attendanceId === session.id);
    return sessionPosts.filter((post) => post.type === "POST").length >= 3
      && sessionPosts.filter((post) => post.type === "COMMENT").length >= 5;
  }).length;

  return {
    operations: operationReports({ users, attendance, products, fairs, posts, now }),
    day,
    period,
    start: start.toISOString(),
    end: end.toISOString(),
    role: user.role,
    isManager: manager(user),
    users: users.map((employee) => ({ id: employee.id, name: employee.name, extension: employee.extension })),
    teams,
    sales,
    sources,
    trend,
    kpis: {
      calls: calls.length,
      answeredCalls: answered.length,
      answerRate: percentage(answered.length, calls.length),
      duration: calls.reduce((sum, call) => sum + call.billsec, 0),
      leads: createdLeads.length,
      interestedLeads: interested.length,
      orders: createdOrders.length,
      completed: completed.length,
      failed: failed.length,
      conversionRate: percentage(completed.length, createdOrders.length),
      collected: paid.reduce((sum, order) => sum + (order.invoiceAmount || 0), 0),
      collectedByCurrency: amountsByCurrency(paid),
      completedValue: completed.reduce((sum, order) => sum + (order.invoiceAmount || 0), 0),
      completedByCurrency: amountsByCurrency(completed),
      receivables: currentReceivables.reduce((sum, order) => sum + (order.invoiceAmount || 0), 0),
      receivablesByCurrency: amountsByCurrency(currentReceivables),
      overdueInvoices: overdueInvoices.length,
      upcomingInvoices: upcomingInvoices.length,
      overdueFollowups: leads.filter((lead) => lead.followUpAt && lead.followUpAt < now && ["NEW", "IN_PROGRESS"].includes(lead.status)).length,
      responseHours: responseHours.length ? Math.round(responseHours.reduce((a, b) => a + b, 0) / responseHours.length * 10) / 10 : null,
      workMinutes: Math.round(attendanceMinutes(attendance, now)),
    },
    marketing: {
      products: products.filter((product) => product.type !== "PENALTY").length,
      done: products.filter((product) => product.type !== "PENALTY" && product.step === "DONE").length,
      campaignDoneRate: percentage(products.filter((product) => product.type !== "PENALTY" && product.step === "DONE").length, products.filter((product) => product.type !== "PENALTY").length),
      penalties: products.filter((product) => product.type === "PENALTY").length,
      fairs: fairs.length,
      fairLeads: fairLeads.length,
      fairHot: fairLeads.filter((lead) => lead.quality === "HOT").length,
      fairWarm: fairLeads.filter((lead) => lead.quality === "WARM").length,
      fairCold: fairLeads.filter((lead) => lead.quality === "COLD").length,
      fairOrders: fairOrders.length,
      fairWins: fairWins.length,
      fairWinRate: percentage(fairWins.length, fairOrders.length),
      posts: posts.filter((post) => post.type === "POST").length,
      comments: posts.filter((post) => post.type === "COMMENT").length,
      socialQualified: socialWin.qualified,
      socialLeads: socialLeads.length,
      socialOrders: socialWin.linkedOrders,
      socialWins: socialWin.wins,
      socialWinRate: socialWin.winRate,
      socialWonValue: socialWin.wonValue,
      sessions: attendance.length,
      metSessions,
      socialCompletionRate: percentage(metSessions, attendance.length),
    },
  };
}

export type Analytics = Awaited<ReturnType<typeof analytics>>;
