import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Message } from "@/lib/types";
import { Chat } from "./Chat";

export const metadata: Metadata = { title: "Razgovor", robots: { index: false } };

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireUser(`/poruke/${id}`);
  const supabase = await createClient();
  const { data: conv } = await supabase
    .from("conversations")
    .select("id, student_id, tutor_id, tutors(slug, display_name)")
    .eq("id", id)
    .maybeSingle();
  if (!conv) notFound();

  const [{ data: messages }, { data: list }] = await Promise.all([
    supabase.from("messages").select("*").eq("conversation_id", id).order("created_at").limit(500),
    supabase.rpc("my_conversations"),
  ]);
  await supabase.rpc("mark_conversation_read", { p_conversation: id });

  const tutor = conv.tutors as unknown as { slug: string; display_name: string };
  const isStudent = conv.student_id === user.id;
  const other = (list as { id: string; other_name: string }[] | null)?.find((c) => c.id === id)?.other_name ?? "Razgovor";

  return (
    <div className="mx-auto flex h-[calc(100dvh-3.75rem)] max-w-2xl flex-col px-0 sm:px-4 sm:py-4">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:rounded-t-2xl sm:border">
        <Link href="/poruke" className="text-xl text-slate-600" aria-label="Natrag na poruke"><ArrowLeft className="size-5" /></Link>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{other}</p>
          {isStudent && (
            <Link href={`/instruktor/${tutor.slug}`} className="text-xs text-brand-700">Profil instruktora</Link>
          )}
        </div>
        {isStudent && (
          <Link href={`/instruktor/${tutor.slug}#recenzije`} className="btn-secondary btn-sm">Ocijeni</Link>
        )}
      </div>
      <Chat conversationId={id} userId={user.id} initial={(messages ?? []) as Message[]} />
    </div>
  );
}
