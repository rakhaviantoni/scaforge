/**
 * Arbitrary Generators for Property-Based Testing
 * Fast-check arbitraries for generating test data
 */
import * as fc from 'fast-check';
import type { 
  PluginDefinition, 
  PluginCategory, 
  FrameworkTemplate,
  PluginFile,
  EnvVarDefinition,
  PluginPackages
} from '../plugin-system/types';
import type { ScaforgeConfig } from '../config/types';
import { ALL_PLUGIN_CATEGORIES, ALL_FRAMEWORK_TEMPLATES } from './helpers';

// Reserved JavaScript property names to exclude
const RESERVED_NAMES = new Set([
  'constructor', 'prototype', '__proto__', 'hasOwnProperty',
  'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString',
  'toString', 'valueOf', '__defineGetter__', '__defineSetter__',
  '__lookupGetter__', '__lookupSetter__'
]);

/**
 * Arbitrary for valid plugin names (kebab-case)
 */
export const pluginNameArb: fc.Arbitrary<string> = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
  { minLength: 3, maxLength: 15 }
).filter(s => /^[a-z][a-z0-9]*$/.test(s) && !RESERVED_NAMES.has(s));

/**
 * Arbitrary for valid project names (npm package name rules)
 */
export const projectNameArb: fc.Arbitrary<string> = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-'.split('')),
  { minLength: 1, maxLength: 50 }
).filter(s => /^[a-z][a-z0-9-]*[a-z0-9]$/.test(s) || /^[a-z]$/.test(s));

/**
 * Arbitrary for plugin categories
 */
export const pluginCategoryArb: fc.Arbitrary<PluginCategory> = 
  fc.constantFrom(...ALL_PLUGIN_CATEGORIES);

/**
 * Arbitrary for framework templates
 */
export const frameworkTemplateArb: fc.Arbitrary<FrameworkTemplate> = 
  fc.constantFrom(...ALL_FRAMEWORK_TEMPLATES);

/**
 * Arbitrary for semantic version strings
 */
export const semverArb: fc.Arbitrary<string> = fc.tuple(
  fc.nat(10),
  fc.nat(20),
  fc.nat(100)
).map(([major, minor, patch]) => `${major}.${minor}.${patch}`);

/**
 * Arbitrary for npm package version constraints
 */
export const packageVersionArb: fc.Arbitrary<string> = fc.oneof(
  semverArb,
  semverArb.map(v => `^${v}`),
  semverArb.map(v => `~${v}`),
  semverArb.map(v => `>=${v}`)
);

/**
 * Arbitrary for plugin packages
 */
export const pluginPackagesArb: fc.Arbitrary<PluginPackages> = fc.record({
  dependencies: fc.dictionary(
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz-'.split('')), { minLength: 1, maxLength: 20 }),
    packageVersionArb,
    { minKeys: 0, maxKeys: 5 }
  ),
  devDependencies: fc.dictionary(
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz-'.split('')), { minLength: 1, maxLength: 20 }),
    packageVersionArb,
    { minKeys: 0, maxKeys: 3 }
  ),
});

/**
 * Arbitrary for environment variable definitions
 */
export const envVarArb: fc.Arbitrary<EnvVarDefinition> = fc.record({
  name: fc.stringOf(
    fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ_'.split('')),
    { minLength: 3, maxLength: 30 }
  ).filter(s => /^[A-Z][A-Z0-9_]*$/.test(s)),
  description: fc.string({ minLength: 1, maxLength: 100 }),
  required: fc.boolean(),
  default: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
  secret: fc.boolean(),
});

/**
 * Arbitrary for plugin files
 */
export const pluginFileArb: fc.Arbitrary<PluginFile> = fc.record({
  path: fc.stringOf(
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-_/.'.split('')),
    { minLength: 5, maxLength: 50 }
  ).filter(s => /^[a-z][a-z0-9-_/]*\.[a-z]+$/.test(s)),
  template: fc.string({ minLength: 1, maxLength: 500 }),
  overwrite: fc.boolean(),
});

