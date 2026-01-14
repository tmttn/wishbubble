"use client";

import Link from "next/link";
import { useTypedTranslations } from "@/i18n/useTypedTranslations";
import { Plus, TreePine, Cake, Gift, Heart, Baby, GraduationCap, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const iconMap = {
  "tree-pine": TreePine,
  cake: Cake,
  gift: Gift,
  heart: Heart,
  baby: Baby,
  "graduation-cap": GraduationCap,
  home: Home,
};

interface OccasionHeroProps {
  title: string;
  description: string;
  color: string;
  gradient: string;
  icon: keyof typeof iconMap;
  emoji: string;
  occasionType: string;
}

export function OccasionHero({
  title,
  description,
  color,
  gradient,
  icon,
  emoji,
  occasionType,
}: OccasionHeroProps) {
  const t = useTypedTranslations("occasions");
  const Icon = iconMap[icon] || Gift;

  return (
    <div className="relative overflow-hidden rounded-3xl mb-12">
      {/* Full-width gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-15`} />

      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl animate-pulse opacity-30"
          style={{ backgroundColor: color }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-3xl animate-pulse opacity-20"
          style={{ backgroundColor: color, animationDelay: "1s" }}
        />
      </div>

      {/* Pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='${encodeURIComponent(color)}' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      {/* Floating emoji decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-8 left-[15%] text-4xl animate-bounce opacity-60" style={{ animationDuration: "3s" }}>
          {emoji}
        </div>
        <div className="absolute top-16 right-[10%] text-3xl animate-bounce opacity-40" style={{ animationDuration: "4s", animationDelay: "0.5s" }}>
          {emoji}
        </div>
        <div className="absolute bottom-12 left-[25%] text-2xl animate-bounce opacity-50" style={{ animationDuration: "3.5s", animationDelay: "1s" }}>
          {emoji}
        </div>
        <div className="absolute bottom-20 right-[20%] text-3xl animate-bounce opacity-40" style={{ animationDuration: "4.5s", animationDelay: "1.5s" }}>
          {emoji}
        </div>
      </div>

      <div className="relative py-20 md:py-28 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Icon with gradient ring */}
          <div className="relative inline-flex items-center justify-center mb-8">
            <div
              className={`absolute w-32 h-32 rounded-full bg-gradient-to-br ${gradient} opacity-20 blur-lg`}
            />
            <div
              className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-2xl`}
              style={{ boxShadow: `0 20px 50px -10px ${color}50` }}
            >
              <Icon className="h-12 w-12 md:h-14 md:w-14 text-white" />
            </div>
          </div>

          {/* Title with gradient text */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-6">
            <span
              className="bg-gradient-to-r bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(to right, ${color}, ${color}dd, ${color})` }}
            >
              {title}
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            {description}
          </p>

          {/* CTA Button */}
          <Button
            size="lg"
            asChild
            className="h-14 px-8 text-lg rounded-xl shadow-xl transition-all hover:scale-105"
            style={{
              backgroundColor: color,
              boxShadow: `0 10px 30px -5px ${color}40`
            }}
          >
            <Link href={`/bubbles/new?occasion=${occasionType}`}>
              <Plus className="h-5 w-5 mr-2" />
              {t("createBubble")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
