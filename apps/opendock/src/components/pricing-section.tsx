import { Check } from "lucide-react";
import { Link } from "react-router-dom";

interface PricingTier {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  ctaLink: string;
  popular?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    description: "Perfect for side projects and experimentation",
    features: [
      "Up to 3 projects",
      "Basic deployment runner",
      "Community support",
      "Public repositories only",
    ],
    cta: "Get Started",
    ctaLink: "/auth",
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For professional developers and small teams",
    features: [
      "Unlimited projects",
      "Docker-based deployments",
      "Real-time log streaming",
      "Private repositories",
      "Advanced monitoring",
      "Up to 5 team members",
    ],
    cta: "Start Free Trial",
    ctaLink: "/auth",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large teams with advanced needs",
    features: [
      "Everything in Pro",
      "Unlimited team members",
      "SSO & SAML",
      "Custom integrations",
      "SLA guarantees",
      "Dedicated support",
      "On-premise deployment",
    ],
    cta: "Contact Sales",
    ctaLink: "/contact",
  },
];

export function PricingSection() {
  return (
    <section className="w-full py-12">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">
            Choose the perfect plan for your deployment needs
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border ${
                tier.popular
                  ? "border-blue-500 shadow-xl dark:border-blue-400"
                  : "border-neutral-200 dark:border-neutral-800"
              } bg-white p-8 dark:bg-neutral-900`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex rounded-full bg-blue-500 px-4 py-1 text-sm font-semibold text-white dark:bg-blue-400 dark:text-black">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">
                  {tier.name}
                </h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-5xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="ml-2 text-lg text-neutral-500 dark:text-neutral-400">
                      {tier.period}
                    </span>
                  )}
                </div>
                <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">
                  {tier.description}
                </p>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-green-500 dark:text-green-400" />
                    <span className="text-sm text-neutral-700 dark:text-neutral-200">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                to={tier.ctaLink}
                className={`block w-full rounded-full py-3 text-center text-sm font-semibold transition ${
                  tier.popular
                    ? "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-400 dark:text-black dark:hover:bg-blue-300"
                    : "bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
