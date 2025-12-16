/**
 * Documentation Generator
 * Generates local documentation pages for installed plugins
 * 
 * Requirements: 44.1, 44.2, 44.3
 */
import fs from 'fs-extra';
import path from 'path';
import { ScaforgeConfig } from '../config/types';
import { PluginDefinition, PluginCategory } from '../plugin-system/types';
import { registry } from '../plugin-system/registry';

/**
 * Documentation output options
 */
export interface DocsGeneratorOptions {
  /** Output directory for generated docs (relative to project root) */
  outputDir?: string;
  /** Include API documentation if API plugin is installed */
  includeApiDocs?: boolean;
  /** Include environment variable documentation */
  includeEnvDocs?: boolean;
}

/**
 * Default options for docs generation
 */
const DEFAULT_OPTIONS: Required<DocsGeneratorOptions> = {
  outputDir: 'docs/scaforge',
  includeApiDocs: true,
  includeEnvDocs: true,
};

/**
 * Plugin documentation info extracted from plugin definition
 */
export interface PluginDocInfo {
  name: string;
  displayName: string;
  category: PluginCategory;
  description: string;
  version: string;
  envVars: Array<{
    name: string;
    description: string;
    required: boolean;
    secret: boolean;
  }>;
  dependencies: string[];
  officialDocsUrl?: string;
}

/**
 * Category display names for documentation
 */
const CATEGORY_DISPLAY_NAMES: Record<PluginCategory, string> = {
  api: 'API Providers',
  cms: 'Content Management',
  auth: 'Authentication',
  database: 'Database',
  payments: 'Payments',
  email: 'Email',
  storage: 'Storage',
  analytics: 'Analytics',
  monitoring: 'Monitoring',
  caching: 'Caching',
  jobs: 'Background Jobs',
  search: 'Search',
  flags: 'Feature Flags',
  sms: 'SMS',
  push: 'Push Notifications',
  realtime: 'Real-time',
  ai: 'AI & ML',
  vector: 'Vector Database',
  i18n: 'Internationalization',
  forms: 'Forms',
  state: 'State Management',
  testing: 'Testing',
  security: 'Security',
  media: 'Media',
  maps: 'Maps',
  charts: 'Charts',
  pdf: 'PDF',
  seo: 'SEO',
  scheduling: 'Scheduling',
  comments: 'Comments',
  notifications: 'Notifications',
  admin: 'Admin Dashboard',
  content: 'Content Processing',
  indonesian: 'Indonesian Services',
};


/**
 * Official documentation URLs for common plugins
 */
const OFFICIAL_DOCS_URLS: Record<string, string> = {
  'api-trpc': 'https://trpc.io/docs',
  'api-apollo': 'https://www.apollographql.com/docs/',
  'api-yoga': 'https://the-guild.dev/graphql/yoga-server/docs',
  'api-orpc': 'https://orpc.unnoq.com/',
  'auth-authjs': 'https://authjs.dev/',
  'auth-clerk': 'https://clerk.com/docs',
  'auth-better': 'https://www.better-auth.com/docs',
  'db-prisma': 'https://www.prisma.io/docs',
  'db-drizzle': 'https://orm.drizzle.team/docs/overview',
  'cms-sanity': 'https://www.sanity.io/docs',
  'payments-stripe': 'https://stripe.com/docs',
  'payments-midtrans': 'https://docs.midtrans.com/',
  'email-resend': 'https://resend.com/docs',
  'storage-uploadthing': 'https://docs.uploadthing.com/',
  'analytics-posthog': 'https://posthog.com/docs',
  'monitoring-sentry': 'https://docs.sentry.io/',
  'cache-upstash': 'https://upstash.com/docs',
  'jobs-inngest': 'https://www.inngest.com/docs',
  'search-meilisearch': 'https://www.meilisearch.com/docs',
  'ai-openai': 'https://platform.openai.com/docs',
  'ai-gemini': 'https://ai.google.dev/docs',
  'realtime-pusher': 'https://pusher.com/docs',
  'i18n-nextintl': 'https://next-intl-docs.vercel.app/',
  'forms-rhf': 'https://react-hook-form.com/docs',
};

/**
 * Extracts documentation info from a plugin definition
 */
