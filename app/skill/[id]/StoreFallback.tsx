type Props = { skillId: string; appStoreUrl: string; playStoreUrl: string };

const storeLinkClassName =
  "inline-flex min-h-14 items-center justify-center rounded-full border border-white/20 px-7 text-sm font-semibold text-white transition hover:border-teal-300";

export function StoreFallback({ skillId, appStoreUrl, playStoreUrl }: Props) {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <a
        className="inline-flex min-h-14 items-center justify-center rounded-full bg-[#14b8a6] px-7 text-sm font-bold text-[#06201e] transition hover:bg-teal-300"
        href={`sydhustle:///skill/${encodeURIComponent(skillId)}`}
      >
        Open in sydHustle
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
