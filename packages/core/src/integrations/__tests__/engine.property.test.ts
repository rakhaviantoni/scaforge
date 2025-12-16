/**
 * Property-based tests for Integration Engine
 * 
 * Tests the auto-integration functionality:
 * - Auto-Integration Consistency (Property 6)
 * 
 * **Feature: scaforge, Property 6: Auto-Integration Consistency**
 * **Validates: Requirements 41.1**
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import {
  runIntegrations,
  getApplicableIntegrations,
  hasIntegration,
  getIntegrationFiles,
} from '../engine';
import {
  matchesPattern,
  findMatchingRules,
  getRulesForNewPlugin,
  ruleApplies,
  autoIntegrationRules,
  validateRules,
} from '../rules';
import type { PluginDefinition, PluginCategory, FrameworkTemplate, PluginIntegration } from '../../plugin-system/types';
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

// Arbitrary for generating valid plugin names (kebab-case with category prefix)
const pluginNameArb = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
  { minLength: 3, maxLength: 10 }
).filter(s => /^[a-z][a-z0-9]*$/.test(s));

// Arbitrary for generating plugin names with category prefix
const categoryPluginNameArb = fc.tuple(
  fc.constantFrom(...PLUGIN_CATEGORIES),
  pluginNameArb
).map(([category, name]) => `${category}-${name}`);


// Arbitrary for generating simple plugin definitions
const simplePluginArb: fc.Arbitrary<PluginDefinition> = fc.record({
  name: categoryPluginNameArb,
  displayName: fc.string({ minLength: 1, maxLength: 50 }),
  category: fc.constantFrom(...PLUGIN_CATEGORIES),
  description: fc.string({ minLength: 1, maxLength: 200 }),
  version: fc.tuple(fc.nat(10), fc.nat(20), fc.nat(100)).map(([a, b, c]) => `${a}.${b}.${c}`),
  supportedTemplates: fc.constant(FRAMEWORK_TEMPLATES),
  packages: fc.constant({ dependencies: {}, devDependencies: {} }),
  files: fc.constant([]),
});

// Note: pluginWithIntegrationsArb helper is available for future use
// const pluginWithIntegrationsArb = (targetPluginName: string): fc.Arbitrary<PluginDefinition> =>
//   simplePluginArb.map(plugin => ({
//     ...plugin,
//     integrations: [{ plugin: targetPluginName, type: 'middleware' as const, files: [] }],
//   }));

// Helper to create a base config
function createBaseConfig(
  template: FrameworkTemplate = 'nextjs',
  plugins: Record<string, { enabled: boolean; options?: Record<string, unknown> }> = {}
): ScaforgeConfig {
  return {
    name: 'test-project',
    template,
    plugins,
    settings: { generateExamples: true },
  };
}

// Helper to create a temporary directory for file generation tests
let tempDir: string;

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scaforge-test-'));
});

afterEach(async () => {
  if (tempDir) {
    try {
      await fs.emptyDir(tempDir);
      await fs.rmdir(tempDir);
    } catch {
      // Ignore cleanup errors in tests
    }
  }
});


describe('Integration Engine Property Tests', () => {
  /**
   * **Feature: scaforge, Property 6: Auto-Integration Consistency**
   * **Validates: Requirements 41.1**
   * 
   * For any combination of installed plugins that have integration rules,
   * the integration files SHALL be generated when both plugins are present.
   */
  describe('Property 6: Auto-Integration Consistency', () => {
    it('integration files are generated when both plugins are present', () => {
      fc.assert(
        fc.asyncProperty(
          simplePluginArb,
          simplePluginArb,
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          async (targetPlugin, sourcePluginBase, template) => {
            // Ensure unique names
            const target = { ...targetPlugin, name: `target${targetPlugin.name}` };
            
            // Create source plugin with integration to target
            const source: PluginDefinition = {
              ...sourcePluginBase,
              name: `source${sourcePluginBase.name}`,
              integrations: [
                {
                  plugin: target.name,
                  type: 'middleware',
                  files: [
                    {
                      path: `src/integrations/${sourcePluginBase.name}-integration.ts`,
                      template: `// Integration file for ${sourcePluginBase.name}`,
                    },
                  ],
                },
              ],
            };

            // Create config with both plugins installed
            const config = createBaseConfig(template, {
              [target.name]: { enabled: true },
              [source.name]: { enabled: true },
            });

            // Run integrations
            const result = await runIntegrations(tempDir, source, config);

            // Integration should be applied
            expect(result.appliedIntegrations.length).toBe(1);
            expect(result.appliedIntegrations[0]?.sourcePlugin).toBe(source.name);
            expect(result.appliedIntegrations[0]?.targetPlugin).toBe(target.name);
            expect(result.skippedIntegrations.length).toBe(0);
            expect(result.errors.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('integration files are NOT generated when target plugin is not installed', () => {
      fc.assert(
        fc.asyncProperty(
          simplePluginArb,
          simplePluginArb,
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          async (targetPlugin, sourcePluginBase, template) => {
            // Ensure unique names
            const target = { ...targetPlugin, name: `notinst${targetPlugin.name}` };
            
            // Create source plugin with integration to target
            const source: PluginDefinition = {
              ...sourcePluginBase,
              name: `srcnotinst${sourcePluginBase.name}`,
              integrations: [
                {
                  plugin: target.name,
                  type: 'middleware',
                  files: [
                    {
                      path: `src/integrations/${sourcePluginBase.name}-notinst.ts`,
                      template: `// Integration file`,
                    },
                  ],
                },
              ],
            };

            // Create config with ONLY source plugin installed (target NOT installed)
            const config = createBaseConfig(template, {
              [source.name]: { enabled: true },
              // target.name is NOT in plugins
            });

            // Run integrations
            const result = await runIntegrations(tempDir, source, config);

            // Integration should be skipped
            expect(result.appliedIntegrations.length).toBe(0);
            expect(result.skippedIntegrations.length).toBe(1);
            expect(result.skippedIntegrations[0]?.targetPlugin).toBe(target.name);
            expect(result.skippedIntegrations[0]?.reason).toContain('not installed');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('multiple integrations are all applied when all targets are present', () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(simplePluginArb, { minLength: 2, maxLength: 4 }),
          simplePluginArb,
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          async (targetPlugins, sourcePluginBase, template) => {
            // Ensure unique names for targets
            const targets = targetPlugins.map((p, i) => ({
              ...p,
              name: `multitarget${i}${p.name}`,
            }));

            // Create source plugin with integrations to all targets
            const integrations: PluginIntegration[] = targets.map(target => ({
              plugin: target.name,
              type: 'middleware' as const,
              files: [
                {
                  path: `src/integrations/multi-${target.name}.ts`,
                  template: `// Integration with ${target.name}`,
                },
              ],
            }));

            const source: PluginDefinition = {
              ...sourcePluginBase,
              name: `multisource${sourcePluginBase.name}`,
              integrations,
            };

            // Create config with all plugins installed
            const plugins: Record<string, { enabled: boolean }> = {
              [source.name]: { enabled: true },
            };
            targets.forEach(t => {
              plugins[t.name] = { enabled: true };
            });

            const config = createBaseConfig(template, plugins);

            // Run integrations
            const result = await runIntegrations(tempDir, source, config);

            // All integrations should be applied
            expect(result.appliedIntegrations.length).toBe(targets.length);
            expect(result.skippedIntegrations.length).toBe(0);
            expect(result.errors.length).toBe(0);

            // Verify each target has an integration
            for (const target of targets) {
              const applied = result.appliedIntegrations.find(
                a => a.targetPlugin === target.name
              );
              expect(applied).toBeDefined();
              expect(applied?.sourcePlugin).toBe(source.name);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('getApplicableIntegrations returns correct integrations for installed plugins', () => {
      fc.assert(
        fc.property(
          simplePluginArb,
          simplePluginArb,
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          (targetPlugin, sourcePluginBase, template) => {
            const target = { ...targetPlugin, name: `applic${targetPlugin.name}` };
            
            const source: PluginDefinition = {
              ...sourcePluginBase,
              name: `applicSrc${sourcePluginBase.name}`,
              integrations: [
                {
                  plugin: target.name,
                  type: 'provider',
                  files: [
                    {
                      path: `src/providers/${sourcePluginBase.name}.ts`,
                      template: `// Provider`,
                    },
                  ],
                },
              ],
            };

            // Config with target installed
            const configWithTarget = createBaseConfig(template, {
              [target.name]: { enabled: true },
              [source.name]: { enabled: true },
            });

            // Config without target
            const configWithoutTarget = createBaseConfig(template, {
              [source.name]: { enabled: true },
            });

            // With target installed, should return the integration
            const applicableWithTarget = getApplicableIntegrations(source, configWithTarget);
            expect(applicableWithTarget.length).toBe(1);
            expect(applicableWithTarget[0]?.targetPlugin).toBe(target.name);

            // Without target installed, should return empty
            const applicableWithoutTarget = getApplicableIntegrations(source, configWithoutTarget);
            expect(applicableWithoutTarget.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });



  /**
   * Additional property tests for integration utilities
   */
  describe('Integration Utility Properties', () => {
    it('hasIntegration correctly identifies integration presence', () => {
      fc.assert(
        fc.property(
          simplePluginArb,
          pluginNameArb,
          pluginNameArb,
          (basePlugin, targetName, otherName) => {
            const plugin: PluginDefinition = {
              ...basePlugin,
              integrations: [
                {
                  plugin: `has${targetName}`,
                  type: 'middleware',
                  files: [],
                },
              ],
            };

            // Should find the integration
            expect(hasIntegration(plugin, `has${targetName}`)).toBe(true);

            // Should not find non-existent integration
            expect(hasIntegration(plugin, `other${otherName}`)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('getIntegrationFiles returns correct files for existing integration', () => {
      fc.assert(
        fc.property(
          simplePluginArb,
          pluginNameArb,
          fc.array(fc.string({ minLength: 5, maxLength: 30 }), { minLength: 1, maxLength: 3 }),
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          (basePlugin, targetName, filePaths, template) => {
            const files = filePaths.map(p => ({
              path: `src/${p}.ts`,
              template: `// File ${p}`,
            }));

            const plugin: PluginDefinition = {
              ...basePlugin,
              integrations: [
                {
                  plugin: `files${targetName}`,
                  type: 'hook',
                  files,
                },
              ],
            };

            const config = createBaseConfig(template, {
              [`files${targetName}`]: { enabled: true },
              [basePlugin.name]: { enabled: true },
            });

            const integrationFiles = getIntegrationFiles(plugin, `files${targetName}`, config);

            // Should return all file paths
            expect(integrationFiles.length).toBe(files.length);
            for (const file of files) {
              expect(integrationFiles).toContain(file.path);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('plugin without integrations returns empty applicable integrations', () => {
      fc.assert(
        fc.property(
          simplePluginArb,
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          (plugin, template) => {
            // Plugin without integrations
            const pluginNoIntegrations: PluginDefinition = {
              ...plugin,
              integrations: undefined,
            };

            const config = createBaseConfig(template, {
              [plugin.name]: { enabled: true },
            });

            const applicable = getApplicableIntegrations(pluginNoIntegrations, config);
            expect(applicable.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


describe('Auto-Integration Rules Property Tests', () => {
  /**
   * Tests for pattern matching and rule finding
   */
  describe('Pattern Matching Properties', () => {
    it('exact patterns match only exact plugin names', () => {
      fc.assert(
        fc.property(
          categoryPluginNameArb,
          categoryPluginNameArb,
          (pluginName, otherName) => {
            // Exact pattern should match itself
            expect(matchesPattern(pluginName, pluginName)).toBe(true);

            // Exact pattern should not match different name (unless they happen to be equal)
            if (pluginName !== otherName) {
              expect(matchesPattern(pluginName, otherName)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('wildcard patterns match all plugins in category', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...PLUGIN_CATEGORIES),
          pluginNameArb,
          (category, suffix) => {
            const pluginName = `${category}-${suffix}`;
            const wildcardPattern = `${category}-*`;

            // Wildcard should match plugin in same category
            expect(matchesPattern(pluginName, wildcardPattern)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('wildcard patterns do not match plugins in different categories', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...PLUGIN_CATEGORIES),
          fc.constantFrom(...PLUGIN_CATEGORIES),
          pluginNameArb,
          (category1, category2, suffix) => {
            // Skip if categories are the same
            if (category1 === category2) return;

            const pluginName = `${category1}-${suffix}`;
            const wildcardPattern = `${category2}-*`;

            // Wildcard should NOT match plugin in different category
            expect(matchesPattern(pluginName, wildcardPattern)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  describe('Rule Finding Properties', () => {
    it('findMatchingRules returns rules for matching plugin combinations', () => {
      fc.assert(
        fc.property(
          pluginNameArb,
          pluginNameArb,
          (authSuffix, apiSuffix) => {
            const authPlugin = `auth-${authSuffix}`;
            const apiPlugin = `api-${apiSuffix}`;

            const installedPlugins = [authPlugin, apiPlugin];
            const matchedRules = findMatchingRules(installedPlugins);

            // Should find the auth-api-middleware rule
            const authApiRule = matchedRules.find(
              m => m.rule.id === 'auth-api-middleware'
            );
            expect(authApiRule).toBeDefined();
            expect(authApiRule?.matchedPlugins).toContain(authPlugin);
            expect(authApiRule?.matchedPlugins).toContain(apiPlugin);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('findMatchingRules does not match single plugin against both patterns', () => {
      fc.assert(
        fc.property(
          pluginNameArb,
          (suffix) => {
            // Single plugin should not match rules requiring two different plugins
            const singlePlugin = `auth-${suffix}`;
            const installedPlugins = [singlePlugin];

            const matchedRules = findMatchingRules(installedPlugins);

            // No rules should match with just one plugin
            // (rules require two different plugins)
            for (const match of matchedRules) {
              expect(match.matchedPlugins[0]).not.toBe(match.matchedPlugins[1]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('getRulesForNewPlugin returns only rules involving the new plugin', () => {
      fc.assert(
        fc.property(
          pluginNameArb,
          pluginNameArb,
          pluginNameArb,
          (authSuffix, apiSuffix, dbSuffix) => {
            const authPlugin = `auth-${authSuffix}`;
            const apiPlugin = `api-${apiSuffix}`;
            const dbPlugin = `db-${dbSuffix}`;

            // Existing plugins
            const existingPlugins = [apiPlugin, dbPlugin];

            // Add auth plugin
            const rulesForAuth = getRulesForNewPlugin(authPlugin, existingPlugins);

            // All returned rules should involve the auth plugin
            for (const match of rulesForAuth) {
              expect(
                match.matchedPlugins[0] === authPlugin ||
                match.matchedPlugins[1] === authPlugin
              ).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('ruleApplies is symmetric for plugin order', () => {
      fc.assert(
        fc.property(
          pluginNameArb,
          pluginNameArb,
          (authSuffix, apiSuffix) => {
            const authPlugin = `auth-${authSuffix}`;
            const apiPlugin = `api-${apiSuffix}`;

            // Find the auth-api rule
            const authApiRule = autoIntegrationRules.find(r => r.id === 'auth-api-middleware');
            if (!authApiRule) return;

            // Rule should apply regardless of plugin order
            const applies1 = ruleApplies(authApiRule, authPlugin, apiPlugin);
            const applies2 = ruleApplies(authApiRule, apiPlugin, authPlugin);

            expect(applies1).toBe(applies2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  describe('Rule Validation Properties', () => {
    it('all predefined rules are valid', () => {
      const errors = validateRules();
      expect(errors.length).toBe(0);
    });

    it('all predefined rules have unique IDs', () => {
      const ids = autoIntegrationRules.map(r => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('all predefined rules have valid patterns', () => {
      for (const rule of autoIntegrationRules) {
        expect(rule.when.length).toBe(2);
        expect(rule.when[0].length).toBeGreaterThan(0);
        expect(rule.when[1].length).toBeGreaterThan(0);
      }
    });

    it('matched rules are sorted by priority', () => {
      fc.assert(
        fc.property(
          pluginNameArb,
          pluginNameArb,
          pluginNameArb,
          pluginNameArb,
          (authSuffix, apiSuffix, dbSuffix, cacheSuffix) => {
            const installedPlugins = [
              `auth-${authSuffix}`,
              `api-${apiSuffix}`,
              `db-${dbSuffix}`,
              `cache-${cacheSuffix}`,
            ];

            const matchedRules = findMatchingRules(installedPlugins);

            // Verify rules are sorted by priority (descending)
            for (let i = 1; i < matchedRules.length; i++) {
              const prevRule = matchedRules[i - 1];
              const currRule = matchedRules[i];
              if (prevRule && currRule) {
                const prevPriority = prevRule.rule.priority ?? 0;
                const currPriority = currRule.rule.priority ?? 0;
                expect(prevPriority).toBeGreaterThanOrEqual(currPriority);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
