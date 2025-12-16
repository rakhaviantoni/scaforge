/**
 * Test Helpers
 * Common utilities for testing Scaforge plugins and projects
 */
import type { ScaforgeConfig } from '../config/types';
import type { PluginDefinition, FrameworkTemplate, PluginCategory } from '../plugin-system/types';
import { PluginRegistry } from '../plugin-system/registry';
import { PluginManager } from '../plugin-system/manager';

/**
 * Creates a base ScaforgeConfig for testing
 */
export function createTestConfig(
  overrides: Partial<ScaforgeConfig> = {}
): ScaforgeConfig {
  return {
    name: 'test-project',
    template: 'nextjs',
    plugins: {},
    settings: { generateExamples: true },
    ...overrides,
  };
}

/**
 * Creates a test config for a specific template
 */
export function createTestConfigForTemplate(
  template: FrameworkTemplate,
  overrides: Partial<ScaforgeConfig> = {}
): ScaforgeConfig {
  return createTestConfig({ template, ...overrides });
}

/**
 * Creates a PluginRegistry with the given plugins
 */
export function createTestRegistry(plugins: PluginDefinition[]): PluginRegistry {
  const registry = new PluginRegistry();
  plugins.forEach(plugin => registry.register(plugin));
  return registry;
}

/**
 * Creates a PluginManager for testing with the given config and plugins
 */
export function createTestManager(
  config: ScaforgeConfig,
  plugins: PluginDefinition[],
  options: { autoInstallDependencies?: boolean } = {}
): PluginManager {
  const registry = createTestRegistry(plugins);
  return new PluginManager(config, {
    registry,
    autoInstallDependencies: options.autoInstallDependencies ?? false,
  });
}

/**
 * Creates a test environment with config, registry, and manager
 */
export interface TestEnvironment {
  config: ScaforgeConfig;
  registry: PluginRegistry;
  manager: PluginManager;
}

export function createTestEnvironment(
  plugins: PluginDefinition[],
  configOverrides: Partial<ScaforgeConfig> = {},
  managerOptions: { autoInstallDependencies?: boolean } = {}
): TestEnvironment {
  const config = createTestConfig(configOverrides);
  const registry = createTestRegistry(plugins);
  const manager = new PluginManager(config, {
    registry,
    autoInstallDependencies: managerOptions.autoInstallDependencies ?? false,
  });
  
  return { config, registry, manager };
}

/**
 * Asserts that a plugin is installed in the manager
 */
export function assertPluginInstalled(
  manager: PluginManager,
  pluginName: string
): void {
  if (!manager.isInstalled(pluginName)) {
    throw new Error(`Expected plugin "${pluginName}" to be installed`);
  }
}

/**
 * Asserts that a plugin is NOT installed in the manager
 */
export function assertPluginNotInstalled(
  manager: PluginManager,
  pluginName: string
): void {
  if (manager.isInstalled(pluginName)) {
    throw new Error(`Expected plugin "${pluginName}" to NOT be installed`);
  }
}

/**
 * Asserts that all plugins in the list are installed
 */
export function assertAllPluginsInstalled(
  manager: PluginManager,
  pluginNames: string[]
): void {
  const installed = manager.getInstalled();
  for (const name of pluginNames) {
    if (!installed.includes(name)) {
      throw new Error(`Expected plugin "${name}" to be installed`);
    }
  }
}

/**
 * Gets the count of installed plugins
 */
export function getInstalledPluginCount(manager: PluginManager): number {
  return manager.getInstalled().length;
}

/**
 * Valid plugin categories for testing
 */
export const ALL_PLUGIN_CATEGORIES: PluginCategory[] = [
  'api', 'cms', 'auth', 'database', 'payments', 'email', 'storage',
  'analytics', 'monitoring', 'caching', 'jobs', 'search', 'flags',
  'sms', 'push', 'realtime', 'ai', 'vector', 'i18n', 'forms',
  'state', 'testing', 'security', 'media', 'maps', 'charts', 'pdf',
  'seo', 'scheduling', 'comments', 'notifications', 'admin', 'content', 'indonesian'
];

/**
 * Valid framework templates for testing
 */
export const ALL_FRAMEWORK_TEMPLATES: FrameworkTemplate[] = [
  'nextjs', 'tanstack', 'nuxt', 'hydrogen'
];
