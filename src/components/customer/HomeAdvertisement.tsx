import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AD_DURATION_MS, validAdDestination } from "@/lib/advertisements";
import type { Offer } from "@/lib/api";
import { takeAdDraftPreview } from "@/lib/preview";

export function Advertisement({ ad, draft = false }: { ad: Offer; draft?: boolean }) {
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setClosed(true), AD_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, []);
  if (closed || !validAdDestination(ad)) return null;

  const content = (
    <>
      {ad.image && <img src={ad.image} alt="" className="h-36 w-full object-cover sm:h-44" />}
      <div className="p-4 pr-16">
        <p className="text-xs font-semibold text-muted-foreground">
          {draft ? "Unsaved ad preview" : ad.linkType === "external" ? "Sponsored" : "Featured deal"}
          {ad.tag && ` · ${ad.tag}`}
        </p>
        <h2 className="font-display mt-1 break-words text-lg font-bold">{ad.title}</h2>
        {ad.subtitle && <p className="mt-1 break-words text-sm text-muted-foreground">{ad.subtitle}</p>}
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
          {ad.cta || (ad.linkType === "external" ? "Visit website" : "View item")} <ArrowUpRight className="size-4" />
        </span>
      </div>
    </>
  );

  return (
    <aside aria-label="Homepage advertisement" className="fixed bottom-24 right-4 z-40 w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-lift sm:bottom-6 sm:right-6">
      {ad.linkType === "external" ? (
        <a href={ad.linkTarget} target="_blank" rel="noopener noreferrer sponsored" className="block focus-visible:outline-2 focus-visible:outline-primary">{content}</a>
      ) : (
        <Link to="/product/$slug" params={{ slug: ad.linkTarget }} className="block focus-visible:outline-2 focus-visible:outline-primary">{content}</Link>
      )}
      <Button variant="secondary" size="icon" aria-label="Close advertisement" title="Close advertisement" onClick={() => setClosed(true)} className="absolute right-2 top-2 size-11 shadow-soft"><X className="size-5" /></Button>
    </aside>
  );
}

export function HomeAdvertisement({ offers, enabled }: { offers: Offer[]; enabled: boolean }) {
  const [draft, setDraft] = useState<Offer | null>(null);
  useEffect(() => {
    const preview = takeAdDraftPreview();
    if (preview) setDraft(preview);
  }, []);
  const ad = draft ?? (enabled ? offers.find((offer) => offer.active && validAdDestination(offer)) : undefined);
  return ad ? <Advertisement key={ad.id} ad={ad} draft={Boolean(draft)} /> : null;
}