import SettingsClient from "@/components/SettingsClient";
import { requireUser } from "@/lib/auth";

export default async function SettingsSection({ params }: { params: Promise<{ section: string }> }) {
  const [{ section }, activeUser] = await Promise.all([params, requireUser()]);
  return <SettingsClient activeUser={activeUser} initialSection={section} />;
}
