import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";

const KEY = "pindi-install-dismissed";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallPrompt() {
  const [open, setOpen] = useState(false);
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);

  useEffect(() => {
    const last = window.localStorage.getItem(KEY);
    const shownToday = last && Date.now() - Number(last) < 24 * 60 * 60 * 1000;
    if (shownToday) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    const t = window.setTimeout(() => setOpen(true), 3500);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.clearTimeout(t);
    };
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(KEY, String(Date.now()));
    setOpen(false);
  };

  const install = async () => {
    if (deferred) await deferred.prompt();
    dismiss();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          role="dialog"
          aria-label="Install Pindi Crust app"
          className="glass-strong fixed inset-x-3 bottom-24 z-50 rounded-3xl p-4 shadow-lift sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-90"
        >
          <button
            onClick={dismiss}
            aria-label="Dismiss install prompt"
            className="absolute top-3 right-3 grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="size-4" />
          </button>
          <Logo compact />
          <h3 className="font-display mt-3 text-base font-bold">Install PINDI CRUST</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Add our app to your home screen for faster ordering, live tracking and members-only
            deals.
          </p>
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="hero" className="flex-1" onClick={install}>
              <Download /> Install App
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              Not now
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
