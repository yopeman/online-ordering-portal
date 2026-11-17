"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Plus,
  Rocket,
  Sparkles,
} from "lucide-react";

import { useApp } from "@/components/providers/app-provider";
import { CreateBusinessButton } from "@/components/business/create-business-button";
import { ShareBusinessButton } from "@/components/business/share-business-button";
import { PageVideoButton } from "@/components/video";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { OnboardingStats } from "@/lib/queries";
import type { PlatformVideoKey } from "@/lib/videos";

export interface OnboardingBusinessInfo {
  id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
}

export interface OnboardingGuidanceProps {
  stats: OnboardingStats;
  business?: OnboardingBusinessInfo | null;
  canCreateBusiness?: boolean;
  maxBusinesses?: number;
  variant?: "hero" | "banner";
  onAddProduct?: () => void;
  className?: string;
}

interface StepDefinition {
  id: number;
  titleKey: string;
  descKey: string;
  done: boolean;
  videoKey: PlatformVideoKey;
}

const STORAGE_KEY = "ordershub_onboarding_collapsed";

function subscribeToCollapse(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("ordershub:onboarding-collapse", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("ordershub:onboarding-collapse", callback);
  };
}

function useStoredCollapsed(defaultValue: boolean): [boolean, () => void] {
  const collapsed = useSyncExternalStore(
    subscribeToCollapse,
    () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored !== null ? stored === "true" : defaultValue;
      } catch {
        return defaultValue;
      }
    },
    () => defaultValue,
  );

  const toggle = () => {
    try {
      const next = !collapsed;
      localStorage.setItem(STORAGE_KEY, String(next));
      window.dispatchEvent(new Event("ordershub:onboarding-collapse"));
    } catch {
      // ignore
    }
  };

  return [collapsed, toggle];
}

