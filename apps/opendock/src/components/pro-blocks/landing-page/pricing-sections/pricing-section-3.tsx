"use client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Check, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

const pricingData = {
  plans: [
    {
      name: "Starter",
      description:
        "Perfect for side projects and experimentation",
      features: [
        {
          name: "Up to 3 projects",
          tooltip: "Create and deploy up to 3 projects",
        },
        {
          name: "Basic deployment runner",
          tooltip: "Simple deployment automation",
        },
        {
          name: "Community support",
          tooltip: "Get help from our community forums",
        },
        {
          name: "Public repositories only",
          tooltip: "Deploy from public GitHub repositories",
        },
      ],
      price: 0,
      period: "forever",
      variant: "outline",
      cta: "Get Started",
      highlighted: false,
    },
    {
      name: "Pro",
      description:
        "For professional developers and small teams",
      features: [
        {
          name: "Unlimited projects",
          tooltip: "Deploy as many projects as you need",
        },
        {
          name: "Docker-based deployments",
          tooltip: "Full Docker support for complex applications",
        },
        {
          name: "Real-time log streaming",
          tooltip: "Monitor your deployments in real-time",
        },
        {
          name: "Private repositories",
          tooltip: "Deploy from private GitHub repositories",
        },
        {
          name: "Advanced monitoring",
          tooltip: "Detailed metrics and health checks",
        },
        {
          name: "Up to 5 team members",
          tooltip: "Collaborate with your team",
        },
      ],
      price: 19,
      period: "/month",
      variant: "default",
      highlighted: true,
      cta: "Start Free Trial",
    },
  ],
} as const;

export function PricingSection3() {
  return (
    <section
      className="w-full py-12"
      aria-labelledby="pricing-section-title-3"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-12 text-center">
          <h2
            id="pricing-section-title-3"
            className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-4xl"
          >
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">
            Choose the perfect plan for your deployment needs
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {pricingData.plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-white p-8 dark:bg-neutral-900",
                plan.highlighted
                  ? "border-blue-500 shadow-xl dark:border-blue-400"
                  : "border-neutral-200 dark:border-neutral-800"
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex rounded-full bg-blue-500 px-4 py-1 text-sm font-semibold text-white dark:bg-blue-400 dark:text-black">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-5xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    ${plan.price}
                  </span>
                  {plan.period && (
                    <span className="ml-2 text-lg text-neutral-500 dark:text-neutral-400">
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">
                  {plan.description}
                </p>
              </div>

              <TooltipProvider delayDuration={100}>
                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="h-5 w-5 shrink-0 text-green-500 dark:text-green-400" />
                      <div className="flex flex-1 items-center justify-between gap-2">
                        <span className="text-sm text-neutral-700 dark:text-neutral-200">
                          {feature.name}
                        </span>
                        <Tooltip>
                          <TooltipTrigger className="rounded-full p-1 text-neutral-400 transition hover:text-neutral-600 dark:hover:text-neutral-300">
                            <Info className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{feature.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </li>
                  ))}
                </ul>
              </TooltipProvider>

              <Button
                variant={
                  plan.variant as VariantProps<
                    typeof buttonVariants
                  >["variant"]
                }
                className={cn(
                  "block w-full rounded-full py-3 text-center text-sm font-semibold transition",
                  plan.highlighted
                    ? "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-400 dark:text-black dark:hover:bg-blue-300"
                    : "bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                )}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
