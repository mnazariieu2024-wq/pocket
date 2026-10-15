import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ExpenseTracker from "@/components/ExpenseTracker";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My budget — Pocket" };

export default async function AppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="container app-page">
      <ExpenseTracker userId={user.id} />
    </div>
  );
}