/**
 * Arbitrary for simple plugin definitions (no dependencies/conflicts)
 */
export const simplePluginArb: fc.Arbitrary<PluginDefinition> = fc.record({
  name: pluginNameArb,
  displayName: fc.string({ minLength: 1, maxLength: 50 }),
  category: pluginCategoryArb,
  description: fc.string({ minLength: 1, maxLength: 200 }),
  version: semverArb,
  supportedTemplates: fc.constant(ALL_FRAMEWORK_TEMPLATES),
  packages: fc.constant({ dependencies: {}, devDependencies: {} }),
  files: fc.constant([]),
});

/**
 * Arbitrary for plugin definitions with files
 */
export const pluginWithFilesArb: fc.Arbitrary<PluginDefinition> = fc.record({
  name: pluginNameArb,
  displayName: fc.string({ minLength: 1, maxLength: 50 }),
  category: pluginCategoryArb,
  description: fc.string({ minLength: 1, maxLength: 200 }),
  version: semverArb,
  supportedTemplates: fc.constant(ALL_FRAMEWORK_TEMPLATES),
  packages: pluginPackagesArb,
  files: fc.array(pluginFileArb, { minLength: 1, maxLength: 5 }),
  envVars: fc.array(envVarArb, { minLength: 0, maxLength: 3 }),
});

/**
 * Arbitrary for ScaforgeConfig
 */
export const scaforgeConfigArb: fc.Arbitrary<ScaforgeConfig> = fc.record({
  name: projectNameArb,
  template: frameworkTemplateArb,
  plugins: fc.constant({}),
  settings: fc.constant({ generateExamples: true }),
});

/**
 * Arbitrary for ScaforgeConfig with plugins
 */
export const scaforgeConfigWithPluginsArb: fc.Arbitrary<ScaforgeConfig> = fc.record({
  name: projectNameArb,
  template: frameworkTemplateArb,
  plugins: fc.dictionary(
    pluginNameArb,
    fc.record({
      enabled: fc.boolean(),
      options: fc.constant({}),
    }),
    { minKeys: 0, maxKeys: 5 }
  ),
  settings: fc.record({
    generateExamples: fc.boolean(),
    codeStyle: fc.option(
      fc.record({
        semicolons: fc.boolean(),
        singleQuote: fc.boolean(),
        tabWidth: fc.integer({ min: 1, max: 8 }),
      }),
      { nil: undefined }
    ),
  }),
});

/**
 * Creates an arbitrary for plugins with specific templates
 */
export function pluginForTemplatesArb(
  templates: FrameworkTemplate[]
): fc.Arbitrary<PluginDefinition> {
  return simplePluginArb.map(plugin => ({
    ...plugin,
    supportedTemplates: templates,
  }));
}

/**
 * Creates an arbitrary for plugins with dependencies
 */
export function pluginWithDependenciesArb(
  dependencyNames: string[]
): fc.Arbitrary<PluginDefinition> {
  return simplePluginArb.map(plugin => ({
    ...plugin,
    dependencies: dependencyNames,
  }));
}

/**
 * Creates an arbitrary for plugins with conflicts
 */
export function pluginWithConflictsArb(
  conflictNames: string[]
): fc.Arbitrary<PluginDefinition> {
  return simplePluginArb.map(plugin => ({
    ...plugin,
    conflicts: conflictNames,
  }));
}

/**
 * Creates an arbitrary for a pair of unique plugins
 */
export const uniquePluginPairArb: fc.Arbitrary<[PluginDefinition, PluginDefinition]> = 
  fc.tuple(simplePluginArb, simplePluginArb).map(([p1, p2]) => [
    p1,
    { ...p2, name: `${p2.name}2` },
  ]);

/**
 * Creates an arbitrary for an array of unique plugins
 */
export function uniquePluginsArb(
  minLength: number = 1,
  maxLength: number = 5
): fc.Arbitrary<PluginDefinition[]> {
  return fc.array(simplePluginArb, { minLength, maxLength }).map(plugins =>
    plugins.map((p, i) => ({ ...p, name: `${p.name}${i}` }))
  );
}
