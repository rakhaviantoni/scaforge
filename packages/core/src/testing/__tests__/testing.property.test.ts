/**
 * Property-based tests for Testing Utilities
 * 
 * **Feature: scaforge, Property 12: Test Utilities Inclusion**
 * **Validates: Requirements 45.1**
 * 
 * Tests that test utilities are correctly included when plugins define them:
 * - Plugins with test files have those files identified correctly
 * - Test utility detection works across all plugin categories
 * - Test files are properly categorized
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { PluginDefinition, PluginCategory, PluginFile } from '../../plugin-system/types';
import {
  createMockPlugin,
  createMockPluginFile,
  createMockPluginWithFiles,
} from '../mocks';
import {
  pluginHasTestUtilities,
  getPluginTestUtilityFiles,
  createPluginWithTestUtilities,
  createCategoryMockPlugin,
  CATEGORY_TEMPLATES,
} from '../plugin-test-utils';
import {
  simplePluginArb,
  pluginCategoryArb,
  pluginNameArb,
} from '../arbitraries';
import { ALL_PLUGIN_CATEGORIES } from '../helpers';

// Arbitrary for test file paths
const testFilePathArb = fc.oneof(
  fc.constant('src/__tests__/example.test.ts'),
  fc.constant('src/test/setup.ts'),
  fc.constant('src/components/__tests__/button.test.tsx'),
  fc.constant('src/lib/utils.spec.ts'),
  fc.constant('tests/integration.test.ts'),
  pluginNameArb.map(name => `src/__tests__/${name}.test.ts`),
  pluginNameArb.map(name => `src/test/mocks/${name}.ts`),
);

// Arbitrary for non-test file paths
const nonTestFilePathArb = fc.oneof(
  fc.constant('src/lib/utils.ts'),
  fc.constant('src/components/button.tsx'),
  fc.constant('src/index.ts'),
  fc.constant('prisma/schema.prisma'),
  fc.constant('src/middleware.ts'),
  pluginNameArb.map(name => `src/lib/${name}.ts`),
);

describe('Testing Utilities Property Tests', () => {
  /**
   * **Feature: scaforge, Property 12: Test Utilities Inclusion**
   * **Validates: Requirements 45.1**
   * 
   * Property: Plugins with test files are correctly identified
   * For any plugin with files in test directories or with test extensions,
   * pluginHasTestUtilities should return true.
   */
  describe('Property 12: Test Utilities Inclusion', () => {
    it('plugins with test files are identified as having test utilities', () => {
      fc.assert(
        fc.property(
          simplePluginArb,
          testFilePathArb,
          (basePlugin, testFilePath) => {
            // Create a plugin with a test file
            const testFile = createMockPluginFile(testFilePath, '// Test content');
            const plugin = createMockPluginWithFiles([testFile], {
              name: basePlugin.name,
              category: basePlugin.category,
            });
            
            // Should be identified as having test utilities
            expect(pluginHasTestUtilities(plugin)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('plugins without test files are identified as not having test utilities', () => {
      fc.assert(
        fc.property(
          simplePluginArb,
          fc.array(nonTestFilePathArb, { minLength: 1, maxLength: 5 }),
          (basePlugin, filePaths) => {
            // Create a plugin with only non-test files
            const files = filePaths.map(path => createMockPluginFile(path, '// Content'));
            const plugin = createMockPluginWithFiles(files, {
              name: basePlugin.name,
              category: basePlugin.category,
            });
            
            // Should NOT be identified as having test utilities
            expect(pluginHasTestUtilities(plugin)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('getPluginTestUtilityFiles returns only test files', () => {
      fc.assert(
        fc.property(
          simplePluginArb,
          fc.array(testFilePathArb, { minLength: 1, maxLength: 3 }),
          fc.array(nonTestFilePathArb, { minLength: 1, maxLength: 3 }),
          (basePlugin, testPaths, nonTestPaths) => {
            // Create a plugin with both test and non-test files
            const testFiles = testPaths.map(path => createMockPluginFile(path, '// Test'));
            const nonTestFiles = nonTestPaths.map(path => createMockPluginFile(path, '// Code'));
            const allFiles = [...testFiles, ...nonTestFiles];
            
            const plugin = createMockPluginWithFiles(allFiles, {
              name: basePlugin.name,
              category: basePlugin.category,
            });
            
            // Get test utility files
            const utilityFiles = getPluginTestUtilityFiles(plugin);
            
            // Should only contain test files
            expect(utilityFiles.length).toBe(testFiles.length);
            
            // All returned files should be test files
            for (const file of utilityFiles) {
              const isTestFile = 
                file.path.includes('/test/') ||
                file.path.includes('/__tests__/') ||
                file.path.endsWith('.test.ts') ||
                file.path.endsWith('.test.tsx') ||
                file.path.endsWith('.spec.ts') ||
                file.path.endsWith('.spec.tsx');
              expect(isTestFile).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('createPluginWithTestUtilities always includes test files', () => {
      fc.assert(
        fc.property(
          pluginCategoryArb,
          pluginNameArb,
          (category, name) => {
            // Create a plugin with test utilities
            const plugin = createPluginWithTestUtilities(category, name);
            
            // Should have test utilities
            expect(pluginHasTestUtilities(plugin)).toBe(true);
            
            // Should have at least one test file
            const testFiles = getPluginTestUtilityFiles(plugin);
            expect(testFiles.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('category mock plugins have consistent structure', () => {
      fc.assert(
        fc.property(
          pluginCategoryArb,
          (category) => {
            // Create a category mock plugin
            const plugin = createCategoryMockPlugin(category);
            
            // Should have the correct category
            expect(plugin.category).toBe(category);
            
            // Should have files defined in the template
            const template = CATEGORY_TEMPLATES[category];
            expect(plugin.files.length).toBe(template.defaultFiles.length);
            
            // Should have env vars defined in the template
            if (template.defaultEnvVars.length > 0) {
              expect(plugin.envVars?.length).toBe(template.defaultEnvVars.length);
            }
            
            // Should support the templates defined in the category template
            expect(plugin.supportedTemplates).toEqual(template.supportedTemplates);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('all plugin categories have templates defined', () => {
      // This is a simple property that verifies completeness
      for (const category of ALL_PLUGIN_CATEGORIES) {
        const template = CATEGORY_TEMPLATES[category];
        expect(template).toBeDefined();
        expect(template.category).toBe(category);
        expect(template.supportedTemplates.length).toBeGreaterThan(0);
      }
    });
  });

  /**
   * Additional properties for test utility helpers
   */
  describe('Test Utility Helper Properties', () => {
    it('mock plugins have valid structure', () => {
      fc.assert(
        fc.property(
          pluginNameArb,
          pluginCategoryArb,
          (name, category) => {
            const plugin = createMockPlugin({ name, category });
            
            // Should have required fields
            expect(plugin.name).toBe(name);
            expect(plugin.category).toBe(category);
            expect(plugin.version).toBeDefined();
            expect(plugin.displayName).toBeDefined();
            expect(plugin.description).toBeDefined();
            expect(plugin.supportedTemplates.length).toBeGreaterThan(0);
            expect(plugin.packages).toBeDefined();
            expect(plugin.files).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('mock plugin files have valid structure', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.boolean(),
          (path, template, overwrite) => {
            const file = createMockPluginFile(path, template, overwrite);
            
            expect(file.path).toBe(path);
            expect(file.template).toBe(template);
            expect(file.overwrite).toBe(overwrite);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('empty plugins have no test utilities', () => {
      fc.assert(
        fc.property(
          simplePluginArb,
          (plugin) => {
            // Simple plugins have no files by default
            expect(pluginHasTestUtilities(plugin)).toBe(false);
            expect(getPluginTestUtilityFiles(plugin)).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