export function extractPluginDocInfo(plugin: PluginDefinition): PluginDocInfo {
  return {
    name: plugin.name,
    displayName: plugin.displayName,
    category: plugin.category,
    description: plugin.description,
    version: plugin.version,
    envVars: (plugin.envVars || []).map(env => ({
      name: env.name,
      description: env.description,
      required: env.required,
      secret: env.secret ?? false,
    })),
    dependencies: plugin.dependencies || [],
    officialDocsUrl: OFFICIAL_DOCS_URLS[plugin.name],
  };
}

/**
 * Gets installed plugins from config with their full definitions
 */
export function getInstalledPlugins(config: ScaforgeConfig): PluginDefinition[] {
  const installedNames = Object.keys(config.plugins).filter(
    name => config.plugins[name]?.enabled
  );
  
  return installedNames
    .map(name => registry.get(name))
    .filter((plugin): plugin is PluginDefinition => plugin !== undefined);
}

/**
 * Groups plugins by category
 */
export function groupPluginsByCategory(
  plugins: PluginDefinition[]
): Map<PluginCategory, PluginDefinition[]> {
  const grouped = new Map<PluginCategory, PluginDefinition[]>();
  
  for (const plugin of plugins) {
    const existing = grouped.get(plugin.category) || [];
    existing.push(plugin);
    grouped.set(plugin.category, existing);
  }
  
  return grouped;
}

/**
 * Checks if an API plugin is installed
 */
export function hasApiPlugin(config: ScaforgeConfig): boolean {
  const apiPlugins = ['api-trpc', 'api-apollo', 'api-yoga', 'api-orpc', 'api-rest'];
  return apiPlugins.some(name => config.plugins[name]?.enabled);
}

/**
 * Gets the installed API plugin name
 */
export function getInstalledApiPlugin(config: ScaforgeConfig): string | null {
  const apiPlugins = ['api-trpc', 'api-apollo', 'api-yoga', 'api-orpc', 'api-rest'];
  return apiPlugins.find(name => config.plugins[name]?.enabled) || null;
}


/**
 * Generates the main plugins documentation page content
 */
export function generatePluginsDocContent(
  config: ScaforgeConfig,
  plugins: PluginDefinition[]
): string {
  const grouped = groupPluginsByCategory(plugins);
  const lines: string[] = [];
  
  lines.push('# Installed Plugins');
  lines.push('');
  lines.push(`> Auto-generated documentation for **${config.name}** (${config.template} template)`);
  lines.push('');
  lines.push('## Overview');
  lines.push('');
  lines.push(`This project has **${plugins.length}** plugin(s) installed.`);
  lines.push('');
  
  // Table of contents
  if (grouped.size > 0) {
    lines.push('## Table of Contents');
    lines.push('');
    for (const [category] of grouped) {
      const displayName = CATEGORY_DISPLAY_NAMES[category] || category;
      const anchor = displayName.toLowerCase().replace(/\s+/g, '-');
      lines.push(`- [${displayName}](#${anchor})`);
    }
    lines.push('');
  }
  
  // Plugin sections by category
  for (const [category, categoryPlugins] of grouped) {
    const displayName = CATEGORY_DISPLAY_NAMES[category] || category;
    lines.push(`## ${displayName}`);
    lines.push('');
    
    for (const plugin of categoryPlugins) {
      const docInfo = extractPluginDocInfo(plugin);
      lines.push(`### ${docInfo.displayName}`);
      lines.push('');
      lines.push(`**Plugin:** \`${docInfo.name}\` v${docInfo.version}`);
      lines.push('');
      lines.push(docInfo.description);
      lines.push('');
      
      // Dependencies
      if (docInfo.dependencies.length > 0) {
        lines.push('**Dependencies:**');
        for (const dep of docInfo.dependencies) {
          lines.push(`- \`${dep}\``);
        }
        lines.push('');
      }
      
      // Environment variables
      if (docInfo.envVars.length > 0) {
        lines.push('**Environment Variables:**');
        lines.push('');
        lines.push('| Variable | Description | Required |');
        lines.push('|----------|-------------|----------|');
        for (const env of docInfo.envVars) {
          const required = env.required ? '✅ Yes' : '❌ No';
          const secret = env.secret ? ' 🔒' : '';
          lines.push(`| \`${env.name}\`${secret} | ${env.description} | ${required} |`);
        }
        lines.push('');
      }
      
      // Official docs link
      if (docInfo.officialDocsUrl) {
        lines.push(`📚 [Official Documentation](${docInfo.officialDocsUrl})`);
        lines.push('');
      }
      
      lines.push('---');
      lines.push('');
    }
  }
  
  // Footer
  lines.push('## Quick Reference');
  lines.push('');
  lines.push('### CLI Commands');
  lines.push('');
  lines.push('```bash');
  lines.push('# List all available plugins');
  lines.push('npx scaforge list');
  lines.push('');
  lines.push('# Add a new plugin');
  lines.push('npx scaforge add <plugin-name>');
  lines.push('');
  lines.push('# Remove a plugin');
  lines.push('npx scaforge remove <plugin-name>');
  lines.push('');
  lines.push('# Update plugins');
  lines.push('npx scaforge update');
  lines.push('```');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`*Generated by Scaforge on ${new Date().toISOString().split('T')[0]}*`);
  
  return lines.join('\n');
}


