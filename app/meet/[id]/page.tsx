import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import MeetPage from "@/components/MeetPage";
import type { Meeting } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: meeting } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", id)
    .single();

  if (!meeting) notFound();

  return <MeetPage meeting={meeting as Meeting} />;
}
