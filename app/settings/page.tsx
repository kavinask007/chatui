import { auth } from "../(auth)/auth";
import { SettingsComponent } from "@/components/settings-component";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session :any = await auth();

  if (!session?.user) {
    return redirect("/login");
  }

  return <SettingsComponent isAdmin={session.user.isAdmin || false} />;
}
