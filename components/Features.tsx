import { Briefcase, Users, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Briefcase,
    title: "Student side hustles",
    description:
      "A platform designed around how students actually find work, get paid, and balance studies.",
  },
  {
    icon: Users,
    title: "Built with community",
    description:
      "Connect with other student hustlers, share tips, and find opportunities on campus and beyond.",
  },
  {
    icon: Wrench,
    title: "Tools that help",
    description:
      "From finding gigs to getting paid — practical tools to make your hustle less stressful.",
  },
];

export function Features() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            What we&apos;re building
          </h2>
          <p className="mt-4 text-muted-foreground">
            Still early days — your feedback decides what comes first.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-white/10">
              <CardContent className="pt-2">
                <feature.icon className="mb-4 h-8 w-8 text-accent" />
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
