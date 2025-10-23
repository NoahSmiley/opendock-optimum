import { Link } from "react-router-dom";
import {
  GitBranch,
  Rocket,
  Server,
  Shield,
  BarChart3,
  Users,
  Globe,
  Zap,
  Lock,
  Terminal,
  Cloud,
  Database,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

export default function FeaturesPage() {
  return (
    <div className="w-full">
      {/* Header */}
      <section className="py-16 sm:py-20">
        <div className="w-full text-center">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-5xl">
            Powerful features for modern teams
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600 dark:text-neutral-300">
            Everything you need to build, deploy, and scale your applications with confidence
          </p>
        </div>
      </section>

      {/* Main Features */}
      <section className="pb-16 sm:pb-20">
        <div className="w-full">
          <div className="grid gap-16 lg:grid-cols-2">
            <FeatureSection
              icon={GitBranch}
              title="Seamless Git Integration"
              description="Connect your repositories from GitHub, GitLab, or Bitbucket and deploy automatically on every push."
              features={[
                "Automatic deployments on push",
                "Branch-based environments",
                "Pull request previews",
                "Rollback to any commit"
              ]}
            />
            <FeatureSection
              icon={Rocket}
              title="Lightning Fast Deployments"
              description="Deploy your applications in seconds with our optimized build pipeline and global CDN."
              features={[
                "Zero-downtime deployments",
                "Automatic rollback on failure",
                "Instant cache invalidation",
                "Global edge network"
              ]}
            />
            <FeatureSection
              icon={Server}
              title="Container-First Architecture"
              description="Full Docker support for complex applications, microservices, and custom runtimes."
              features={[
                "Docker & Docker Compose support",
                "Custom Dockerfile builds",
                "Multi-stage builds",
                "Private registry support"
              ]}
            />
            <FeatureSection
              icon={Shield}
              title="Enterprise-Grade Security"
              description="Keep your applications secure with built-in security features and compliance tools."
              features={[
                "Automatic SSL certificates",
                "DDoS protection",
                "Web Application Firewall",
                "SOC 2 Type II compliant"
              ]}
            />
            <FeatureSection
              icon={BarChart3}
              title="Real-Time Monitoring"
              description="Get insights into your application performance with comprehensive monitoring and analytics."
              features={[
                "Real-time metrics dashboard",
                "Custom alerts and notifications",
                "Log aggregation and search",
                "Performance profiling"
              ]}
            />
            <FeatureSection
              icon={Users}
              title="Team Collaboration"
              description="Work together seamlessly with powerful collaboration features and fine-grained access control."
              features={[
                "Role-based access control",
                "Team workspaces",
                "Audit logs",
                "SSO/SAML integration"
              ]}
            />
          </div>
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className="-mx-6 bg-neutral-50 px-6 py-16 dark:bg-neutral-900/50 sm:-mx-8 sm:px-8 sm:py-20">
        <div className="w-full">
          <h2 className="text-center text-3xl font-bold text-neutral-900 dark:text-white">
            And so much more...
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <SmallFeature icon={Globe} title="Custom Domains" />
            <SmallFeature icon={Zap} title="Auto-scaling" />
            <SmallFeature icon={Lock} title="Environment Variables" />
            <SmallFeature icon={Terminal} title="CLI Tool" />
            <SmallFeature icon={Cloud} title="CDN Included" />
            <SmallFeature icon={Database} title="Database Backups" />
            <SmallFeature icon={CheckCircle2} title="Health Checks" />
            <SmallFeature icon={ArrowRight} title="API Access" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">
            See OpenDock in action
          </h2>
          <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">
            Start deploying your applications today with our free tier
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
      </section>
    </div>
  );
}

function FeatureSection({ 
  icon: Icon, 
  title, 
  description, 
  features 
}: { 
  icon: any; 
  title: string; 
  description: string; 
  features: string[] 
}) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-2xl font-semibold text-neutral-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-neutral-600 dark:text-neutral-300">{description}</p>
      <ul className="mt-6 space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <CheckCircle2 className="mr-2 h-5 w-5 flex-shrink-0 text-green-500 dark:text-green-400" />
            <span className="text-sm text-neutral-700 dark:text-neutral-200">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SmallFeature({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <Icon className="h-5 w-5 text-blue-500 dark:text-blue-400" />
      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{title}</span>
    </div>
  );
}
