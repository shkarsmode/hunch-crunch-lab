import type { Metadata } from "next";
import { CHANNEL_URL, PRICE } from "@/lib/site";

export const metadata: Metadata = { title: "Terms", description: "The simple rules of Hunch Crunch Lab." };

const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export default function Page() {
  return (
    <article className="mx-auto max-w-2xl px-4 pt-10 text-[15px] leading-relaxed text-ink/60 [&_h2]:mt-9 [&_h2]:text-[20px] [&_h2]:font-semibold [&_h2]:tracking-[-0.02em] [&_h2]:text-ink [&_p]:mt-3">
      <h1 className="headline text-[42px] leading-none text-ink">Terms</h1>
      <p>Updated October 29, 2026. By using Hunch Crunch Lab you agree to these simple rules.</p>
      <h2>The lab</h2>
      <p>The experiments are here for fun and learning, as they are. The setup from each video is free to play. We may add, change or retire experiments and features.</p>
      <h2>Supporters</h2>
      <p>Supporter access costs {PRICE} a month through Patreon and unlocks every experiment and setting while your membership is active. You manage or cancel it on Patreon, and Patreon&apos;s terms cover payments and refunds.</p>
      <h2>Ideas</h2>
      <p>When you send an idea, you let us use it in videos and credit you by the display name you chose. We may edit or hide ideas that are spam or not kind.</p>
      <h2>Fair play</h2>
      <p>Don&apos;t try to break, overload or scrape the site, and don&apos;t use it to bother anyone. We may block accounts that do.</p>
      <h2>Contact</h2>
      <p>
        {contact ? (
          <a href={`mailto:${contact}`} className="font-bold text-ink underline">{contact}</a>
        ) : (
          <a href={CHANNEL_URL} target="_blank" rel="noreferrer" className="font-bold text-ink underline">The Hunch Crunch channel on YouTube</a>
        )}
        .
      </p>
    </article>
  );
}
