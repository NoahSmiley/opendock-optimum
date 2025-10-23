import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  Zap, 
  Shield, 
  GitBranch, 
  Rocket,
  Server,
  Users,
  BarChart3,
  CheckCircle2
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-20">
        <div className="w-full">
          <div className="text-center">
            <h1 className="text-5xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-6xl lg:text-7xl">
              Ship faster with
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent"> OpenDock</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600 dark:text-neutral-300">
              The modern deployment platform that brings your code to life. Build, deploy, and manage your applications with confidence.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-8 py-4 text-sm font-semibold text-white shadow-lg transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-8 py-4 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 sm:py-20">
        <div className="w-full">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white sm:text-4xl">
              Everything you need to deploy at scale
            </h2>
            <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">
              Powerful features to streamline your development workflow
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={GitBranch}
              title="Git Integration"
              description="Connect any Git repository and deploy automatically on every push"
            />
            <FeatureCard
              icon={Rocket}
              title="Instant Deployments"
              description="Zero-downtime deployments with automatic rollback on failure"
            />
            <FeatureCard
              icon={Server}
              title="Docker Support"
              description="Full Docker support for complex applications and microservices"
            />
            <FeatureCard
              icon={Shield}
              title="Secure by Default"
              description="SSL certificates, DDoS protection, and security headers included"
            />
            <FeatureCard
              icon={BarChart3}
              title="Real-time Analytics"
              description="Monitor performance, track deployments, and debug with ease"
            />
            <FeatureCard
              icon={Users}
              title="Team Collaboration"
              description="Invite team members, manage permissions, and collaborate seamlessly"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="-mx-6 bg-neutral-50 px-6 py-16 dark:bg-neutral-900/50 sm:-mx-8 sm:px-8 sm:py-20">
        <div className="w-full">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white sm:text-4xl">
              Deploy in 3 simple steps
            </h2>
            <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">
              Get your application live in minutes, not hours
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            <StepCard
              number="1"
              title="Connect Repository"
              description="Link your GitHub, GitLab, or Bitbucket repository with a single click"
            />
            <StepCard
              number="2"
              title="Configure Build"
              description="Set your build commands or use our smart defaults for popular frameworks"
            />
            <StepCard
              number="3"
              title="Deploy & Scale"
              description="Hit deploy and watch your application go live with automatic scaling"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white sm:text-4xl">
            Ready to ship faster?
          </h2>
          <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">
            Join thousands of developers who deploy with confidence using OpenDock
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-8 py-4 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-600 dark:bg-blue-400 dark:text-black dark:hover:bg-blue-300"
            >
              Start Free Trial
              <Zap className="h-4 w-4" />
            </Link>
            <Link
              to="/features"
              className="text-sm font-semibold text-neutral-600 underline-offset-4 transition hover:text-neutral-900 hover:underline dark:text-neutral-300 dark:hover:text-white"
            >
              Learn more about our features →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-8 transition hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="relative rounded-3xl border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="absolute -top-4 left-8">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white dark:bg-blue-400 dark:text-black">
          {number}
        </span>
      </div>
      <h3 className="mt-2 text-lg font-semibold text-neutral-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{description}</p>
      <CheckCircle2 className="mt-4 h-5 w-5 text-green-500 dark:text-green-400" />
    </div>
  );
}
