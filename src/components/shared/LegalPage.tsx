import { useState } from "react";
import { PageHeader } from "@/components/shared/Primitives";
import { cn } from "@/lib/utils";

export type LegalSection = { id: string; title: string; body: string[] };

export function LegalPage({
  title,
  subtitle,
  updated,
  sections,
}: {
  title: string;
  subtitle: string;
  updated: string;
  sections: LegalSection[];
}) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <PageHeader title={title} subtitle={subtitle} />
      <p className="mt-3 inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
        Last updated {updated}
      </p>

      <div className="mt-8 gap-8 lg:grid lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="On this page" className="hidden lg:block">
          <div className="sticky top-24 space-y-1">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={() => setActive(s.id)}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  active === s.id
                    ? "bg-primary-soft text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {s.title}
              </a>
            ))}
          </div>
        </nav>

        <div className="min-w-0 space-y-5">
          {sections.map((s, i) => (
            <section
              key={s.id}
              id={s.id}
              className="scroll-mt-24 rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-7"
            >
              <h2 className="font-display text-lg font-bold sm:text-xl">
                <span className="mr-2 text-primary">{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </h2>
              <div className="mt-3 space-y-3">
                {s.body.map((p, j) => (
                  <p key={j} className="text-sm leading-relaxed text-muted-foreground text-pretty">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
