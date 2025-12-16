/**
 * Mock Factories
 * Factory functions for creating mock plugins and configurations
 */
import type { 
  PluginDefinition, 
  PluginCategory, 
  FrameworkTemplate,
  PluginFile,
  EnvVarDefinition,
  PluginIntegration,
  PluginPackages
} from '../plugin-system/types';
import { ALL_FRAMEWORK_TEMPLATES } from './helpers';

/**
 * Options for creating a mock plugin
 */
export interface MockPluginOptions {
  name?: string;
  displayName?: string;
  category?: PluginCategory;
  description?: string;
  version?: string;
  supportedTemplates?: FrameworkTemplate[];
  dependencies?: string[];
  conflicts?: string[];
  packages?: PluginPackages;
  envVars?: EnvVarDefinition[];
  files?: PluginFile[];
  integrations?: PluginIntegration[];
  postInstall?: string;
}

let mockPluginCounter = 0;

/**
 * Creates a mock plugin definition for testing
 */
export function createMockPlugin(options: MockPluginOptions = {}): PluginDefinition {
  const id = ++mockPluginCounter;
  
  return {
    name: options.name ?? `mock-plugin-${id}`,
    displayName: options.displayName ?? `Mock Plugin ${id}`,
    category: options.category ?? 'api',
    description: options.description ?? `A mock plugin for testing (${id})`,
    version: options.version ?? '1.0.0',
    supportedTemplates: options.supportedTemplates ?? ALL_FRAMEWORK_TEMPLATES,
    dependencies: options.dependencies,
    conflicts: options.conflicts,
    packages: options.packages ?? { dependencies: {}, devDependencies: {} },
    envVars: options.envVars,
    files: options.files ?? [],
    integrations: options.integrations,
    postInstall: options.postInstall,
  };
}

/**
 * Creates a mock plugin with dependencies
 */
export function createMockPluginWithDependencies(
  dependencies: string[],
  options: MockPluginOptions = {}
): PluginDefinition {
  return createMockPlugin({
    ...options,
    dependencies,
  });
}

/**
 * Creates a mock plugin with conflicts
 */
export function createMockPluginWithConflicts(
  conflicts: string[],
  options: MockPluginOptions = {}
): PluginDefinition {
  return createMockPlugin({
    ...options,
    conflicts,
  });
}

/**
 * Creates a mock plugin for a specific category
 */
export function createMockPluginForCategory(
  category: PluginCategory,
  options: MockPluginOptions = {}
): PluginDefinition {
  return createMockPlugin({
    ...options,
    category,
    name: options.name ?? `${category}-mock-${++mockPluginCounter}`,
    displayName: options.displayName ?? `Mock ${category} Plugin`,
  });
}

/**
 * Creates a mock plugin for specific templates only
 */
export function createMockPluginForTemplates(
  templates: FrameworkTemplate[],
  options: MockPluginOptions = {}
): PluginDefinition {
  return createMockPlugin({
    ...options,
    supportedTemplates: templates,
  });
}

/**
 * Creates a mock plugin with files
 */
export function createMockPluginWithFiles(
  files: PluginFile[],
  options: MockPluginOptions = {}
): PluginDefinition {
  return createMockPlugin({
    ...options,
    files,
  });
}

/**
 * Creates a mock plugin with environment variables
 */
export function createMockPluginWithEnvVars(
  envVars: EnvVarDefinition[],
  options: MockPluginOptions = {}
): PluginDefinition {
  return createMockPlugin({
    ...options,
    envVars,
  });
}

/**
 * Creates a mock plugin with integrations
 */
export function createMockPluginWithIntegrations(
  integrations: PluginIntegration[],
  options: MockPluginOptions = {}
): PluginDefinition {
  return createMockPlugin({
    ...options,
    integrations,
  });
}

/**
 * Creates a mock plugin file
 */
export function createMockPluginFile(
  path: string,
  template: string = '// Mock file content',
  overwrite: boolean = false
): PluginFile {
  return { path, template, overwrite };
}

/**
 * Creates a mock environment variable definition
 */
export function createMockEnvVar(
  name: string,
  options: Partial<EnvVarDefinition> = {}
): EnvVarDefinition {
  return {
    name,
    description: options.description ?? `Description for ${name}`,
    required: options.required ?? true,
    default: options.default,
    secret: options.secret ?? false,
  };
}

/**
 * Creates a mock plugin integration
 */
export function createMockIntegration(
  plugin: string,
  files: PluginFile[] = []
): PluginIntegration {
  return {
    plugin,
    type: 'middleware',
    files,
  };
}

/**
 * Creates a set of related mock plugins (base + dependents)
 */
export function createMockPluginFamily(
  baseName: string,
  dependentCount: number = 2
): { base: PluginDefinition; dependents: PluginDefinition[] } {
  const base = createMockPlugin({ name: baseName });
  const dependents = Array.from({ length: dependentCount }, (_, i) =>
    createMockPluginWithDependencies([baseName], {
      name: `${baseName}-dependent-${i + 1}`,
    })
  );
  
  return { base, dependents };
}

/**
 * Creates a chain of dependent plugins (A -> B -> C)
 */
export function createMockPluginChain(length: number = 3): PluginDefinition[] {
  const plugins: PluginDefinition[] = [];
  
  for (let i = 0; i < length; i++) {
    const plugin = createMockPlugin({
      name: `chain-plugin-${i + 1}`,
      dependencies: i > 0 ? [`chain-plugin-${i}`] : undefined,
    });
    plugins.push(plugin);
  }
  
  return plugins;
}

/**
 * Creates a pair of conflicting plugins
 */
export function createMockConflictingPlugins(): [PluginDefinition, PluginDefinition] {
  const pluginA = createMockPlugin({ name: 'conflict-a' });
  const pluginB = createMockPluginWithConflicts(['conflict-a'], { name: 'conflict-b' });
  
  return [pluginA, pluginB];
}

/**
 * Resets the mock plugin counter (useful between tests)
 */
export function resetMockPluginCounter(): void {
  mockPluginCounter = 0;
}
