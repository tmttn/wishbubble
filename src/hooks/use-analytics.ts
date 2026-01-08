"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  trackEvent,
  trackJourneyStep,
  trackPageView,
  trackFeature,
  trackConversion,
  trackEngagement,
  EVENT_CATEGORIES,
  EVENT_ACTIONS,
  type EventCategory,
  type EventAction,
} from "@/lib/analytics-client";

/**
 * Hook for tracking analytics events and page views
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { track, trackJourney } = useAnalytics();
 *
 *   const handleClick = () => {
 *     track("feature", "click", "my_button");
 *     // ... handle click
 *   };
 *
 *   return <button onClick={handleClick}>Click me</button>;
 * }
 * ```
 */
export function useAnalytics() {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const mounted = useRef(false);

  // Auto-track page views on route changes
  useEffect(() => {
    if (!mounted.current) {
      // Track initial page view
      trackPageView(pathname);
      mounted.current = true;
    } else if (prevPathname.current !== pathname) {
      // Track subsequent page views
      trackPageView(pathname);
      prevPathname.current = pathname;
    }
  }, [pathname]);

  const track = useCallback(
    (
      category: EventCategory | string,
      action: EventAction | string,
      label?: string,
      value?: number
    ) => {
      trackEvent({ category, action, label, value });
    },
    []
  );

  const trackJourney = useCallback((journeyType: string, step: string) => {
    trackJourneyStep(journeyType, step);
  }, []);

  return {
    track,
    trackJourney,
    trackPageView,
    trackFeature,
    trackConversion,
    trackEngagement,
    EVENT_CATEGORIES,
    EVENT_ACTIONS,
  };
}

/**
 * Hook for tracking feature usage
 *
 * Automatically tracks when a feature is viewed (on mount),
 * and provides a function to track interactions.
 *
 * @example
 * ```tsx
 * function ChatFeature() {
 *   const { trackInteraction } = useFeatureTracking("bubble_chat");
 *
 *   const handleSend = () => {
 *     trackInteraction("send_message");
 *     // ... send message
 *   };
 *
 *   return <button onClick={handleSend}>Send</button>;
 * }
 * ```
 */
export function useFeatureTracking(featureName: string) {
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      trackFeature(featureName, EVENT_ACTIONS.VIEW);
      mounted.current = true;
    }
  }, [featureName]);

  const trackInteraction = useCallback(
    (action: EventAction | string, label?: string) => {
      trackFeature(featureName, action, label);
    },
    [featureName]
  );

  return { trackInteraction };
}

/**
 * Hook for tracking conversion funnels
 *
 * @example
 * ```tsx
 * function PricingPage() {
 *   const { startFunnel, completeFunnel } = useConversionTracking("signup");
 *
 *   useEffect(() => {
 *     startFunnel();
 *   }, []);
 *
 *   const handleComplete = () => {
 *     completeFunnel();
 *   };
 * }
 * ```
 */
export function useConversionTracking(funnelName: string) {
  const startFunnel = useCallback(() => {
    trackConversion(EVENT_ACTIONS.START, funnelName);
  }, [funnelName]);

  const completeFunnel = useCallback(
    (value?: number) => {
      trackConversion(EVENT_ACTIONS.COMPLETE, funnelName, value);
    },
    [funnelName]
  );

  const abandonFunnel = useCallback(() => {
    trackConversion(EVENT_ACTIONS.ABANDON, funnelName);
  }, [funnelName]);

  return { startFunnel, completeFunnel, abandonFunnel };
}

/**
 * Hook for tracking user journeys
 *
 * @example
 * ```tsx
 * function OnboardingFlow() {
 *   const { completeStep } = useJourneyTracking("onboarding");
 *
 *   const handleCreateBubble = () => {
 *     // ... create bubble
 *     completeStep("first_bubble_created");
 *   };
 * }
 * ```
 */
export function useJourneyTracking(journeyType: string) {
  const completeStep = useCallback(
    (step: string) => {
      trackJourneyStep(journeyType, step);
    },
    [journeyType]
  );

  return { completeStep };
}
