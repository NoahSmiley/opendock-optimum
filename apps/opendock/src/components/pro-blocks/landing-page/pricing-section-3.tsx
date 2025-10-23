"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Check, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Tagline } from "@/components/pro-blocks/landing-page/tagline";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

const pricingData = {
  plans: [
    {
      name: "Basic",
      description:
        "A short benefit statement that highlights the ideal user for this.",
      features: [
        {
          name: "Basic project management",
          tooltip: "Create and manage up to 5 projects",
        },
        {
          name: "5GB storage space",
          tooltip: "Secure cloud storage for your files",
        },
        {
          name: "Email support",
          tooltip: "Get help via email within 48 hours",
        },
        {
          name: "Basic reporting",
          tooltip: "Basic reporting and analytics",
        },
      ],
      price: 49,
      variant: "outline",
      cta: "Get started",
    },
    {
      name: "Pro",
      description:
        "A short benefit statement that highlights the ideal user for this.",
      features: [
        {
          name: "Custom workflows",
          tooltip: "Create and automate custom workflows",
        },
        {
          name: "100GB storage space",
          tooltip: "Ample storage for enterprise needs",
        },
        {
          name: "Phone support",
          tooltip: "Priority phone support during business hours",
        },
        {
          name: "Advanced reporting",
          tooltip: "Advanced reporting and analytics",
        },
        {
          name: "Advanced analytics",
          tooltip: "Detailed insights and custom reports",
        },
        {
          name: "API access",
          tooltip: "Full API access for custom integrations",
        },
      ],
      price: 299,
      variant: "default",
      highlighted: true,
      cta: "Start 14-day trial",
    },
  ],
} as const;

export function PricingSection3() {
  return (
    <section
      className="relative overflow-hidden border-t border-neutral-200/60 bg-neutral-100 py-16 dark:border-neutral-800/60 dark:bg-neutral-950 sm:py-20"
      aria-labelledby="pricing-section-title-3"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/80 to-transparent dark:from-black/60" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <Tagline>Pricing</Tagline>
          <h2
            id="pricing-section-title-3"
            className="text-balance text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-4xl"
          >
            Choose the plan that keeps your workflows humming
          </h2>
          <p className="text-pretty text-base text-neutral-500 dark:text-neutral-400">
            Predictable pricing, thoughtful limits, and room to grow. Switch
            tiers as your team scales—no hidden fees, just fast deploys.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          {pricingData.plans.map((plan, index) => (
            <Card
              key={plan.name}
              className={cn(
                "relative flex h-full flex-col overflow-hidden rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm transition-all duration-200 dark:border-neutral-800 dark:bg-neutral-900 sm:p-10",
                plan.highlighted
                  ? "ring-2 ring-neutral-900/80 shadow-xl dark:ring-white/70"
                  : "md:hover:-translate-y-1 md:hover:shadow-md"
              )}
            >
              {plan.highlighted && (
                <span className="absolute left-6 top-6 rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white dark:bg-white dark:text-neutral-900">
                  Recommended
                </span>
              )}

              <CardContent className="flex h-full flex-col justify-between gap-8 p-0">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {plan.description}
                    </p>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
                      ${plan.price}
                    </span>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                      /month
                    </span>
                  </div>

                  <Button
                    variant={
                      plan.variant as VariantProps<
                        typeof buttonVariants
                      >["variant"]
                    }
                    className={cn(
                      "w-full rounded-full text-sm font-semibold",
                      plan.highlighted
                        ? "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                        : "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
                    )}
                  >
                    {plan.cta}
                  </Button>
                </div>

                <TooltipProvider delayDuration={100}>
                  <div className="flex flex-col gap-4">
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                      {index === 0
                        ? "What’s included:"
                        : `Everything in ${pricingData.plans[index - 1].name}, plus:`}
                    </p>
                    <div className="flex flex-col gap-3">
                      {plan.features.map((feature, featureIndex) => (
                        <div
                          key={featureIndex}
                          className="flex items-start gap-3 rounded-2xl border border-neutral-200/50 bg-neutral-50/80 px-4 py-3 text-sm dark:border-neutral-800/60 dark:bg-neutral-900/60"
                        >
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-900 dark:text-white" />
                          <div className="flex flex-1 items-center justify-between gap-3">
                            <span className="text-neutral-600 dark:text-neutral-300">
                              {feature.name}
                            </span>
                            <Tooltip>
                              <TooltipTrigger className="rounded-full p-1 text-neutral-400 transition hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300">
                                <Info className="h-4 w-4" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900">
                                <p>{feature.tooltip}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TooltipProvider>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}



