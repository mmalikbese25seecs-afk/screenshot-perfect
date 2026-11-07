import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Flame } from "lucide-react";
import { storeInfo } from "@/lib/store-config";

const SESSION_KEY = "pindi-splash-shown";

/** Full-screen animated splash shown once per browser session. */
export function SplashScreen() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const alreadyShown = sessionStorage.getItem(SESSION_KEY);
    if (alreadyShown) return;
    setVisible(true);
    sessionStorage.setItem(SESSION_KEY, "1");
    const timer = setTimeout(() => setVisible(false), 1600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="bg-ember-gradient fixed inset-0 z-100 grid place-items-center"
          aria-hidden="true"
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-4"
          >
            <motion.span
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              className="glass grid size-20 place-items-center rounded-3xl shadow-glow"
            >
              <Flame className="size-10 text-secondary" strokeWidth={1.75} />
            </motion.span>
            <p className="font-display text-2xl font-bold tracking-wide text-primary-foreground">
              {storeInfo.brand}
            </p>
            <p className="text-xs tracking-[0.3em] text-primary-foreground/70 uppercase">
              {storeInfo.tagline}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
