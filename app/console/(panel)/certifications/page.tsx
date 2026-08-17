import { CertificationReview } from "@/components/console/CertificationReview";
import { listCertificationReviews } from "@/lib/console/certifications";
import { requireConsole } from "@/lib/console/dal";

export const metadata = { title: "Certifications — sydHustle Console" };

/**
 * Skill certification review.
 *
 * Certification is OPTIONAL for every skill: nothing here gates a listing,
 * hides it, or blocks a booking. A certified Skill wears a mark and an
 * uncertified one is a Skill. What this queue decides is whether that mark is
 * earned, which is why the standard is documents rather than judgement.
 *
 * Waiting-on-us sorts first. A reviewer opening this page wants the work, and
 * sorting by date alone buries a fresh submission under a month of decided
 * ones.
 */
export default async function CertificationsPage() {
  await requireConsole();
  const reviews = await listCertificationReviews();

  const waiting = reviews.filter((review) => review.status === "submitted");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Certifications</h1>
        <p className="text-sm text-muted-foreground">
          Hustlers send a certificate, a licence or a training document for one
          Skill. Certify it, reject it, or type what else you need and they get
          an email plus a standing notice in the app.
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <p className="font-semibold">Nothing submitted yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This fills up once Hustlers start sending documents from the app.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {waiting.length === 0
              ? "Nothing waiting on us."
              : `${waiting.length} waiting on us.`}{" "}
            {reviews.length} total.
          </p>
          <div className="space-y-4">
            {reviews.map((review) => (
              <CertificationReview key={review.skillId} review={review} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
