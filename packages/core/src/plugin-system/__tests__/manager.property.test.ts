/**
 * Property-based tests for Plugin Manager
 * 
 * Tests the core plugin management operations:
 * - Add/Remove round-trip (Property 1)
 * - Dependency resolution (Property 2)
 * - Conflict prevention (Property 3)
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { PluginManager, PluginError } from '../manager';
import { PluginRegistry } from '../registry';
import type { PluginDefinition, PluginCategory, FrameworkTemplate } from '../types';
import type { ScaforgeConfig } from '../../config/types';

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
// Exclude reserved JavaScript property names
const RESERVED_NAMES = ['constructor', 'prototype', '__proto__', 'toString', 'valueOf', 'hasOwnProperty'];
const pluginNameArb = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
  { minLength: 3, maxLength: 15 }
).filter(s => /^[a-z][a-z0-9]*$/.test(s) && !RESERVED_NAMES.includes(s));

// Arbitrary for generating valid plugin definitions without dependencies/conflicts
const simplePluginArb: fc.Arbitrary<PluginDefinition> = fc.record({
  name: pluginNameArb,
  displayName: fc.string({ minLength: 1, maxLength: 50 }),
  category: fc.constantFrom(...PLUGIN_CATEGORIES),
  description: fc.string({ minLength: 1, maxLength: 200 }),
  version: fc.tuple(fc.nat(10), fc.nat(20), fc.nat(100)).map(([a, b, c]) => `${a}.${b}.${c}`),
  supportedTemplates: fc.constant(FRAMEWORK_TEMPLATES), // Support all templates for simplicity
  packages: fc.constant({ dependencies: {}, devDependencies: {} }),
  files: fc.constant([]),
});

// Helper to create a base config
function createBaseConfig(template: FrameworkTemplate = 'nextjs'): ScaforgeConfig {
  return {
    name: 'test-project',
    template,
    plugins: {},
    settings: { generateExamples: true },
  };
}

// Helper to create a registry with plugins
function createRegistryWithPlugins(plugins: PluginDefinition[]): PluginRegistry {
  const registry = new PluginRegistry();
  plugins.forEach(p => registry.register(p));
  return registry;
}


describe('PluginManager Property Tests', () => {
  /**
   * **Feature: scaforge, Property 1: Plugin Add/Remove Round-Trip**
   * **Validates: Requirements 2.3, 2.4, 3.4**
   * 
   * For any valid plugin and any project state, adding a plugin and then
   * removing it SHALL result in a project state equivalent to the original
   * (no leftover configs).
   */
  describe('Property 1: Plugin Add/Remove Round-Trip', () => {
    it('adding and removing a plugin returns config to original state', () => {
      fc.assert(
        fc.asyncProperty(
          simplePluginArb,
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          async (plugin, template) => {
            // Create registry with the plugin
            const registry = createRegistryWithPlugins([plugin]);
            
            // Create initial config
            const initialConfig = createBaseConfig(template);
            const initialPluginCount = Object.keys(initialConfig.plugins).length;
            
            // Create manager
            const manager = new PluginManager(initialConfig, { registry });
            
            // Add the plugin
            await manager.add(plugin.name);
            
            // Verify plugin was added
            expect(manager.isInstalled(plugin.name)).toBe(true);
            expect(manager.getInstalled()).toContain(plugin.name);
            
            // Remove the plugin
            await manager.remove(plugin.name);
            
            // Verify plugin was removed
            expect(manager.isInstalled(plugin.name)).toBe(false);
            expect(manager.getInstalled()).not.toContain(plugin.name);
            
            // Verify config is back to original state
            const finalConfig = manager.getConfig();
            expect(Object.keys(finalConfig.plugins).length).toBe(initialPluginCount);
            expect(finalConfig.plugins[plugin.name]).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('multiple add/remove cycles preserve config integrity', () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(simplePluginArb, { minLength: 2, maxLength: 5 }),
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          async (plugins, template) => {
            // Ensure unique plugin names
            const uniquePlugins = plugins.map((p, i) => ({
              ...p,
              name: `${p.name}${i}`,
            }));
            
            const registry = createRegistryWithPlugins(uniquePlugins);
            const initialConfig = createBaseConfig(template);
            const manager = new PluginManager(initialConfig, { registry });
            
            // Add all plugins
            for (const plugin of uniquePlugins) {
              await manager.add(plugin.name);
            }
            
            // Verify all are installed
            expect(manager.getInstalled().length).toBe(uniquePlugins.length);
            
            // Remove all plugins in reverse order
            for (const plugin of [...uniquePlugins].reverse()) {
              await manager.remove(plugin.name);
            }
            
            // Verify config is empty
            expect(manager.getInstalled().length).toBe(0);
            expect(Object.keys(manager.getConfig().plugins).length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * **Feature: scaforge, Property 7: Plugin Removal Dependency Check**
   * **Validates: Requirements 3.5**
   * 
   * For any plugin that other installed plugins depend on, attempting to remove it
   * SHALL result in an error listing the dependent plugins.
   */
  describe('Property 7: Plugin Removal Dependency Check', () => {
    it('cannot remove a plugin when other plugins depend on it', () => {
      fc.assert(
        fc.asyncProperty(
          simplePluginArb,
          fc.array(simplePluginArb, { minLength: 1, maxLength: 3 }),
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          async (basePlugin, dependentPlugins, template) => {
            // Create a base plugin and multiple plugins that depend on it
            const base = { ...basePlugin, name: `base${basePlugin.name}` };
            const dependents = dependentPlugins.map((p, i) => ({
              ...p,
              name: `dep${i}${p.name}`,
              dependencies: [base.name],
            }));
            
            const registry = createRegistryWithPlugins([base, ...dependents]);
            const config = createBaseConfig(template);
            const manager = new PluginManager(config, { 
              registry,
              autoInstallDependencies: true,
            });
            
            // Install all dependent plugins (which will auto-install the base)
            for (const dependent of dependents) {
              await manager.add(dependent.name);
            }
            
            // Verify all are installed
            expect(manager.isInstalled(base.name)).toBe(true);
            dependents.forEach(dep => {
              expect(manager.isInstalled(dep.name)).toBe(true);
            });
            
            // Try to remove the base plugin - should fail
            await expect(manager.remove(base.name)).rejects.toThrow(PluginError);
            
            // Base plugin should still be installed
            expect(manager.isInstalled(base.name)).toBe(true);
            
            // All dependents should still be installed
            dependents.forEach(dep => {
              expect(manager.isInstalled(dep.name)).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('getDependents returns correct list of dependent plugins', () => {
      fc.assert(
        fc.asyncProperty(
          simplePluginArb,
          fc.array(simplePluginArb, { minLength: 1, maxLength: 4 }),
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          async (basePlugin, dependentPlugins, template) => {
            // Create a base plugin and multiple plugins that depend on it
            const base = { ...basePlugin, name: `getdep${basePlugin.name}` };
            const dependents = dependentPlugins.map((p, i) => ({
              ...p,
              name: `getdep${i}${p.name}`,
              dependencies: [base.name],
            }));
            
            const registry = createRegistryWithPlugins([base, ...dependents]);
            const config = createBaseConfig(template);
            const manager = new PluginManager(config, { 
              registry,
              autoInstallDependencies: true,
            });
            
            // Install all dependent plugins
            for (const dependent of dependents) {
              await manager.add(dependent.name);
            }
            
            // Get dependents of the base plugin
            const actualDependents = manager.getDependents(base.name);
            
            // Should match the expected dependent names
            const expectedDependents = dependents.map(d => d.name);
            expect(actualDependents.sort()).toEqual(expectedDependents.sort());
            expect(actualDependents.length).toBe(dependents.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('can remove plugins in correct dependency order', () => {
      fc.assert(
        fc.asyncProperty(
          simplePluginArb,
          fc.array(simplePluginArb, { minLength: 1, maxLength: 3 }),
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          async (basePlugin, dependentPlugins, template) => {
            // Create a base plugin and multiple plugins that depend on it
            const base = { ...basePlugin, name: `order${basePlugin.name}` };
            const dependents = dependentPlugins.map((p, i) => ({
              ...p,
              name: `order${i}${p.name}`,
              dependencies: [base.name],
            }));
            
            const registry = createRegistryWithPlugins([base, ...dependents]);
            const config = createBaseConfig(template);
            const manager = new PluginManager(config, { 
              registry,
              autoInstallDependencies: true,
            });
            
            // Install all dependent plugins
            for (const dependent of dependents) {
              await manager.add(dependent.name);
            }
            
            // Remove dependents first (should succeed)
            for (const dependent of dependents) {
              await manager.remove(dependent.name);
              expect(manager.isInstalled(dependent.name)).toBe(false);
            }
            
            // Now remove the base plugin (should succeed)
            await manager.remove(base.name);
            expect(manager.isInstalled(base.name)).toBe(false);
            
            // All plugins should be removed
            expect(manager.getInstalled().length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('removal validation correctly identifies dependents', () => {
      fc.assert(
        fc.asyncProperty(
          simplePluginArb,
          simplePluginArb,
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          async (basePlugin, dependentPlugin, template) => {
            // Create a base plugin and one that depends on it
            const base = { ...basePlugin, name: `valid${basePlugin.name}` };
            const dependent = {
              ...dependentPlugin,
              name: `valid${dependentPlugin.name}`,
              dependencies: [base.name],
            };
            
            const registry = createRegistryWithPlugins([base, dependent]);
            const config = createBaseConfig(template);
            const manager = new PluginManager(config, { 
              registry,
              autoInstallDependencies: true,
            });
            
            // Install the dependent plugin
            await manager.add(dependent.name);
            
            // Validate removal of base - should fail
            const validation = manager.validateRemove(base.name);
            expect(validation.valid).toBe(false);
            expect(validation.errors.length).toBeGreaterThan(0);
            expect(validation.errors.some(e => e.includes(dependent.name))).toBe(true);
            
            // Remove the dependent first
            await manager.remove(dependent.name);
            
            // Now validate removal of base - should succeed
            const validation2 = manager.validateRemove(base.name);
            expect(validation2.valid).toBe(true);
            expect(validation2.errors.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: scaforge, Property 2: Plugin Dependency Resolution**
   * **Validates: Requirements 3.1, 3.5**
   * 
   * For any plugin with dependencies, adding that plugin SHALL result in
   * all dependency plugins being installed before the target plugin.
   */
  describe('Property 2: Plugin Dependency Resolution', () => {
    it('adding a plugin with dependencies installs dependencies first', () => {
      fc.assert(
        fc.asyncProperty(
          simplePluginArb,
          simplePluginArb,
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          async (basePlugin, dependentPlugin, template) => {
            // Ensure unique names
            const dep = { ...basePlugin, name: `dep${basePlugin.name}` };
            const main = {
              ...dependentPlugin,
              name: `main${dependentPlugin.name}`,
              dependencies: [dep.name],
            };
            
            const registry = createRegistryWithPlugins([dep, main]);
            const config = createBaseConfig(template);
            const manager = new PluginManager(config, { 
              registry,
              autoInstallDependencies: true,
            });
            
            // Add the main plugin (should auto-install dependency)
            const result = await manager.add(main.name);
            
            // Both should be installed
            expect(manager.isInstalled(dep.name)).toBe(true);
            expect(manager.isInstalled(main.name)).toBe(true);
            
            // Dependency should be in the installed dependencies list
            expect(result.installedDependencies).toContain(dep.name);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('chain dependencies are resolved transitively', () => {
      fc.assert(
        fc.asyncProperty(
          simplePluginArb,
          simplePluginArb,
          simplePluginArb,
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          async (p1, p2, p3, template) => {
            // Create a chain: p3 -> p2 -> p1
            const plugin1 = { ...p1, name: `chain1${p1.name}` };
            const plugin2 = { ...p2, name: `chain2${p2.name}`, dependencies: [plugin1.name] };
            const plugin3 = { ...p3, name: `chain3${p3.name}`, dependencies: [plugin2.name] };
            
            const registry = createRegistryWithPlugins([plugin1, plugin2, plugin3]);
            const config = createBaseConfig(template);
            const manager = new PluginManager(config, { 
              registry,
              autoInstallDependencies: true,
            });
            
            // Add the last plugin in the chain
            await manager.add(plugin3.name);
            
            // All three should be installed
            expect(manager.isInstalled(plugin1.name)).toBe(true);
            expect(manager.isInstalled(plugin2.name)).toBe(true);
            expect(manager.isInstalled(plugin3.name)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('cannot remove a plugin that others depend on', () => {
      fc.assert(
        fc.asyncProperty(
          simplePluginArb,
          simplePluginArb,
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          async (basePlugin, dependentPlugin, template) => {
            // Ensure unique names
            const dep = { ...basePlugin, name: `deprem${basePlugin.name}` };
            const main = {
              ...dependentPlugin,
              name: `mainrem${dependentPlugin.name}`,
              dependencies: [dep.name],
            };
            
            const registry = createRegistryWithPlugins([dep, main]);
            const config = createBaseConfig(template);
            const manager = new PluginManager(config, { 
              registry,
              autoInstallDependencies: true,
            });
            
            // Install both
            await manager.add(main.name);
            
            // Try to remove the dependency - should fail
            await expect(manager.remove(dep.name)).rejects.toThrow(PluginError);
            
            // Dependency should still be installed
            expect(manager.isInstalled(dep.name)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * **Feature: scaforge, Property 3: Plugin Conflict Prevention**
   * **Validates: Requirements 3.6, 41.4**
   * 
   * For any two plugins that are marked as conflicting, attempting to install
   * one when the other is already installed SHALL result in an error and no
   * state change.
   */
  describe('Property 3: Plugin Conflict Prevention', () => {
    it('cannot install a plugin that conflicts with an installed plugin', () => {
      fc.assert(
        fc.asyncProperty(
          simplePluginArb,
          simplePluginArb,
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          async (plugin1, plugin2, template) => {
            // Ensure unique names
            const installed = { ...plugin1, name: `inst${plugin1.name}` };
            const conflicting = {
              ...plugin2,
              name: `conf${plugin2.name}`,
              conflicts: [installed.name],
            };
            
            const registry = createRegistryWithPlugins([installed, conflicting]);
            const config = createBaseConfig(template);
            const manager = new PluginManager(config, { registry });
            
            // Install the first plugin
            await manager.add(installed.name);
            expect(manager.isInstalled(installed.name)).toBe(true);
            
            // Try to install the conflicting plugin - should fail
            await expect(manager.add(conflicting.name)).rejects.toThrow(PluginError);
            
            // Conflicting plugin should not be installed
            expect(manager.isInstalled(conflicting.name)).toBe(false);
            
            // Original plugin should still be installed
            expect(manager.isInstalled(installed.name)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('bidirectional conflicts are detected', () => {
      fc.assert(
        fc.asyncProperty(
          simplePluginArb,
          simplePluginArb,
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          async (plugin1, plugin2, template) => {
            // Ensure unique names
            const pluginA = { ...plugin1, name: `biA${plugin1.name}` };
            const pluginB = {
              ...plugin2,
              name: `biB${plugin2.name}`,
              conflicts: [pluginA.name],
            };
            // Also add reverse conflict
            pluginA.conflicts = [pluginB.name];
            
            const registry = createRegistryWithPlugins([pluginA, pluginB]);
            const config = createBaseConfig(template);
            const manager = new PluginManager(config, { registry });
            
            // Install plugin A
            await manager.add(pluginA.name);
            
            // Try to install plugin B - should fail
            await expect(manager.add(pluginB.name)).rejects.toThrow(PluginError);
            
            // Now test the reverse: fresh manager
            const manager2 = new PluginManager(createBaseConfig(template), { registry });
            
            // Install plugin B
            await manager2.add(pluginB.name);
            
            // Try to install plugin A - should fail
            await expect(manager2.add(pluginA.name)).rejects.toThrow(PluginError);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('conflict check does not modify state on failure', () => {
      fc.assert(
        fc.asyncProperty(
          simplePluginArb,
          simplePluginArb,
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          async (plugin1, plugin2, template) => {
            // Ensure unique names
            const installed = { ...plugin1, name: `state${plugin1.name}` };
            const conflicting = {
              ...plugin2,
              name: `stateconf${plugin2.name}`,
              conflicts: [installed.name],
            };
            
            const registry = createRegistryWithPlugins([installed, conflicting]);
            const config = createBaseConfig(template);
            const manager = new PluginManager(config, { registry });
            
            // Install the first plugin
            await manager.add(installed.name);
            
            // Capture state before failed add
            const stateBefore = JSON.stringify(manager.getConfig());
            
            // Try to install the conflicting plugin - should fail
            try {
              await manager.add(conflicting.name);
            } catch {
              // Expected
            }
            
            // State should be unchanged
            const stateAfter = JSON.stringify(manager.getConfig());
            expect(stateAfter).toBe(stateBefore);
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Additional property tests for edge cases
   */
  describe('Additional Properties', () => {
    it('getInstalled returns only enabled plugins', () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(simplePluginArb, { minLength: 1, maxLength: 5 }),
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          async (plugins, template) => {
            // Ensure unique names
            const uniquePlugins = plugins.map((p, i) => ({
              ...p,
              name: `enabled${p.name}${i}`,
            }));
            
            const registry = createRegistryWithPlugins(uniquePlugins);
            const config = createBaseConfig(template);
            const manager = new PluginManager(config, { registry });
            
            // Add all plugins
            for (const plugin of uniquePlugins) {
              await manager.add(plugin.name);
            }
            
            const installed = manager.getInstalled();
            
            // All added plugins should be in the installed list
            for (const plugin of uniquePlugins) {
              expect(installed).toContain(plugin.name);
            }
            
            // Length should match
            expect(installed.length).toBe(uniquePlugins.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('cannot add the same plugin twice', () => {
      fc.assert(
        fc.asyncProperty(
          simplePluginArb,
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          async (plugin, template) => {
            const registry = createRegistryWithPlugins([plugin]);
            const config = createBaseConfig(template);
            const manager = new PluginManager(config, { registry });
            
            // Add the plugin
            await manager.add(plugin.name);
            
            // Try to add again - should fail
            await expect(manager.add(plugin.name)).rejects.toThrow(PluginError);
            
            // Should still only be installed once
            const installed = manager.getInstalled();
            expect(installed.filter(n => n === plugin.name).length).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('cannot remove a plugin that is not installed', () => {
      fc.assert(
        fc.asyncProperty(
          simplePluginArb,
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          async (plugin, template) => {
            const registry = createRegistryWithPlugins([plugin]);
            const config = createBaseConfig(template);
            const manager = new PluginManager(config, { registry });
            
            // Try to remove without installing - should fail
            await expect(manager.remove(plugin.name)).rejects.toThrow(PluginError);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('template compatibility is enforced', () => {
      fc.assert(
        fc.asyncProperty(
          simplePluginArb,
          async (basePlugin) => {
            // Create a plugin that only supports 'nextjs'
            const plugin = {
              ...basePlugin,
              name: `compat${basePlugin.name}`,
              supportedTemplates: ['nextjs'] as FrameworkTemplate[],
            };
            
            const registry = createRegistryWithPlugins([plugin]);
            
            // Try to add to a tanstack project - should fail
            const config = createBaseConfig('tanstack');
            const manager = new PluginManager(config, { registry });
            
            await expect(manager.add(plugin.name)).rejects.toThrow(PluginError);
            
            // Try to add to a nextjs project - should succeed
            const nextjsConfig = createBaseConfig('nextjs');
            const nextjsManager = new PluginManager(nextjsConfig, { registry });
            
            await expect(manager.add(plugin.name)).rejects.toThrow(); // Still fails on tanstack manager
            const result = await nextjsManager.add(plugin.name);
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
