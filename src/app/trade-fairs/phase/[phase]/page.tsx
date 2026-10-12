import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import TradeFairsClient from "../../TradeFairsClient";
import { getTradeFairsData } from "../../page";

export default async function TradeFairPhasePage({ params }: { params: Promise<{ phase: string }> }) {
  const { phase } = await params;
  const normalized = phase.toUpperCase();
  if (normalized !== "UPCOMING" && normalized !== "PAST") notFound();
  const data = await getTradeFairsData(await requireUser());
  return <TradeFairsClient {...data} mode="list" phaseFilter={normalized} nowIso={new Date().toISOString()} />;
}
