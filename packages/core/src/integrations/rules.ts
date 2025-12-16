/**
 * Auto-Integration Rules
 * Defines automatic integration rules between plugin categories
 * 
 * Requirements: 41.1, 41.2, 41.3
 */
import type { PluginCategory } from '../plugin-system/types';

/**
 * Auto-integration rule definition
 */
export interface AutoIntegrationRule {
  /** Unique identifier for this rule */
  id: string;
  /** Human-readable description */
  description: string;
  /** Plugin patterns that trigger this rule (both must be present) */
  when: [PluginPattern, PluginPattern];
  /** Action to perform when rule matches */
  action: IntegrationAction;
  /** Priority for rule ordering (higher = runs first) */
  priority?: number;
}

/**
 * Pattern for matching plugins
 * Can be a specific plugin name or a category wildcard (e.g., 'auth-*')
 */
export type PluginPattern = string;

/**
 * Action to perform for an integration
 */
export interface IntegrationAction {
  /** Type of integration action */
  type: 'add-middleware' | 'add-context' | 'add-procedures' | 'add-provider' | 'add-hook';
  /** Description of what this action does */
  description: string;
  /** Template files to generate (optional, plugins define their own) */
  templateHint?: string;
}

/**
 * Result of matching auto-integration rules
 */
export interface MatchedRule {
  /** The rule that matched */
  rule: AutoIntegrationRule;
  /** The specific plugins that matched */
  matchedPlugins: [string, string];
}


/**
 * Pre-defined auto-integration rules
 * These rules define how plugins should automatically integrate with each other
 * 
 * Requirements: 41.1, 41.2, 41.3
 */
export const autoIntegrationRules: AutoIntegrationRule[] = [
  // Auth + API integrations
  {
    id: 'auth-api-middleware',
    description: 'Add auth middleware to API routes',
    when: ['auth-*', 'api-*'],
    action: {
      type: 'add-middleware',
      description: 'Adds authentication middleware to protect API routes',
      templateHint: 'src/server/middleware/auth.ts',
    },
    priority: 100,
  },

  // Database + API integrations
  {
    id: 'db-api-context',
    description: 'Add database client to API context',
    when: ['db-*', 'api-*'],
    action: {
      type: 'add-context',
      description: 'Adds database client to API context for data access',
      templateHint: 'src/server/context/db.ts',
    },
    priority: 90,
  },

  // CMS + API integrations
  {
    id: 'cms-api-procedures',
    description: 'Add CMS procedures to API router',
    when: ['cms-*', 'api-*'],
    action: {
      type: 'add-procedures',
      description: 'Adds CMS-related procedures/resolvers to the API',
      templateHint: 'src/server/routers/cms.ts',
    },
    priority: 80,
  },

  // Auth + Database integrations
  {
    id: 'auth-db-adapter',
    description: 'Configure auth adapter for database',
    when: ['auth-*', 'db-*'],
    action: {
      type: 'add-provider',
      description: 'Configures authentication to use database for session/user storage',
      templateHint: 'src/lib/auth/adapter.ts',
    },
    priority: 95,
  },

  // Analytics + API integrations
  {
    id: 'analytics-api-hook',
    description: 'Add analytics tracking to API calls',
    when: ['analytics-*', 'api-*'],
    action: {
      type: 'add-hook',
      description: 'Adds analytics tracking hooks to API endpoints',
      templateHint: 'src/server/hooks/analytics.ts',
    },
    priority: 50,
  },

  // Cache + Database integrations
  {
    id: 'cache-db-layer',
    description: 'Add caching layer for database queries',
    when: ['cache-*', 'db-*'],
    action: {
      type: 'add-middleware',
      description: 'Adds caching middleware for database query results',
      templateHint: 'src/lib/db/cache.ts',
    },
    priority: 70,
  },

  // Storage + API integrations
  {
    id: 'storage-api-routes',
    description: 'Add file upload routes to API',
    when: ['storage-*', 'api-*'],
    action: {
      type: 'add-procedures',
      description: 'Adds file upload and management routes to the API',
      templateHint: 'src/server/routers/storage.ts',
    },
    priority: 60,
  },

  // Email + Auth integrations
  {
    id: 'email-auth-verification',
    description: 'Configure email for auth verification',
    when: ['email-*', 'auth-*'],
    action: {
      type: 'add-provider',
      description: 'Configures email provider for authentication verification emails',
      templateHint: 'src/lib/auth/email.ts',
    },
    priority: 85,
  },
];


