"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";

type Props = { skillId: string; appStoreUrl: string; playStoreUrl: string };

const storeLinkClassName =
  "inline-flex min-h-14 items-center justify-center rounded-full border border-white/20 px-7 text-sm font-semibold text-white transition hover:border-teal-300";

function openSkillOrStore(
  skillId: string,
  appStoreUrl: string,
  playStoreUrl: string,
) {
  const agent = navigator.userAgent;
  const isIOS =
    /iPhone|iPad|iPod/i.test(agent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(agent);
  if (!isIOS && !isAndroid) return;
  const storeUrl = isIOS ? appStoreUrl : playStoreUrl;
  const deepLink = `sydhustle:///skill/${encodeURIComponent(skillId)}`;
  let appTookOver = false;
  const markAppTookOver = () => {
    appTookOver = true;
  };
  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") markAppTookOver();
  };
  const cleanup = () => {
    window.removeEventListener("pagehide", markAppTookOver);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };

  window.addEventListener("pagehide", markAppTookOver);
  document.addEventListener("visibilitychange", onVisibilityChange);

  if (isAndroid) {
    // Android's intent URL supplies a native browser fallback, so a missing
    // app never leaves the user on an invalid custom-scheme address.
    const fallback = encodeURIComponent(storeUrl);
    window.location.href =
      `intent:///skill/${encodeURIComponent(skillId)}` +
      `#Intent;scheme=sydhustle;package=com.sydhustle.app;` +
      `S.browser_fallback_url=${fallback};end`;
    return;
  }

  // Navigating the top-level page to an unregistered scheme makes iOS show
  // an "invalid address" alert, which blocks our store fallback timer. A
  // hidden frame attempts the app link silently; if it is not installed,
  // the page stays visible and the timer sends the user to the App Store.
  const frame = document.createElement("iframe");
  frame.hidden = true;
  frame.setAttribute("aria-hidden", "true");
  frame.src = deepLink;
  document.body.appendChild(frame);
  window.setTimeout(() => frame.remove(), 1000);

  window.setTimeout(() => {
    cleanup();
    if (!appTookOver && document.visibilityState === "visible") {
      window.location.assign(storeUrl);
    }
  }, 1800);
}

export function StoreFallback({ skillId, appStoreUrl, playStoreUrl }: Props) {
  const [opening, setOpening] = useState(false);
  const openingRef = useRef(false);

  useEffect(() => {
    const resetOpening = () => {
      if (document.visibilityState !== "visible") return;
      openingRef.current = false;
      setOpening(false);
    };

    document.addEventListener("visibilitychange", resetOpening);
    window.addEventListener("pageshow", resetOpening);
    window.addEventListener("focus", resetOpening);
    return () => {
      document.removeEventListener("visibilitychange", resetOpening);
      window.removeEventListener("pageshow", resetOpening);
      window.removeEventListener("focus", resetOpening);
    };
  }, []);

  function handleBookClick(event: MouseEvent<HTMLAnchorElement>) {
    const agent = navigator.userAgent;
    const isIOS =
      /iPhone|iPad|iPod/i.test(agent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(agent);
    if (!isIOS && !isAndroid) return;

    event.preventDefault();
    if (openingRef.current) return;
    openingRef.current = true;
    setOpening(true);

    // Let the button paint its loading state before asking the OS to switch apps.
    window.setTimeout(
      () => openSkillOrStore(skillId, appStoreUrl, playStoreUrl),
      80,
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <a
        className="inline-flex min-h-16 w-full items-center justify-center gap-3 rounded-full bg-[#14b8a6] px-7 py-4 text-lg font-bold text-[#06201e] shadow-lg shadow-teal-950/30 transition hover:bg-teal-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-300 sm:w-auto sm:min-w-80"
        href={`https://www.sydhustle.com/skill/${encodeURIComponent(skillId)}`}
        aria-busy={opening}
        onClick={handleBookClick}
      >
        {opening ? (
          <>
            <span
              aria-hidden="true"
              className="h-5 w-5 animate-spin rounded-full border-2 border-current border-r-transparent"
            />
            <span>Opening sydHustle…</span>
          </>
        ) : (
          <>
            Book this Skill
            <span aria-hidden="true" className="text-2xl leading-none">→</span>
          </>
        )}
      </a>
      <a className={storeLinkClassName} href={appStoreUrl}>
        App Store
      </a>
      <a className={storeLinkClassName} href={playStoreUrl}>
        Google Play
      </a>
    </div>
  );
}