/**
 * Generates API documentation content based on installed API plugin
 */
export function generateApiDocContent(
  _config: ScaforgeConfig,
  apiPlugin: PluginDefinition
): string {
  const lines: string[] = [];
  
  lines.push('# API Documentation');
  lines.push('');
  lines.push(`> API layer powered by **${apiPlugin.displayName}**`);
  lines.push('');
  
  // API-specific documentation based on plugin type
  switch (apiPlugin.name) {
    case 'api-trpc':
      lines.push('## tRPC Setup');
      lines.push('');
      lines.push('This project uses tRPC for end-to-end typesafe APIs.');
      lines.push('');
      lines.push('### Directory Structure');
      lines.push('');
      lines.push('```');
      lines.push('src/');
      lines.push('├── server/');
      lines.push('│   └── trpc/');
      lines.push('│       ├── index.ts        # tRPC initialization');
      lines.push('│       ├── context.ts      # Request context');
      lines.push('│       └── routers/');
      lines.push('│           ├── index.ts    # Root router');
      lines.push('│           └── example.ts  # Example router');
      lines.push('└── lib/');
      lines.push('    └── trpc.ts             # Client setup');
      lines.push('```');
      lines.push('');
      lines.push('### Usage');
      lines.push('');
      lines.push('```typescript');
      lines.push("import { trpc } from '@/lib/trpc';");
      lines.push('');
      lines.push('// In a React component');
      lines.push('const { data } = trpc.example.hello.useQuery({ name: "World" });');
      lines.push('```');
      break;
      
    case 'api-apollo':
      lines.push('## Apollo GraphQL Setup');
      lines.push('');
      lines.push('This project uses Apollo Server for GraphQL APIs.');
      lines.push('');
      lines.push('### Directory Structure');
      lines.push('');
      lines.push('```');
      lines.push('src/');
      lines.push('├── graphql/');
      lines.push('│   ├── schema.ts       # GraphQL schema');
      lines.push('│   ├── resolvers/      # Resolver functions');
      lines.push('│   └── types/          # Type definitions');
      lines.push('└── lib/');
      lines.push('    └── apollo.ts       # Apollo client setup');
      lines.push('```');
      break;
      
    case 'api-yoga':
      lines.push('## GraphQL Yoga Setup');
      lines.push('');
      lines.push('This project uses GraphQL Yoga with Pothos for type-safe GraphQL.');
      lines.push('');
      lines.push('### Directory Structure');
      lines.push('');
      lines.push('```');
      lines.push('src/');
      lines.push('├── graphql/');
      lines.push('│   ├── builder.ts      # Pothos schema builder');
      lines.push('│   ├── schema.ts       # Generated schema');
      lines.push('│   └── types/          # Type definitions');
      lines.push('└── lib/');
      lines.push('    └── graphql.ts      # Client setup');
      lines.push('```');
      break;
      
    case 'api-orpc':
      lines.push('## ORPC Setup');
      lines.push('');
      lines.push('This project uses ORPC for type-safe RPC APIs.');
      lines.push('');
      lines.push('### Directory Structure');
      lines.push('');
      lines.push('```');
      lines.push('src/');
      lines.push('├── server/');
      lines.push('│   └── orpc/');
      lines.push('│       ├── index.ts        # ORPC initialization');
      lines.push('│       └── procedures/     # RPC procedures');
      lines.push('└── lib/');
      lines.push('    └── orpc.ts             # Client setup');
      lines.push('```');
      break;
      
    default:
      lines.push('## API Setup');
      lines.push('');
      lines.push(`Refer to the ${apiPlugin.displayName} documentation for setup details.`);
  }
  
  lines.push('');
  
  // Official docs link
  const docsUrl = OFFICIAL_DOCS_URLS[apiPlugin.name];
  if (docsUrl) {
    lines.push('## Resources');
    lines.push('');
    lines.push(`- 📚 [${apiPlugin.displayName} Documentation](${docsUrl})`);
    lines.push('');
  }
  
  lines.push('---');
  lines.push('');
  lines.push(`*Generated by Scaforge on ${new Date().toISOString().split('T')[0]}*`);
  
  return lines.join('\n');
}


