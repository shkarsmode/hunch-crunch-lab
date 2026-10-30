import type { Metadata } from "next";
import { CHANNEL_URL } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy", description: "What Hunch Crunch Lab collects and why." };

const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export default function Page() {
  return (
    <article className="selectable mx-auto max-w-2xl px-4 pt-10 text-[15px] leading-relaxed text-ink/60 [&_h2]:mt-9 [&_h2]:text-[20px] [&_h2]:font-semibold [&_h2]:tracking-[-0.02em] [&_h2]:text-ink [&_li]:mt-1.5 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
      <h1 className="headline text-[42px] leading-none text-ink">Privacy</h1>
      <p>Updated October 29, 2026. Short version: we collect as little as we can, we never sell anything, and there are no ads or tracking cookies.</p>
      <h2>What we collect</h2>
      <ul>
        <li><b className="text-ink">If you sign in with Google:</b> your name, email address and profile picture, so we know who to unlock.</li>
        <li><b className="text-ink">If you connect Patreon:</b> your Patreon user ID and whether your membership is active, and for how many months. Patreon handles payments; we never see card details.</li>
        <li><b className="text-ink">Ideas you send:</b> the text and the display name you choose.</li>
        <li><b className="text-ink">Visit counts:</b> per day, page, country, device type (phone or desktop) and where the visit came from (YouTube, search, social, direct). Country comes from your IP address, which we don&apos;t store. There are no individual visitor records.</li>
      </ul>
      <h2>Cookies</h2>
      <p>Only the ones sign-in needs, plus a short-lived security cookie while you connect Patreon. No analytics or advertising cookies.</p>
      <h2>Who helps us run it</h2>
      <p>Vercel hosts the site. Supabase stores the database and handles sign-in. Google provides the sign-in. Patreon handles memberships and payments.</p>
      <h2>Supporter wall</h2>
      <p>Supporters appear on the wall with their first name and last initial, or a name they pick. You can hide yourself on the Support page at any time.</p>
      <h2>Your data, your call</h2>
      <p>Ask us to see, fix or delete your data and we will. We keep it until you ask us to delete your account.</p>
      <p>
        Contact:{" "}
        {contact ? (
          <a href={`mailto:${contact}`} className="font-bold text-ink underline">{contact}</a>
        ) : (
          <a href={CHANNEL_URL} target="_blank" rel="noreferrer" className="font-bold text-ink underline">the Hunch Crunch channel on YouTube</a>
        )}
        .
      </p>
      <h2>Kids</h2>
      <p>The lab is open to everyone, but signing in needs a Google account, so it follows Google&apos;s age rules.</p>
    </article>
  );
}
