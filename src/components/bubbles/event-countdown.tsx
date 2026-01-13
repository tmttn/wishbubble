"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventCountdownProps {
  eventDate: Date;
  eventName: string;
  isEventPassed: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function EventCountdown({ eventDate, eventName: _eventName, isEventPassed }: EventCountdownProps) {
  const t = useTranslations("bubbles.countdown");
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    const calculateTimeLeft = (): TimeLeft | null => {
      const now = new Date();
      const difference = eventDate.getTime() - now.getTime();

      if (difference <= 0) {
        return null;
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

     
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [eventDate]);

  if (!mounted) {
    return null;
  }

  // Event has passed
  if (isEventPassed || !timeLeft) {
    return (
      <Card className="mb-6 bg-gradient-to-r from-accent/10 to-primary/10 border-accent/20">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <PartyPopper className="h-5 w-5 text-accent" />
            <span className="font-medium text-accent-foreground">
              {t("eventCompleted")}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isUrgent = timeLeft.days === 0;
  const isToday = timeLeft.days === 0 && timeLeft.hours < 24;

  return (
    <Card
      className={cn(
        "mb-6 overflow-hidden",
        isUrgent
          ? "bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20"
          : "bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20"
      )}
    >
      <CardContent className="py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            {isToday ? (
              <Clock className={cn("h-5 w-5", isUrgent ? "text-orange-600 dark:text-orange-400" : "text-primary")} />
            ) : (
              <Calendar className={cn("h-5 w-5", isUrgent ? "text-orange-600 dark:text-orange-400" : "text-primary")} />
            )}
            <span className={cn("font-medium", isUrgent && "text-orange-700 dark:text-orange-300")}>
              {isToday ? t("happeningToday") : t("countdownLabel")}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {timeLeft.days > 0 && (
              <TimeUnit value={timeLeft.days} label={t("days")} isUrgent={isUrgent} />
            )}
            <TimeUnit value={timeLeft.hours} label={t("hours")} isUrgent={isUrgent} />
            <TimeUnit value={timeLeft.minutes} label={t("minutes")} isUrgent={isUrgent} />
            <TimeUnit value={timeLeft.seconds} label={t("seconds")} isUrgent={isUrgent} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TimeUnit({ value, label, isUrgent }: { value: number; label: string; isUrgent: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "text-2xl sm:text-3xl font-bold tabular-nums min-w-[2.5rem] text-center",
          isUrgent ? "text-orange-600 dark:text-orange-400" : "text-primary"
        )}
      >
        {value.toString().padStart(2, "0")}
      </div>
      <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}