/**
 * Generates environment variables documentation
 */
export function generateEnvDocContent(
  _config: ScaforgeConfig,
  plugins: PluginDefinition[]
): string {
  const lines: string[] = [];
  
  lines.push('# Environment Variables');
  lines.push('');
  lines.push('> Required environment variables for installed plugins');
  lines.push('');
  
  // Collect all env vars
  const allEnvVars: Array<{
    plugin: string;
    name: string;
    description: string;
    required: boolean;
    secret: boolean;
  }> = [];
  
  for (const plugin of plugins) {
    if (plugin.envVars) {
      for (const env of plugin.envVars) {
        allEnvVars.push({
          plugin: plugin.displayName,
          name: env.name,
          description: env.description,
          required: env.required,
          secret: env.secret ?? false,
        });
      }
    }
  }
  
  if (allEnvVars.length === 0) {
    lines.push('No environment variables are required by the installed plugins.');
    return lines.join('\n');
  }
  
  // Required variables
  const required = allEnvVars.filter(e => e.required);
  if (required.length > 0) {
    lines.push('## Required Variables');
    lines.push('');
    lines.push('| Variable | Plugin | Description |');
    lines.push('|----------|--------|-------------|');
    for (const env of required) {
      const secret = env.secret ? ' 🔒' : '';
      lines.push(`| \`${env.name}\`${secret} | ${env.plugin} | ${env.description} |`);
    }
    lines.push('');
  }
  
  // Optional variables
  const optional = allEnvVars.filter(e => !e.required);
  if (optional.length > 0) {
    lines.push('## Optional Variables');
    lines.push('');
    lines.push('| Variable | Plugin | Description |');
    lines.push('|----------|--------|-------------|');
    for (const env of optional) {
      const secret = env.secret ? ' 🔒' : '';
      lines.push(`| \`${env.name}\`${secret} | ${env.plugin} | ${env.description} |`);
    }
    lines.push('');
  }
  
  // Example .env file
  lines.push('## Example `.env` File');
  lines.push('');
  lines.push('```bash');
  lines.push('# Scaforge Environment Variables');
  lines.push('');
  for (const env of allEnvVars) {
    lines.push(`# ${env.description} (${env.plugin})`);
    lines.push(`${env.name}=`);
    lines.push('');
  }
  lines.push('```');
  lines.push('');
  lines.push('> 🔒 Variables marked with a lock icon contain sensitive data and should never be committed to version control.');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`*Generated by Scaforge on ${new Date().toISOString().split('T')[0]}*`);
  
  return lines.join('\n');
}


/**
 * Result of documentation generation
 */
export interface DocsGenerationResult {
  /** Files that were generated */
  generatedFiles: string[];
  /** Output directory path */
  outputDir: string;
  /** Number of plugins documented */
  pluginCount: number;
}

/**
 * Generates all documentation files for a Scaforge project
 * 
 * Requirements: 44.1, 44.2, 44.3
 * 
 * @param projectRoot - Path to the project root directory
 * @param config - Scaforge configuration
 * @param options - Generation options
 * @returns Result containing generated file paths
 */
