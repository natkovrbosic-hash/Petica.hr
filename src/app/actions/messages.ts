"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/notify";

const MAX = 4000;

/** Email primatelju samo za prvu nepročitanu poruku u razgovoru (bez spama za svaku poruku). */
async function notifyRecipient(conversationId: string, senderId: string, body: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    const admin = createAdminClient();
    const { data: c } = await admin
      .from("conversations")
      .select("id, student_id, tutor_id, tutors(display_name), profiles!conversations_student_id_fkey(full_name)")
      .eq("id", conversationId)
      .single();
    if (!c) return;
    const recipientId = c.student_id === senderId ? c.tutor_id : c.student_id;
    const { count } = await admin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conversationId)
      .eq("sender_id", senderId)
      .is("read_at", null);
    if ((count ?? 0) > 1) return;
    const { data: rp } = await admin.from("profiles").select("email_notifications").eq("id", recipientId).single();
    if (!rp?.email_notifications) return;
    const { data: u } = await admin.auth.admin.getUserById(recipientId);
    if (!u.user?.email) return;
    const tutorName = (c.tutors as unknown as { display_name: string } | null)?.display_name ?? "instruktor";
    const studentName = (c.profiles as unknown as { full_name: string } | null)?.full_name ?? "korisnik";
    const senderName = senderId === c.tutor_id ? tutorName : studentName;
    await sendEmail({
      to: u.user.email,
      subject: `Nova poruka od: ${senderName}`,
      text: `Primili ste novu poruku na Petica.hr.\nPošiljatelj: ${senderName}\n\n„${body.slice(0, 300)}${body.length > 300 ? "…" : ""}”`,
      link: `/poruke/${conversationId}`,
    });
  } catch (e) {
    console.error("[notify] poruka", e);
  }
}

export async function startConversation(tutorId: string, body: string) {
  const text = body.trim().slice(0, MAX);
  if (!text) return { error: "Napišite poruku." };
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Prijavite se za slanje poruke." };
  if (auth.user.id === tutorId) return { error: "Ne možete slati poruke sami sebi." };

  let { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("student_id", auth.user.id)
    .eq("tutor_id", tutorId)
    .maybeSingle();
  if (!conv) {
    const res = await supabase.from("conversations").insert({ student_id: auth.user.id, tutor_id: tutorId }).select("id").single();
    if (res.error) return { error: "Razgovor nije moguće započeti." };
    conv = res.data;
  }
  const { error } = await supabase.from("messages").insert({ conversation_id: conv.id, sender_id: auth.user.id, body: text });
  if (error) return { error: "Poruka nije poslana." };
  await notifyRecipient(conv.id, auth.user.id, text);
  redirect(`/poruke/${conv.id}`);
}

export async function sendMessage(conversationId: string, body: string) {
  const text = body.trim().slice(0, MAX);
  if (!text) return { error: "Prazna poruka." };
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Niste prijavljeni." };
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: auth.user.id, body: text })
    .select("*")
    .single();
  if (error) return { error: "Poruka nije poslana." };
  await notifyRecipient(conversationId, auth.user.id, text);
  revalidatePath("/poruke");
  return { message: data };
}

export async function markRead(conversationId: string) {
  const supabase = await createClient();
  await supabase.rpc("mark_conversation_read", { p_conversation: conversationId });
}