/**
 * Checks if a plugin name matches a pattern
 * Patterns can be:
 * - Exact match: 'api-trpc'
 * - Category wildcard: 'auth-*' (matches any plugin starting with 'auth-')
 * 
 * @param pluginName - The plugin name to check
 * @param pattern - The pattern to match against
 * @returns true if the plugin matches the pattern
 */
export function matchesPattern(pluginName: string, pattern: PluginPattern): boolean {
  // Wildcard pattern (e.g., 'auth-*')
  if (pattern.endsWith('-*')) {
    const prefix = pattern.slice(0, -1); // Remove the '*'
    return pluginName.startsWith(prefix);
  }

  // Exact match
  return pluginName === pattern;
}

/**
 * Finds all auto-integration rules that apply to a set of installed plugins
 * 
 * @param installedPlugins - Array of installed plugin names
 * @returns Array of matched rules with the specific plugins that matched
 */
export function findMatchingRules(installedPlugins: string[]): MatchedRule[] {
  const matchedRules: MatchedRule[] = [];

  for (const rule of autoIntegrationRules) {
    const [pattern1, pattern2] = rule.when;

    // Find plugins matching each pattern
    const matches1 = installedPlugins.filter(p => matchesPattern(p, pattern1));
    const matches2 = installedPlugins.filter(p => matchesPattern(p, pattern2));

    // Create matched rules for each combination
    for (const plugin1 of matches1) {
      for (const plugin2 of matches2) {
        // Avoid matching the same plugin twice
        if (plugin1 !== plugin2) {
          matchedRules.push({
            rule,
            matchedPlugins: [plugin1, plugin2],
          });
        }
      }
    }
  }

  // Sort by priority (higher first)
  return matchedRules.sort((a, b) => (b.rule.priority ?? 0) - (a.rule.priority ?? 0));
}

/**
 * Gets all rules that would apply when adding a new plugin
 * 
 * @param newPlugin - Name of the plugin being added
 * @param existingPlugins - Array of already installed plugin names
 * @returns Array of matched rules
 */
export function getRulesForNewPlugin(
  newPlugin: string,
  existingPlugins: string[]
): MatchedRule[] {
  const allPlugins = [...existingPlugins, newPlugin];
  const allMatches = findMatchingRules(allPlugins);

  // Filter to only rules that involve the new plugin
  return allMatches.filter(
    match =>
      match.matchedPlugins[0] === newPlugin ||
      match.matchedPlugins[1] === newPlugin
  );
}

/**
 * Checks if a specific rule applies to two plugins
 * 
 * @param rule - The rule to check
 * @param plugin1 - First plugin name
 * @param plugin2 - Second plugin name
 * @returns true if the rule applies to these plugins
 */
export function ruleApplies(
  rule: AutoIntegrationRule,
  plugin1: string,
  plugin2: string
): boolean {
  const [pattern1, pattern2] = rule.when;

  // Check both orderings
  return (
    (matchesPattern(plugin1, pattern1) && matchesPattern(plugin2, pattern2)) ||
    (matchesPattern(plugin1, pattern2) && matchesPattern(plugin2, pattern1))
  );
}

/**
 * Gets all rules for a specific plugin category combination
 * 
 * @param category1 - First plugin category
 * @param category2 - Second plugin category
 * @returns Array of rules that apply to this category combination
 */
export function getRulesForCategories(
  category1: PluginCategory,
  category2: PluginCategory
): AutoIntegrationRule[] {
  const pattern1 = `${category1}-*`;
  const pattern2 = `${category2}-*`;

  return autoIntegrationRules.filter(rule => {
    const [rulePattern1, rulePattern2] = rule.when;
    return (
      (rulePattern1 === pattern1 && rulePattern2 === pattern2) ||
      (rulePattern1 === pattern2 && rulePattern2 === pattern1)
    );
  });
}

/**
 * Validates that all auto-integration rules are well-formed
 * 
 * @returns Array of validation errors (empty if all valid)
 */
export function validateRules(): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const rule of autoIntegrationRules) {
    // Check for duplicate IDs
    if (ids.has(rule.id)) {
      errors.push(`Duplicate rule ID: ${rule.id}`);
    }
    ids.add(rule.id);

    // Check that patterns are valid
    for (const pattern of rule.when) {
      if (!pattern || pattern.length === 0) {
        errors.push(`Rule ${rule.id} has empty pattern`);
      }
    }

    // Check that action is defined
    if (!rule.action || !rule.action.type) {
      errors.push(`Rule ${rule.id} has invalid action`);
    }
  }

  return errors;
}
