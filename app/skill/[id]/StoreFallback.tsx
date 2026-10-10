type Props = { appStoreUrl: string; playStoreUrl: string };

const storeLinkClassName =
  "inline-flex min-h-14 items-center justify-center rounded-full border border-white/20 px-7 text-sm font-semibold text-white transition hover:border-teal-300";

export function StoreFallback({ appStoreUrl, playStoreUrl }: Props) {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <a className={storeLinkClassName} href={appStoreUrl}>
        App Store
      </a>
      <a className={storeLinkClassName} href={playStoreUrl}>
        Google Play
      </a>
    </div>
  );
}
