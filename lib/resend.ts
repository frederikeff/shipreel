import { Resend } from "resend";
import type { Reel } from "./types";

// Resend notifications. Sends a real email when RESEND_API_KEY is set,
// otherwise logs the notification so the flow still completes.
export function resendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export interface NotifyResult {
  sent: boolean;
  to: string | null;
  detail: string;
}

export async function notifyReelReady(reel: Reel, event: string): Promise<NotifyResult> {
  const to = reel.ownerEmail || process.env.SHIPREEL_NOTIFY_EMAIL || null;
  const from = process.env.RESEND_FROM || "ShipReel <onboarding@resend.dev>";

  if (!to) {
    return { sent: false, to: null, detail: "No recipient email configured" };
  }
  if (!resendConfigured()) {
    console.log(`[resend:mock] → ${to}: "${event}" for reel ${reel.id}`);
    return { sent: false, to, detail: "RESEND_API_KEY missing — logged only" };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const previewUrl = `${appUrl()}/reel/${reel.id}`;
    await resend.emails.send({
      from,
      to,
      subject: `🎬 ${event}: "${reel.script?.title || reel.topic}"`,
      html: emailHtml(reel, event, previewUrl),
    });
    return { sent: true, to, detail: "Email sent via Resend" };
  } catch (err) {
    console.warn("[resend] send failed:", err);
    return { sent: false, to, detail: String(err) };
  }
}

function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

function emailHtml(reel: Reel, event: string, url: string): string {
  const posts = reel.posts
    .map((p) => `<li>${p.platform}: ${p.status}${p.url ? ` — <a href="${p.url}">${p.url}</a>` : ""}</li>`)
    .join("");
  return `
  <div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto">
    <h2 style="margin-bottom:4px">🎬 ${event}</h2>
    <p style="color:#555;margin-top:0">${reel.script?.title || reel.topic}</p>
    <p>Your reel is ready in ${reel.renders.length} format(s), hosted by character <b>${reel.characterId}</b>.</p>
    ${posts ? `<ul>${posts}</ul>` : ""}
    <p><a href="${url}" style="display:inline-block;background:#7c5cff;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Open in ShipReel</a></p>
  </div>`;
}
