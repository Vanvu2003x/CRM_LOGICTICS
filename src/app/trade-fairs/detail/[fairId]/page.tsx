import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import TradeFairsClient from "../../TradeFairsClient";
import { getTradeFairsData } from "../../page";

export default async function TradeFairDetailPage({ params }: { params: Promise<{ fairId: string }> }) {
  const { fairId } = await params;
  const data = await getTradeFairsData(await requireUser(), fairId);
  if (!data.fairs.length) notFound();
  return <TradeFairsClient {...data} mode="detail" detailFairId={fairId} nowIso={new Date().toISOString()} />;
}
