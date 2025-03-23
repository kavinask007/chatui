import { cookies } from "next/headers";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { auth } from "../(auth)/auth";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import { notFound, redirect } from "next/navigation";
export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get("sidebar:state")?.value !== "true";
  const v_session =await auth();
  if (!session?.user){
    return redirect("/login")
  }
  return (
    <>
      <>

        <SidebarProvider defaultOpen={!isCollapsed}>
          <AppSidebar user={session?.user} />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </>
    </>
  );
}
