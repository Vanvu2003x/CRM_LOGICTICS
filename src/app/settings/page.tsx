import { requireUser } from "@/lib/auth";
import SettingsClient from "@/components/SettingsClient";

export default async function SettingsPage() {
  const activeUser = await requireUser();
  return <SettingsClient activeUser={activeUser} />;
}
