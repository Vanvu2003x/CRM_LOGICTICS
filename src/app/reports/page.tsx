import { analytics } from "@/lib/analytics";
import { requireUser } from "@/lib/auth";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const query = await searchParams;
  const activeUser = await requireUser();
  const data = await analytics(activeUser, query);
  return <ReportsClient data={data} query={query} activeUser={activeUser} />;
}
