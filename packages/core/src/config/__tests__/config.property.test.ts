/**
 * Property-based tests for Configuration System
 * 
 * **Feature: scaforge, Property 4: Configuration Validity**
 * **Validates: Requirements 40.1, 40.2**
 * 
 * Tests that configuration serialization and parsing maintains consistency:
 * - Serializing a config and deserializing it produces an equivalent config
 * - Valid configs pass schema validation
 * - Generated config file content can be parsed back
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  ScaforgeConfig,
  scaforgeConfigSchema,
  createDefaultConfig,
  FrameworkTemplateConfig,
} from '../types';
import {
  serializeConfig,
  deserializeConfig,
  generateConfigFileContent,
  parseConfigContent,
} from '../loader';

// Valid framework templates
const FRAMEWORK_TEMPLATES: FrameworkTemplateConfig[] = ['nextjs', 'tanstack', 'nuxt', 'hydrogen'];

// Reserved JavaScript property names to exclude from generated keys
// These don't round-trip correctly through JSON serialization
const RESERVED_JS_NAMES = new Set([
  'constructor', 'prototype', '__proto__', 'hasOwnProperty',
  'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString',
  'toString', 'valueOf', '__defineGetter__', '__defineSetter__',
  '__lookupGetter__', '__lookupSetter__'
]);

// Arbitrary for generating valid project names (npm package name rules)
const projectNameArb = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-'.split('')),
  { minLength: 1, maxLength: 50 }
).filter(s => /^[a-z][a-z0-9-]*[a-z0-9]$/.test(s) || /^[a-z]$/.test(s));

// Arbitrary for generating valid plugin names
// Exclude reserved JavaScript property names
const pluginNameArb = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-'.split('')),
  { minLength: 3, maxLength: 30 }
).filter(s => /^[a-z][a-z0-9-]*[a-z0-9]$/.test(s) && !RESERVED_JS_NAMES.has(s));

// Arbitrary for plugin options (simple JSON-compatible values)
// Exclude single quotes from strings to ensure round-trip compatibility
const safeStringArb = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 _-'.split('')),
  { maxLength: 50 }
);

const pluginOptionsArb = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 20 }).filter(s => 
    /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s) && !RESERVED_JS_NAMES.has(s)
  ),
  fc.oneof(
    safeStringArb,
    fc.boolean(),
    fc.integer({ min: -1000, max: 1000 }),
    fc.constant(null)
  ),
  { minKeys: 0, maxKeys: 5 }
);

// Arbitrary for plugin configuration
const pluginConfigArb = fc.record({
  enabled: fc.boolean(),
  options: fc.option(pluginOptionsArb, { nil: undefined }),
});

// Arbitrary for code style
const codeStyleArb = fc.record({
  semicolons: fc.boolean(),
  singleQuote: fc.boolean(),
  tabWidth: fc.integer({ min: 1, max: 8 }),
});

// Arbitrary for settings
const settingsArb = fc.record({
  generateExamples: fc.boolean(),
  codeStyle: fc.option(codeStyleArb, { nil: undefined }),
});

// Arbitrary for generating valid ScaforgeConfig objects
const scaforgeConfigArb: fc.Arbitrary<ScaforgeConfig> = fc.record({
  name: projectNameArb,
  template: fc.constantFrom(...FRAMEWORK_TEMPLATES),
  plugins: fc.dictionary(pluginNameArb, pluginConfigArb, { minKeys: 0, maxKeys: 10 }),
  settings: fc.option(settingsArb, { nil: undefined }),
});

describe('Configuration Property Tests', () => {
  /**
   * **Feature: scaforge, Property 4: Configuration Validity**
   * **Validates: Requirements 40.1, 40.2**
   * 
   * Property: JSON Serialization Round-Trip
   * For any valid ScaforgeConfig, serializing to JSON and deserializing
   * should produce an equivalent configuration.
   */
  it('JSON serialization round-trip preserves configuration', () => {
    fc.assert(
      fc.property(scaforgeConfigArb, (config) => {
        const serialized = serializeConfig(config);
        const deserialized = deserializeConfig(serialized);
        
        // Core fields must match exactly
        expect(deserialized.name).toBe(config.name);
        expect(deserialized.template).toBe(config.template);
        
        // Plugins must match
        expect(Object.keys(deserialized.plugins).sort()).toEqual(
          Object.keys(config.plugins).sort()
        );
        
        for (const [name, pluginConfig] of Object.entries(config.plugins)) {
          expect(deserialized.plugins[name]?.enabled).toBe(pluginConfig.enabled);
          if (pluginConfig.options) {
            expect(deserialized.plugins[name]?.options).toEqual(pluginConfig.options);
          }
        }
        
        // Settings must match if present
        if (config.settings) {
          expect(deserialized.settings?.generateExamples).toBe(config.settings.generateExamples);
          if (config.settings.codeStyle) {
            expect(deserialized.settings?.codeStyle).toEqual(config.settings.codeStyle);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: scaforge, Property 4: Configuration Validity**
   * **Validates: Requirements 40.1, 40.2**
   * 
   * Property: Schema Validation Accepts Valid Configs
   * All generated configs should pass schema validation.
   */
  it('schema validation accepts all valid configs', () => {
    fc.assert(
      fc.property(scaforgeConfigArb, (config) => {
        const result = scaforgeConfigSchema.safeParse(config);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: scaforge, Property 4: Configuration Validity**
   * **Validates: Requirements 40.1, 40.2**
   * 
   * Property: Default Config is Valid
   * Creating a default config should always produce a valid config.
   */
  it('default config is always valid', () => {
    fc.assert(
      fc.property(
        projectNameArb,
        fc.constantFrom(...FRAMEWORK_TEMPLATES),
        (name, template) => {
          const config = createDefaultConfig(name, template);
          const result = scaforgeConfigSchema.safeParse(config);
          
          expect(result.success).toBe(true);
          expect(config.name).toBe(name);
          expect(config.template).toBe(template);
          expect(config.plugins).toEqual({});
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: scaforge, Property 4: Configuration Validity**
   * **Validates: Requirements 40.1, 40.2**
   * 
   * Property: Config File Generation Round-Trip
   * Generating a config file and parsing it back should preserve the config.
   */
  it('config file generation round-trip preserves configuration', () => {
    fc.assert(
      fc.property(scaforgeConfigArb, (config) => {
        const fileContent = generateConfigFileContent(config);
        const parsed = parseConfigContent(fileContent);
        const validated = scaforgeConfigSchema.parse(parsed);
        
        // Core fields must match
        expect(validated.name).toBe(config.name);
        expect(validated.template).toBe(config.template);
        
        // Plugin names must match
        expect(Object.keys(validated.plugins).sort()).toEqual(
          Object.keys(config.plugins).sort()
        );
        
        // Plugin enabled states must match
        for (const [name, pluginConfig] of Object.entries(config.plugins)) {
          expect(validated.plugins[name]?.enabled).toBe(pluginConfig.enabled);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Plugin Addition Preserves Existing Plugins
   * Adding a new plugin to a config should not affect existing plugins.
   */
  it('adding a plugin preserves existing plugins', () => {
    fc.assert(
      fc.property(
        scaforgeConfigArb,
        pluginNameArb,
        pluginConfigArb,
        (config, newPluginName, newPluginConfig) => {
          // Skip if plugin name already exists
          if (config.plugins[newPluginName]) {
            return;
          }
          
          const originalPluginNames = Object.keys(config.plugins);
          
          // Add new plugin
          const updatedConfig: ScaforgeConfig = {
            ...config,
            plugins: {
              ...config.plugins,
              [newPluginName]: newPluginConfig,
            },
          };
          
          // Verify original plugins are preserved
          for (const name of originalPluginNames) {
            expect(updatedConfig.plugins[name]).toEqual(config.plugins[name]);
          }
          
          // Verify new plugin was added
          expect(updatedConfig.plugins[newPluginName]).toEqual(newPluginConfig);
          
          // Verify config is still valid
          const result = scaforgeConfigSchema.safeParse(updatedConfig);
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Plugin Removal Preserves Other Plugins
   * Removing a plugin should not affect other plugins.
   */
  it('removing a plugin preserves other plugins', () => {
    fc.assert(
      fc.property(
        scaforgeConfigArb.filter(c => Object.keys(c.plugins).length > 0),
        (config) => {
          const pluginNames = Object.keys(config.plugins);
          const pluginToRemove = pluginNames[0]!;
          const remainingPlugins = pluginNames.slice(1);
          
          // Remove plugin by creating new object without it
          const remainingPluginConfigs = { ...config.plugins };
          delete remainingPluginConfigs[pluginToRemove];
          
          const updatedConfig: ScaforgeConfig = {
            ...config,
            plugins: remainingPluginConfigs,
          };
          
          // Verify remaining plugins are preserved
          for (const name of remainingPlugins) {
            expect(updatedConfig.plugins[name]).toEqual(config.plugins[name]);
          }
          
          // Verify removed plugin is gone
          expect(updatedConfig.plugins[pluginToRemove]).toBeUndefined();
          
          // Verify config is still valid
          const result = scaforgeConfigSchema.safeParse(updatedConfig);
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