export async function generateDocs(
  projectRoot: string,
  config: ScaforgeConfig,
  options: DocsGeneratorOptions = {}
): Promise<DocsGenerationResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const outputDir = path.join(projectRoot, opts.outputDir);
  const generatedFiles: string[] = [];
  
  // Ensure output directory exists
  await fs.ensureDir(outputDir);
  
  // Get installed plugins
  const plugins = getInstalledPlugins(config);
  
  // Generate main plugins documentation (Requirement 44.1)
  const pluginsDocPath = path.join(outputDir, 'plugins.md');
  const pluginsContent = generatePluginsDocContent(config, plugins);
  await fs.writeFile(pluginsDocPath, pluginsContent, 'utf-8');
  generatedFiles.push(pluginsDocPath);
  
  // Generate API documentation if API plugin is installed (Requirement 44.2)
  if (opts.includeApiDocs && hasApiPlugin(config)) {
    const apiPluginName = getInstalledApiPlugin(config);
    if (apiPluginName) {
      const apiPlugin = registry.get(apiPluginName);
      if (apiPlugin) {
        const apiDocPath = path.join(outputDir, 'api.md');
        const apiContent = generateApiDocContent(config, apiPlugin);
        await fs.writeFile(apiDocPath, apiContent, 'utf-8');
        generatedFiles.push(apiDocPath);
      }
    }
  }
  
  // Generate environment variables documentation
  if (opts.includeEnvDocs) {
    const envDocPath = path.join(outputDir, 'environment.md');
    const envContent = generateEnvDocContent(config, plugins);
    await fs.writeFile(envDocPath, envContent, 'utf-8');
    generatedFiles.push(envDocPath);
  }
  
  // Generate index/README file
  const indexPath = path.join(outputDir, 'README.md');
  const indexContent = generateIndexContent(config, generatedFiles, opts.outputDir);
  await fs.writeFile(indexPath, indexContent, 'utf-8');
  generatedFiles.push(indexPath);
  
  return {
    generatedFiles,
    outputDir,
    pluginCount: plugins.length,
  };
}

/**
 * Generates the index/README file for the docs directory
 */
function generateIndexContent(
  config: ScaforgeConfig,
  generatedFiles: string[],
  _outputDir: string
): string {
  const lines: string[] = [];
  
  lines.push(`# ${config.name} Documentation`);
  lines.push('');
  lines.push('> Auto-generated documentation for your Scaforge project');
  lines.push('');
  lines.push('## Contents');
  lines.push('');
  
  // List generated files
  for (const file of generatedFiles) {
    const basename = path.basename(file);
    if (basename === 'README.md') continue;
    
    const name = basename.replace('.md', '');
    const displayName = name.charAt(0).toUpperCase() + name.slice(1);
    lines.push(`- [${displayName}](./${basename})`);
  }
  
  lines.push('');
  lines.push('## Project Info');
  lines.push('');
  lines.push(`- **Name:** ${config.name}`);
  lines.push(`- **Template:** ${config.template}`);
  lines.push(`- **Plugins:** ${Object.keys(config.plugins).filter(p => config.plugins[p]?.enabled).length} installed`);
  lines.push('');
  lines.push('## Regenerate Documentation');
  lines.push('');
  lines.push('To regenerate this documentation after adding or removing plugins:');
  lines.push('');
  lines.push('```bash');
  lines.push('npx scaforge docs');
  lines.push('```');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`*Generated by Scaforge on ${new Date().toISOString().split('T')[0]}*`);
  
  return lines.join('\n');
}

/**
 * Removes generated documentation directory
 * 
 * @param projectRoot - Path to the project root directory
 * @param options - Generation options (to determine output directory)
 */
export async function removeDocs(
  projectRoot: string,
  options: DocsGeneratorOptions = {}
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const outputDir = path.join(projectRoot, opts.outputDir);
  
  if (await fs.pathExists(outputDir)) {
    await fs.remove(outputDir);
  }
}

/**
 * Checks if documentation exists for a project
 * 
 * @param projectRoot - Path to the project root directory
 * @param options - Generation options
 * @returns true if docs directory exists
 */
export async function docsExist(
  projectRoot: string,
  options: DocsGeneratorOptions = {}
): Promise<boolean> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const outputDir = path.join(projectRoot, opts.outputDir);
  return fs.pathExists(outputDir);
}
