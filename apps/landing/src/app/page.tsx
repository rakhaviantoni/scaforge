'use client';

import { 
  Blocks, 
  Zap, 
  Package, 
  Terminal, 
  ArrowRight, 
  Check,
  Github,
  Layers,
  Puzzle,
  Rocket,
  Shield,
  Database,
  CreditCard,
  Mail,
  BarChart,
  Search,
  Globe,
  Bot
} from 'lucide-react';

const frameworks = [
  { name: 'Next.js', description: 'React framework with App Router', color: 'from-black to-gray-800' },
  { name: 'TanStack Start', description: 'Full-stack React with TanStack Router', color: 'from-orange-500 to-red-500' },
  { name: 'Nuxt', description: 'Vue.js framework', color: 'from-green-500 to-emerald-600' },
  { name: 'Hydrogen', description: 'Shopify storefront framework', color: 'from-purple-500 to-pink-500' },
];

const pluginCategories = [
  { icon: Layers, name: 'API', examples: 'tRPC, Apollo, GraphQL Yoga, ORPC' },
  { icon: Shield, name: 'Auth', examples: 'Auth.js, Clerk, Better-Auth' },
  { icon: Database, name: 'Database', examples: 'Prisma, Drizzle' },
  { icon: CreditCard, name: 'Payments', examples: 'Stripe, Midtrans, Xendit' },
  { icon: Mail, name: 'Email', examples: 'Resend, SendGrid' },
  { icon: BarChart, name: 'Analytics', examples: 'PostHog, Plausible' },
  { icon: Search, name: 'Search', examples: 'Meilisearch, Algolia' },
  { icon: Globe, name: 'i18n', examples: 'next-intl, i18next' },
  { icon: Bot, name: 'AI', examples: 'OpenAI, Gemini, Vercel AI' },
  { icon: Puzzle, name: '100+ More', examples: 'CMS, Storage, Caching...' },
];

const features = [
  {
    icon: Blocks,
    title: 'Minimal by Default',
    description: 'Start with just the framework and essentials. No bloat, no unused code.',
  },
  {
    icon: Puzzle,
    title: 'Plugin Everything',
    description: 'Add any feature as a plugin. Auth, database, payments - all optional.',
  },
  {
    icon: Zap,
    title: 'Auto-Integration',
    description: 'Plugins automatically wire up with each other. Add auth + API = protected routes.',
  },
  {
    icon: Package,
    title: 'Framework Agnostic',
    description: 'Same plugin system works across Next.js, Nuxt, TanStack, and Hydrogen.',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-transparent to-accent-900/20" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-500/20 rounded-full blur-[120px]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
              <Rocket className="w-4 h-4 text-primary-400" />
              <span className="text-sm text-gray-300">Now in Public Beta</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="gradient-text">Scaforge</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
              The modular full-stack boilerplate ecosystem
            </p>
            
            <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
              Build production-ready apps in minutes. Choose your framework, 
              add plugins as you need them. Start minimal, scale infinitely.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <a
                href="#get-started"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 hover:bg-primary-600 rounded-lg font-semibold transition-all hover:scale-105 glow"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/rakhaviantoni/scaforge"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 glass hover:bg-white/10 rounded-lg font-semibold transition-all"
              >
                <Github className="w-5 h-5" />
                View on GitHub
              </a>
            </div>

            {/* Terminal Preview */}
            <div className="max-w-2xl mx-auto glass rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-black/50 border-b border-white/10">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-2 text-sm text-gray-400">Terminal</span>
              </div>
              <div className="p-6 font-mono text-left text-sm">
                <p className="text-gray-400"># Create a new project</p>
                <p className="text-green-400">$ npx create-scaforge my-app</p>
                <p className="text-gray-400 mt-4"># Add plugins anytime</p>
                <p className="text-green-400">$ npx scaforge add api-trpc</p>
                <p className="text-green-400">$ npx scaforge add auth-clerk</p>
                <p className="text-green-400">$ npx scaforge add db-prisma</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why <span className="gradient-text">Scaforge</span>?
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Unlike monolithic boilerplates, Scaforge lets you build exactly what you need.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass rounded-xl p-6 hover:bg-white/10 transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Frameworks Section */}
      <section className="py-24 relative bg-black/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choose Your Framework
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Start with your favorite framework. Same plugin ecosystem, same CLI, same experience.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {frameworks.map((framework, index) => (
              <div
                key={index}
                className="glass rounded-xl p-6 hover:scale-105 transition-all cursor-pointer group"
              >
                <div className={`w-full h-2 rounded-full bg-gradient-to-r ${framework.color} mb-4`} />
                <h3 className="text-xl font-semibold mb-2">{framework.name}</h3>
                <p className="text-gray-400 text-sm">{framework.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plugins Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="gradient-text">100+</span> Plugins Available
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              From authentication to AI, payments to analytics. Add what you need, when you need it.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {pluginCategories.map((category, index) => (
              <div
                key={index}
                className="glass rounded-xl p-4 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  <category.icon className="w-5 h-5 text-primary-400" />
                  <h3 className="font-semibold">{category.name}</h3>
                </div>
                <p className="text-gray-400 text-xs">{category.examples}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Get Started Section */}
      <section id="get-started" className="py-24 relative bg-black/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get Started in Seconds
            </h2>
            <p className="text-gray-400">
              One command to create your project. Add plugins as you build.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center font-bold">1</div>
                <h3 className="font-semibold">Create your project</h3>
              </div>
              <div className="bg-black/50 rounded-lg p-4 font-mono text-sm">
                <span className="text-gray-400">$</span> <span className="text-green-400">npx create-scaforge my-app</span>
              </div>
            </div>
            
            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center font-bold">2</div>
                <h3 className="font-semibold">Add plugins you need</h3>
              </div>
              <div className="bg-black/50 rounded-lg p-4 font-mono text-sm space-y-2">
                <p><span className="text-gray-400">$</span> <span className="text-green-400">npx scaforge add api-trpc</span> <span className="text-gray-500"># Type-safe API</span></p>
                <p><span className="text-gray-400">$</span> <span className="text-green-400">npx scaforge add auth-clerk</span> <span className="text-gray-500"># Authentication</span></p>
                <p><span className="text-gray-400">$</span> <span className="text-green-400">npx scaforge add db-prisma</span> <span className="text-gray-500"># Database ORM</span></p>
              </div>
            </div>
            
            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center font-bold">3</div>
                <h3 className="font-semibold">Start building</h3>
              </div>
              <div className="bg-black/50 rounded-lg p-4 font-mono text-sm">
                <span className="text-gray-400">$</span> <span className="text-green-400">pnpm dev</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/20 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to build something amazing?
          </h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Join developers who are building faster with Scaforge. 
            Start minimal, add what you need, ship with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://github.com/rakhaviantoni/scaforge"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 hover:bg-primary-600 rounded-lg font-semibold transition-all hover:scale-105 glow"
            >
              <Github className="w-5 h-5" />
              Star on GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/create-scaforge"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 glass hover:bg-white/10 rounded-lg font-semibold transition-all"
            >
              <Package className="w-5 h-5" />
              View on npm
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Blocks className="w-6 h-6 text-primary-400" />
              <span className="font-bold">Scaforge</span>
            </div>
            <p className="text-gray-400 text-sm">
              Built with ❤️ by <a href="https://rakhaviantoni.com" className="text-primary-400 hover:underline">Rakha Viantoni</a>
            </p>
            <div className="flex items-center gap-4">
              <a href="https://github.com/rakhaviantoni/scaforge" className="text-gray-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
