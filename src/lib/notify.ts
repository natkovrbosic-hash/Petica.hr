import "server-only";
import { SITE_NAME, SITE_URL } from "./config";

// Obavijesti. Email ide preko Resenda (RESEND_API_KEY); bez ključa se samo ispisuje u konzolu (lokalni razvoj).

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function sendEmail({ to, subject, text, link }: { to: string; subject: string; text: string; link?: string }) {
  const url = link ? (link.startsWith("http") ? link : SITE_URL + link) : SITE_URL;
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#1f2937">
<p>${escape(text).replace(/\n/g, "<br>")}</p>
<p><a href="${url}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Otvori ${SITE_NAME}</a></p>
<p style="color:#6b7280;font-size:12px">Ovu poruku šalje ${SITE_NAME}. Email obavijesti možete isključiti u „Moj račun”.</p></div>`;

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email:dev] → ${to} | ${subject}\n${text}\n${url}`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM || `${SITE_NAME} <obavijesti@petica.hr>`, to, subject, html, text: `${text}\n\n${url}` }),
    });
    if (!res.ok) console.error("[email] Resend greška", res.status, await res.text());
  } catch (e) {
    console.error("[email] slanje nije uspjelo", e);
  }
}

/** TODO: SMS obavijesti (npr. Infobip ili Twilio) — za sada se ne šalju. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function sendSms(to: string, text: string) {
  // TODO(SMS): spojiti pružatelja SMS usluge, dodati broj mobitela i privolu za SMS u profil.
  return;
}
