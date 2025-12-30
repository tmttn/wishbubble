import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Gift,
  Users,
  Lock,
  Sparkles,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  const features = [
    {
      icon: Users,
      title: "Group-First Approach",
      description:
        "Start by creating a bubble (group) for your event. Invite friends and family, then share wishlists within the group.",
    },
    {
      icon: Lock,
      title: "Privacy-Aware Claims",
      description:
        "When someone claims an item from your wishlist, you won't see it. Others coordinate seamlessly while keeping the surprise.",
    },
    {
      icon: Gift,
      title: "Secret Santa Draw",
      description:
        "Built-in Secret Santa functionality with exclusion rules. Perfect for family events where couples shouldn't draw each other.",
    },
    {
      icon: Sparkles,
      title: "Reusable Wishlists",
      description:
        "Create your wishlist once and share it across multiple bubbles. Birthday, Christmas, and more - all from one list.",
    },
  ];

  const steps = [
    {
      step: "1",
      title: "Create a Bubble",
      description:
        "Set up your gift exchange event with a name, date, and optional budget range.",
    },
    {
      step: "2",
      title: "Invite Participants",
      description:
        "Send email invitations to friends and family. They can join with one click.",
    },
    {
      step: "3",
      title: "Share Wishlists",
      description:
        "Everyone adds their wishlist items. Browse others' lists and claim gifts to buy.",
    },
    {
      step: "4",
      title: "Coordinate Gifting",
      description:
        "See what's claimed, avoid duplicates, and keep the surprise intact for wishlist owners.",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-20 md:py-32">
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              The
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                {" "}
                group-first{" "}
              </span>
              wishlist for Secret Santa
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              Create bubbles, invite participants, share wishlists, and
              coordinate gift-giving without spoiling the surprise. Perfect for
              family gatherings, office parties, and friend groups.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 blur-3xl" aria-hidden="true">
          <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-primary to-purple-400 opacity-20" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Why WishBubble?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Traditional wishlists are personal. WishBubble is social.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature.title} className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{feature.title}</h3>
                      <p className="mt-2 text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-muted/50 py-20 md:py-28">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Get started in minutes, not hours
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-4">
            {steps.map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="mt-4 font-semibold text-lg">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-2xl bg-gradient-to-r from-primary to-purple-600 p-8 md:p-12 text-center text-white">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to simplify gift-giving?
              </h2>
              <p className="mt-4 text-lg opacity-90">
                Join thousands of families and friend groups who use WishBubble
                for their gift exchanges.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-8">
                <div>
                  <div className="text-3xl font-bold">10,000+</div>
                  <div className="text-sm opacity-80">Happy Users</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">25,000+</div>
                  <div className="text-sm opacity-80">Bubbles Created</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">100,000+</div>
                  <div className="text-sm opacity-80">Gifts Coordinated</div>
                </div>
              </div>
              <Button
                size="lg"
                variant="secondary"
                className="mt-8"
                asChild
              >
                <Link href="/register">
                  Create Your First Bubble
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Free to Start
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Create bubbles with up to 10 members and 25 wishlist items for free.
              Upgrade anytime for unlimited features.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Unlimited bubbles</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Secret Santa draw</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Email invitations</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Claim coordination</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
