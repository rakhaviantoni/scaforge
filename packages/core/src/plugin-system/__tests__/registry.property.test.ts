/**
 * Property-based tests for Plugin Registry
 * 
 * **Feature: scaforge, Property 4: Configuration Validity**
 * **Validates: Requirements 40.1, 40.2**
 * 
 * Tests that plugin registry operations maintain consistency:
 * - Registering a plugin makes it retrievable
 * - Unregistering a plugin removes it completely
 * - Category filtering returns correct plugins
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { PluginRegistry } from '../registry';
import type { PluginDefinition, PluginCategory, FrameworkTemplate } from '../types';

// Valid plugin categories
const PLUGIN_CATEGORIES: PluginCategory[] = [
  'api', 'cms', 'auth', 'database', 'payments', 'email', 'storage',
  'analytics', 'monitoring', 'caching', 'jobs', 'search', 'flags',
  'sms', 'push', 'realtime', 'ai', 'vector', 'i18n', 'forms',
  'state', 'testing', 'security', 'media', 'maps', 'charts', 'pdf',
  'seo', 'scheduling', 'comments', 'notifications', 'admin', 'content', 'indonesian'
];

// Valid framework templates
const FRAMEWORK_TEMPLATES: FrameworkTemplate[] = ['nextjs', 'tanstack', 'nuxt', 'hydrogen'];

// Arbitrary for generating valid plugin names (kebab-case)
const pluginNameArb = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
  { minLength: 3, maxLength: 20 }
).filter(s => /^[a-z][a-z0-9]*$/.test(s));

// Arbitrary for generating valid plugin definitions
const pluginDefinitionArb: fc.Arbitrary<PluginDefinition> = fc.record({
  name: pluginNameArb,
  displayName: fc.string({ minLength: 1, maxLength: 50 }),
  category: fc.constantFrom(...PLUGIN_CATEGORIES),
  description: fc.string({ minLength: 1, maxLength: 200 }),
  version: fc.tuple(fc.nat(10), fc.nat(20), fc.nat(100)).map(([a, b, c]) => `${a}.${b}.${c}`),
  supportedTemplates: fc.subarray(FRAMEWORK_TEMPLATES, { minLength: 1 }),
  packages: fc.record({
    dependencies: fc.option(fc.dictionary(fc.string({ minLength: 1 }), fc.string({ minLength: 1 })), { nil: undefined }),
    devDependencies: fc.option(fc.dictionary(fc.string({ minLength: 1 }), fc.string({ minLength: 1 })), { nil: undefined }),
  }),
  files: fc.array(fc.record({
    path: fc.string({ minLength: 1 }),
    template: fc.string(),
  }), { maxLength: 5 }),
});

describe('PluginRegistry Property Tests', () => {
  /**
   * Property: Register then Get returns the same plugin
   * For any valid plugin definition, registering it and then getting it
   * should return an equivalent plugin definition.
   */
  it('register then get returns the same plugin', () => {
    fc.assert(
      fc.property(pluginDefinitionArb, (plugin) => {
        const registry = new PluginRegistry();
        registry.register(plugin);
        const retrieved = registry.get(plugin.name);
        
        expect(retrieved).toBeDefined();
        expect(retrieved?.name).toBe(plugin.name);
        expect(retrieved?.displayName).toBe(plugin.displayName);
        expect(retrieved?.category).toBe(plugin.category);
        expect(retrieved?.version).toBe(plugin.version);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Register then Unregister removes the plugin
   * For any valid plugin, registering and then unregistering should
   * result in the plugin not being found.
   */
  it('register then unregister removes the plugin', () => {
    fc.assert(
      fc.property(pluginDefinitionArb, (plugin) => {
        const registry = new PluginRegistry();
        registry.register(plugin);
        expect(registry.has(plugin.name)).toBe(true);
        
        const removed = registry.unregister(plugin.name);
        expect(removed).toBe(true);
        expect(registry.has(plugin.name)).toBe(false);
        expect(registry.get(plugin.name)).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: getByCategory returns only plugins of that category
   * For any set of plugins, getByCategory should return exactly
   * those plugins that have the specified category.
   */
  it('getByCategory returns only plugins of that category', () => {
    fc.assert(
      fc.property(
        fc.array(pluginDefinitionArb, { minLength: 1, maxLength: 20 }),
        fc.constantFrom(...PLUGIN_CATEGORIES),
        (plugins, targetCategory) => {
          const registry = new PluginRegistry();
          
          // Ensure unique names by adding index suffix
          const uniquePlugins = plugins.map((p, i) => ({
            ...p,
            name: `${p.name}${i}`,
          }));
          
          uniquePlugins.forEach(p => registry.register(p));
          
          const categoryPlugins = registry.getByCategory(targetCategory);
          const expectedPlugins = uniquePlugins.filter(p => p.category === targetCategory);
          
          // All returned plugins should have the target category
          categoryPlugins.forEach(p => {
            expect(p.category).toBe(targetCategory);
          });
          
          // Count should match
          expect(categoryPlugins.length).toBe(expectedPlugins.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: size reflects the number of unique registered plugins
   * The size should equal the number of unique plugin names registered.
   */
  it('size reflects the number of unique registered plugins', () => {
    fc.assert(
      fc.property(
        fc.array(pluginDefinitionArb, { minLength: 0, maxLength: 20 }),
        (plugins) => {
          const registry = new PluginRegistry();
          
          // Ensure unique names
          const uniquePlugins = plugins.map((p, i) => ({
            ...p,
            name: `${p.name}${i}`,
          }));
          
          uniquePlugins.forEach(p => registry.register(p));
          
          expect(registry.size()).toBe(uniquePlugins.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: getAll returns all registered plugins
   * After registering N unique plugins, getAll should return exactly N plugins.
   */
  it('getAll returns all registered plugins', () => {
    fc.assert(
      fc.property(
        fc.array(pluginDefinitionArb, { minLength: 0, maxLength: 15 }),
        (plugins) => {
          const registry = new PluginRegistry();
          
          // Ensure unique names
          const uniquePlugins = plugins.map((p, i) => ({
            ...p,
            name: `${p.name}${i}`,
          }));
          
          uniquePlugins.forEach(p => registry.register(p));
          
          const all = registry.getAll();
          expect(all.length).toBe(uniquePlugins.length);
          
          // Every registered plugin should be in the result
          uniquePlugins.forEach(p => {
            expect(all.some(a => a.name === p.name)).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: getCategories returns only categories with plugins
   * The returned categories should be exactly those that have at least one plugin.
   */
  it('getCategories returns only categories with plugins', () => {
    fc.assert(
      fc.property(
        fc.array(pluginDefinitionArb, { minLength: 1, maxLength: 15 }),
        (plugins) => {
          const registry = new PluginRegistry();
          
          // Ensure unique names
          const uniquePlugins = plugins.map((p, i) => ({
            ...p,
            name: `${p.name}${i}`,
          }));
          
          uniquePlugins.forEach(p => registry.register(p));
          
          const categories = registry.getCategories();
          const expectedCategories = new Set(uniquePlugins.map(p => p.category));
          
          expect(categories.length).toBe(expectedCategories.size);
          categories.forEach(c => {
            expect(expectedCategories.has(c)).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: clear removes all plugins
   * After clear, the registry should be empty.
   */
  it('clear removes all plugins', () => {
    fc.assert(
      fc.property(
        fc.array(pluginDefinitionArb, { minLength: 1, maxLength: 10 }),
        (plugins) => {
          const registry = new PluginRegistry();
          
          // Ensure unique names
          const uniquePlugins = plugins.map((p, i) => ({
            ...p,
            name: `${p.name}${i}`,
          }));
          
          uniquePlugins.forEach(p => registry.register(p));
          expect(registry.size()).toBeGreaterThan(0);
          
          registry.clear();
          
          expect(registry.size()).toBe(0);
          expect(registry.getAll()).toHaveLength(0);
          uniquePlugins.forEach(p => {
            expect(registry.has(p.name)).toBe(false);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
