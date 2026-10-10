"use client";

import { useEffect, useState } from "react";

type Props = { skillId: string; appStoreUrl: string; playStoreUrl: string };

export function StoreFallback({ skillId, appStoreUrl, playStoreUrl }: Props) {
  const [store, setStore] = useState<"ios" | "android" | null>(null);

  useEffect(() => {
    const agent = navigator.userAgent;
    const isIOS =
      /iPhone|iPad|iPod/i.test(agent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(agent);
    if (!isIOS && !isAndroid) return;

    const target = isIOS ? appStoreUrl : playStoreUrl;
    setStore(isIOS ? "ios" : "android");
    const timer = window.setTimeout(() => window.location.replace(target), 850);
    return () => window.clearTimeout(timer);
  }, [appStoreUrl, playStoreUrl]);

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <a
        className="inline-flex min-h-14 items-center justify-center rounded-full bg-[#14b8a6] px-7 text-sm font-bold text-[#06201e] transition hover:bg-teal-300"
        href={`sydhustle:///skill/${encodeURIComponent(skillId)}`}
      >
        Open in sydHustle
      </a>
      {store === "ios" ? (
        <a className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/20 px-7 text-sm font-semibold text-white transition hover:border-teal-300" href={appStoreUrl}>Get sydHustle</a>
      ) : store === "android" ? (
        <a className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/20 px-7 text-sm font-semibold text-white transition hover:border-teal-300" href={playStoreUrl}>Get sydHustle</a>
      ) : (
        <>
          <a className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/20 px-7 text-sm font-semibold text-white transition hover:border-teal-300" href={appStoreUrl}>App Store</a>
          <a className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/20 px-7 text-sm font-semibold text-white transition hover:border-teal-300" href={playStoreUrl}>Google Play</a>
        </>
      )}
    </div>
  );
}