export function OnboardingGuidance({
  stats,
  business,
  canCreateBusiness = true,
  maxBusinesses = 5,
  variant = "hero",
  onAddProduct,
  className = "",
}: OnboardingGuidanceProps) {
  const { t } = useApp();
  const [collapsed, toggleCollapse] = useStoredCollapsed(variant === "banner");

  const steps: StepDefinition[] = [
    {
      id: 1,
      titleKey: "onboarding.step1Title",
      descKey: "onboarding.step1Desc",
      done: stats.hasAccount,
      videoKey: "login",
    },
    {
      id: 2,
      titleKey: "onboarding.step2Title",
      descKey: "onboarding.step2Desc",
      done: stats.hasBusiness,
      videoKey: "businessOverview",
    },
    {
      id: 3,
      titleKey: "onboarding.step3Title",
      descKey: "onboarding.step3Desc",
      done: stats.hasProducts,
      videoKey: "catalogTab",
    },
    {
      id: 4,
      titleKey: "onboarding.step4Title",
      descKey: "onboarding.step4Desc",
      done: stats.hasShared,
      videoKey: "productDetail", //"businessFront",
    },
    {
      id: 5,
      titleKey: "onboarding.step5Title",
      descKey: "onboarding.step5Desc",
      done: stats.hasOrders,
      videoKey: "ordersTab",
    },
  ];

  // Find the current active step (the first step that isn't done)
  const currentStep = steps.find((s) => !s.done) ?? null;
  const isAllComplete = stats.completedCount >= stats.totalSteps;

  if (isAllComplete && variant === "banner" && collapsed) {
    return null;
  }

  // --- RENDER ACTION FOR A STEP ---
  const renderStepAction = (step: StepDefinition, isCurrent: boolean) => {
    if (step.done) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
          <Check className="h-3.5 w-3.5" />
          <span>{t("onboarding.completedBadge")}</span>
        </span>
      );
    }

    // Step 2: Create business profile
    if (step.id === 2) {
      return (
        <CreateBusinessButton
          canCreate={canCreateBusiness}
          reachedLimit={!canCreateBusiness}
          max={maxBusinesses}
          label={t("onboarding.step2Action")}
          variant={isCurrent ? "primary" : "secondary"}
        />
      );
    }

    // Step 3: Add first product
    if (step.id === 3) {
      if (onAddProduct) {
        return (
          <Button
            type="button"
            size="sm"
            variant={isCurrent ? "primary" : "secondary"}
            onClick={onAddProduct}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t("onboarding.step3Action")}</span>
          </Button>
        );
      }
      if (business) {
        return (
          <Link href={`/businesses/${business.id}/catalog`}>
            <Button
              type="button"
              size="sm"
              variant={isCurrent ? "primary" : "secondary"}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t("onboarding.step3Action")}</span>
            </Button>
          </Link>
        );
      }
    }

    // Step 4: Share link
    if (step.id === 4 && business) {
      return (
        <ShareBusinessButton
          businessId={business.id}
          businessName={business.name}
          url={`/store/${business.slug}`}
          imageUrl={business.image}
          isOwner={true}
          size="sm"
          variant={isCurrent ? "primary" : "secondary"}
          label={t("onboarding.step4Action")}
        />
      );
    }

    // Step 5: Receive order
    if (step.id === 5 && business) {
      return (
        <Link href={`/businesses/${business.id}/orders`}>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="gap-1.5"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            <span>{t("onboarding.step5Action")}</span>
          </Button>
        </Link>
      );
    }

    return null;
  };

  // --- HERO VARIANT ---
  if (variant === "hero") {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border border-primary/25 bg-surface p-6 shadow-sm sm:p-8 ${className}`}
      >
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-info/10 blur-3xl" />

        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Orders Hub Launchpad</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {t("onboarding.title")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("onboarding.guideHint")}
              </p>
            </div>

            {/* Progress Badge */}
            <div className="flex shrink-0 items-center gap-3 rounded-xl border border-border bg-surface-muted/60 p-3">
              <div className="text-right">
                <span className="block text-xs font-medium text-muted-foreground">
                  {t("onboarding.subtitle")}
                </span>
                <span className="text-sm font-bold text-foreground">
                  {t("onboarding.progress", {
                    completed: stats.completedCount,
                    total: stats.totalSteps,
                  })}
                </span>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground shadow-xs text-sm">
                {stats.percentage}%
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-surface-muted border border-border/40">
            <div
              className="h-full rounded-full bg-linear-to-r from-primary to-primary-hover transition-all duration-500 ease-out"
              style={{ width: `${Math.max(stats.percentage, 5)}%` }}
            />
          </div>

          {/* Stepper Checklist */}
          <div className="divide-y divide-border/60 rounded-xl border border-border bg-surface">
            {steps.map((step) => {
              const isCurrent = currentStep?.id === step.id;
              return (
                <div
                  key={step.id}
                  className={`flex flex-col gap-3 p-4 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                    isCurrent
                      ? "bg-primary-soft/30 border-l-4 border-l-primary"
                      : step.done
                        ? "opacity-90 hover:bg-surface-muted/30"
                        : "opacity-75 hover:opacity-100 hover:bg-surface-muted/20"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Step Icon / Number */}
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                        step.done
                          ? "bg-success text-white shadow-xs"
                          : isCurrent
                            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30 ring-3 ring-primary/20"
                            : "border border-border bg-surface-muted text-muted-foreground"
                      }`}
                    >
                      {step.done ? <Check className="h-4 w-4 stroke-[3]" /> : step.id}
                    </div>

                    {/* Step Title & Description */}
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h3
                          className={`text-sm font-semibold ${
                            step.done
                              ? "text-foreground line-through opacity-70"
                              : isCurrent
                                ? "text-primary font-bold"
                                : "text-foreground"
                          }`}
                        >
                          {t(step.titleKey)}
                        </h3>
                        {isCurrent ? (
                          <Badge tone="primary" className="text-[10px] px-1.5 py-0">
                            {t("onboarding.nextAction")}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {t(step.descKey)}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Tutorial */}
                  <div className="flex items-center justify-end gap-2 pl-11 sm:pl-0">
                    <PageVideoButton videoKey={step.videoKey} size="sm" />
                    {renderStepAction(step, isCurrent)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- BANNER VARIANT (COMPACT / COLLAPSIBLE) ---
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border bg-surface shadow-xs transition-all ${className}`}
    >
      {/* Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            {isAllComplete ? (
              <Sparkles className="h-4.5 w-4.5 text-warning" />
            ) : (
              <Rocket className="h-4.5 w-4.5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                {isAllComplete ? t("onboarding.congratsTitle") : t("onboarding.subtitle")}
              </h3>
              <Badge tone={isAllComplete ? "success" : "primary"}>
                {stats.completedCount}/{stats.totalSteps}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {isAllComplete
                ? t("onboarding.congratsDesc")
                : currentStep
                  ? `${t("onboarding.nextAction")}: ${t(currentStep.titleKey)}`
                  : t("onboarding.guideHint")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Action Button for current step */}
          {currentStep ? renderStepAction(currentStep, true) : null}

          {/* Toggle Expand/Collapse */}
          <button
            type="button"
            onClick={toggleCollapse}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground cursor-pointer"
            aria-label={collapsed ? t("onboarding.expand") : t("onboarding.collapse")}
            title={collapsed ? t("onboarding.expand") : t("onboarding.collapse")}
          >
            <span>{collapsed ? t("onboarding.expand") : t("onboarding.collapse")}</span>
            {collapsed ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Mini Progress Bar */}
      <div className="h-1 w-full bg-surface-muted">
        <div
          className="h-full bg-linear-to-r from-primary to-primary-hover transition-all duration-300"
          style={{ width: `${Math.max(stats.percentage, 5)}%` }}
        />
      </div>

      {/* Expanded Stepper List */}
      {!collapsed ? (
        <div className="border-t border-border bg-surface-muted/20 p-4">
          <div className="space-y-2">
            {steps.map((step) => {
              const isCurrent = currentStep?.id === step.id;
              return (
                <div
                  key={step.id}
                  className={`flex flex-col gap-2 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                    isCurrent
                      ? "border-primary/40 bg-surface shadow-xs"
                      : "border-border/60 bg-surface/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        step.done
                          ? "bg-success text-white"
                          : isCurrent
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-surface-muted text-muted-foreground"
                      }`}
                    >
                      {step.done ? <Check className="h-3 w-3 stroke-[3]" /> : step.id}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        step.done
                          ? "text-muted-foreground line-through"
                          : isCurrent
                            ? "font-semibold text-primary"
                            : "text-foreground"
                      }`}
                    >
                      {t(step.titleKey)}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pl-9 sm:pl-0">
                    <PageVideoButton videoKey={step.videoKey} size="sm" />
                    {renderStepAction(step, isCurrent)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
