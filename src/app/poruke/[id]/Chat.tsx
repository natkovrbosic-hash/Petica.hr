"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { markRead, sendMessage } from "../../actions/messages";
import type { Message } from "@/lib/types";

const time = (d: string) => new Date(d).toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Zagreb" });
const day = (d: string) => new Date(d).toLocaleDateString("hr-HR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Zagreb" });

export function Chat({ conversationId, userId, initial }: { conversationId: string; userId: string; initial: Message[] }) {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const bottom = useRef<HTMLDivElement>(null);

  // Real-time: nove poruke u ovom razgovoru (Supabase Realtime poštuje RLS, pa se kanal mora spojiti
  // s tokenom prijavljenog korisnika — zato prvo setAuth, pa tek onda subscribe).
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) await supabase.realtime.setAuth(data.session.access_token);
      channel = supabase
        .channel(`conv:${conversationId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
          (payload) => {
            const m = payload.new as Message;
            setMessages((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur, m]));
            if (m.sender_id !== userId) void markRead(conversationId);
          },
        )
        .subscribe();
    })();
    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [conversationId, userId]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const send = () => {
    const body = text.trim();
    if (!body) return;
    setErr(null);
    setText("");
    start(async () => {
      const res = await sendMessage(conversationId, body);
      if (res.error || !res.message) {
        setErr(res.error ?? "Poruka nije poslana.");
        setText(body);
        return;
      }
      const m = res.message as Message;
      setMessages((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur, m]));
    });
  };

  return (
    <>
      <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50 px-3 py-4 sm:border-x sm:border-slate-200">
        {messages.length === 0 && <p className="text-center text-sm text-slate-500">Još nema poruka.</p>}
        {messages.map((m, i) => {
          const mine = m.sender_id === userId;
          const d = day(m.created_at);
          const showDay = i === 0 || d !== day(messages[i - 1].created_at);
          return (
            <div key={m.id}>
              {showDay && <p className="my-3 text-center text-xs font-semibold text-slate-500">{d}</p>}
              <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-[10px] px-3.5 py-2 text-[15px] whitespace-pre-wrap shadow-sm ${mine ? "rounded-br-sm bg-brand-600 text-white" : "rounded-bl-sm bg-white text-slate-900"}`}
                >
                  {m.body}
                  <span className={`mt-0.5 block text-right text-[11px] ${mine ? "text-brand-100" : "text-slate-400"}`}>
                    {time(m.created_at)}
                    {mine && m.read_at ? ", pročitano" : ""}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      <form
        className="flex items-end gap-2 border-t border-slate-200 bg-white p-3 sm:rounded-b-2xl sm:border"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <textarea
          className="input max-h-40 min-h-11 flex-1 resize-none"
          rows={1}
          value={text}
          maxLength={4000}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Napišite poruku…"
          aria-label="Poruka"
        />
        <button className="btn-primary" disabled={pending || !text.trim()}>Pošalji</button>
      </form>
      {err && <p className="bg-white px-4 pb-2 text-sm text-red-600">{err}</p>}
      <p className="bg-white px-4 pb-3 text-[11px] text-slate-400 sm:rounded-b-2xl">
        Ne dijelite podatke o kartici. Plaćanje instrukcija dogovarate izravno — Instrukcije24.hr nikad ne traži uplatu za sate.
      </p>
    </>
  );
}
