"use client";

import type { MouseEvent } from "react";

type Props = { skillId: string; appStoreUrl: string; playStoreUrl: string };

const storeLinkClassName =
  "inline-flex min-h-14 items-center justify-center rounded-full border border-white/20 px-7 text-sm font-semibold text-white transition hover:border-teal-300";

function openSkillOrStore(
  event: MouseEvent<HTMLAnchorElement>,
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

  event.preventDefault();
  const storeUrl = isIOS ? appStoreUrl : playStoreUrl;
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
  window.location.href = `sydhustle:///skill/${encodeURIComponent(skillId)}`;

  window.setTimeout(() => {
    cleanup();
    if (!appTookOver && document.visibilityState === "visible") {
      window.location.assign(storeUrl);
    }
  }, 1800);
}

export function StoreFallback({ skillId, appStoreUrl, playStoreUrl }: Props) {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <a
        className="inline-flex min-h-16 w-full items-center justify-center gap-3 rounded-full bg-[#14b8a6] px-7 py-4 text-lg font-bold text-[#06201e] shadow-lg shadow-teal-950/30 transition hover:bg-teal-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-300 sm:w-auto sm:min-w-80"
        href={`sydhustle:///skill/${encodeURIComponent(skillId)}`}
        onClick={(event) =>
          openSkillOrStore(event, skillId, appStoreUrl, playStoreUrl)
        }
      >
        Book this Skill
        <span aria-hidden="true" className="text-2xl leading-none">→</span>
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
