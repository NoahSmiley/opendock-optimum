import { Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { PublicHeader } from "@/components/PublicHeader";

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    description: "Perfect for side projects and experimentation",
    features: [
      { text: "Up to 3 projects", included: true },
      { text: "Basic deployment runner", included: true },
      { text: "Community support", included: true },
      { text: "Public repositories only", included: true },
      { text: "Advanced monitoring", included: false },
      { text: "Team collaboration", included: false },
      { text: "Priority support", included: false },
    ],
    cta: "Get Started",
    ctaLink: "/auth",
    popular: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For professional developers and small teams",
    features: [
      { text: "Unlimited projects", included: true },
      { text: "Docker-based deployments", included: true },
      { text: "Real-time log streaming", included: true },
      { text: "Private repositories", included: true },
      { text: "Advanced monitoring", included: true },
      { text: "Up to 5 team members", included: true },
      { text: "Priority support", included: false },
    ],
    cta: "Start Free Trial",
    ctaLink: "/auth",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large teams with advanced needs",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Unlimited team members", included: true },
      { text: "SSO & SAML", included: true },
      { text: "Custom integrations", included: true },
      { text: "SLA guarantees", included: true },
      { text: "Dedicated support", included: true },
      { text: "On-premise deployment", included: true },
    ],
    cta: "Contact Sales",
    ctaLink: "/contact",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-black">
      <PublicHeader />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">
            Choose the perfect plan for your deployment needs
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl border ${
                plan.popular
                  ? "border-blue-500 shadow-xl dark:border-blue-400"
                  : "border-neutral-200 dark:border-neutral-800"
              } bg-white p-8 dark:bg-neutral-900`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-blue-500 px-4 py-1 text-sm font-semibold text-white dark:bg-blue-400 dark:text-black">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-baseline justify-center">
                  <span className="text-5xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="ml-1 text-xl text-neutral-500 dark:text-neutral-400">
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">
                  {plan.description}
                </p>
              </div>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    {feature.included ? (
                      <Check className="h-5 w-5 flex-shrink-0 text-green-500 dark:text-green-400" />
                    ) : (
                      <X className="h-5 w-5 flex-shrink-0 text-neutral-300 dark:text-neutral-700" />
                    )}
                    <span
                      className={`ml-3 text-sm ${
                        feature.included
                          ? "text-neutral-700 dark:text-neutral-200"
                          : "text-neutral-400 dark:text-neutral-600"
                      }`}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Link
                  to={plan.ctaLink}
                  className={`block w-full rounded-full py-3 text-center font-semibold transition ${
                    plan.popular
                      ? "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-400 dark:text-black dark:hover:bg-blue-300"
                      : "bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-24">
          <h2 className="text-center text-3xl font-bold text-neutral-900 dark:text-white">
            Frequently asked questions
          </h2>
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Can I change plans later?
              </h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                What payment methods do you accept?
              </h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                We accept all major credit cards, PayPal, and wire transfers for Enterprise plans.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Is there a free trial?
              </h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                Yes, Pro plans come with a 14-day free trial. No credit card required.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Do you offer discounts for students?
              </h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                Yes, we offer 50% off Pro plans for students with a valid .edu email address.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
