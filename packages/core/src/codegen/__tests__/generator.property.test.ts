/**
 * Property-based tests for Code Generator
 * 
 * **Feature: scaforge, Property 5: Plugin File Generation Completeness**
 * **Validates: Requirements 3.2, 42.1**
 * 
 * For any plugin installation, all files defined in the plugin's `files` array
 * (that pass their conditions) SHALL be generated in the project.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  generateFiles,
  getFilesToGenerate,
  evaluateCondition,
  type GeneratorContext,
} from '../generator';
import type {
  PluginDefinition,
  PluginFile,
  FileCondition,
  PluginCategory,
  FrameworkTemplate,
} from '../../plugin-system/types';
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

// Arbitrary for generating valid file paths (safe characters only)
const safeFileNameArb = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-_'.split('')),
  { minLength: 1, maxLength: 20 }
).filter(s => /^[a-z][a-z0-9_-]*$/.test(s));

const filePathArb = fc.tuple(
  fc.constantFrom('src', 'lib', 'utils', 'components'),
  safeFileNameArb,
  fc.constantFrom('.ts', '.tsx', '.js', '.json')
).map(([dir, name, ext]) => `${dir}/${name}${ext}`);

// Arbitrary for generating simple template content (valid Handlebars - no unmatched braces)
const templateContentArb = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789 \n'.split('')),
  { minLength: 1, maxLength: 200 }
);

// Arbitrary for generating plugin files without conditions
const simplePluginFileArb: fc.Arbitrary<PluginFile> = fc.record({
  path: filePathArb,
  template: templateContentArb,
  overwrite: fc.boolean(),
});

// Arbitrary for generating plugin names
const pluginNameArb = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
  { minLength: 3, maxLength: 15 }
).filter(s => /^[a-z][a-z0-9]*$/.test(s));


// Arbitrary for generating plugin definitions with files
const pluginWithFilesArb: fc.Arbitrary<PluginDefinition> = fc.record({
  name: pluginNameArb,
  displayName: fc.string({ minLength: 1, maxLength: 50 }),
  category: fc.constantFrom(...PLUGIN_CATEGORIES),
  description: fc.string({ minLength: 1, maxLength: 200 }),
  version: fc.tuple(fc.nat(10), fc.nat(20), fc.nat(100)).map(([a, b, c]) => `${a}.${b}.${c}`),
  supportedTemplates: fc.constant(FRAMEWORK_TEMPLATES),
  packages: fc.constant({ dependencies: {}, devDependencies: {} }),
  files: fc.array(simplePluginFileArb, { minLength: 1, maxLength: 5 }),
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

// Temp directory for tests
let tempDir: string;

describe('Code Generator Property Tests', () => {
  beforeEach(async () => {
    // Create a unique temp directory for each test
    tempDir = path.join(os.tmpdir(), `scaforge-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    // Clean up temp directory
    if (tempDir && await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  });

  /**
   * **Feature: scaforge, Property 5: Plugin File Generation Completeness**
   * **Validates: Requirements 3.2, 42.1**
   * 
   * For any plugin installation, all files defined in the plugin's `files` array
   * (that pass their conditions) SHALL be generated in the project.
   */
  describe('Property 5: Plugin File Generation Completeness', () => {
    it('all unconditional files are generated', async () => {
      let iterationCount = 0;
      await fc.assert(
        fc.asyncProperty(
          pluginWithFilesArb,
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          async (plugin, template) => {
            // Create unique subdirectory for each iteration
            const iterDir = path.join(tempDir, `iter${iterationCount++}`);
            await fs.ensureDir(iterDir);
            
            // Ensure unique file paths
            const uniqueFiles = plugin.files.map((f, i) => ({
              ...f,
              path: `src/gen${i}_${f.path.replace(/\//g, '_')}`,
            }));
            const uniquePlugin = { ...plugin, files: uniqueFiles };
            
            const config = createBaseConfig(template);
            
            // Generate files
            const result = await generateFiles(iterDir, uniquePlugin, config);
            
            // All files should be generated (no conditions)
            expect(result.generatedFiles.length).toBe(uniqueFiles.length);
            expect(result.errors.length).toBe(0);
            
            // Verify each file exists
            for (const file of uniqueFiles) {
              const filePath = path.join(iterDir, file.path);
              const exists = await fs.pathExists(filePath);
              expect(exists).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('getFilesToGenerate returns all files that would be generated', async () => {
      let iterationCount = 0;
      await fc.assert(
        fc.asyncProperty(
          pluginWithFilesArb,
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          async (plugin, template) => {
            // Create unique subdirectory for each iteration
            const iterDir = path.join(tempDir, `iter${iterationCount++}`);
            await fs.ensureDir(iterDir);
            
            // Ensure unique file paths
            const uniqueFiles = plugin.files.map((f, i) => ({
              ...f,
              path: `src/predict${i}_${f.path.replace(/\//g, '_')}`,
            }));
            const uniquePlugin = { ...plugin, files: uniqueFiles };
            
            const config = createBaseConfig(template);
            
            // Get predicted files
            const predictedFiles = getFilesToGenerate(uniquePlugin, config);
            
            // Generate files
            const result = await generateFiles(iterDir, uniquePlugin, config);
            
            // Predicted files should match generated files
            expect(predictedFiles.sort()).toEqual(result.generatedFiles.sort());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('files with failing conditions are skipped', async () => {
      let iterationCount = 0;
      await fc.assert(
        fc.asyncProperty(
          pluginWithFilesArb,
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          async (plugin, template) => {
            // Create unique subdirectory for each iteration
            const iterDir = path.join(tempDir, `iter${iterationCount++}`);
            await fs.ensureDir(iterDir);
            
            // Add a condition that will fail (requires a plugin that's not installed)
            const filesWithCondition = plugin.files.map((f, i) => ({
              ...f,
              path: `src/cond${i}_${f.path.replace(/\//g, '_')}`,
              condition: { hasPlugin: 'nonexistent-plugin-xyz' } as FileCondition,
            }));
            const condPlugin = { ...plugin, files: filesWithCondition };
            
            const config = createBaseConfig(template);
            
            // Generate files
            const result = await generateFiles(iterDir, condPlugin, config);
            
            // All files should be skipped
            expect(result.generatedFiles.length).toBe(0);
            expect(result.skippedFiles.length).toBe(filesWithCondition.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('files with passing conditions are generated', async () => {
      let iterationCount = 0;
      await fc.assert(
        fc.asyncProperty(
          pluginWithFilesArb,
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          async (plugin, template) => {
            // Create unique subdirectory for each iteration
            const iterDir = path.join(tempDir, `iter${iterationCount++}`);
            await fs.ensureDir(iterDir);
            
            // Add a condition that will pass (template matches)
            const filesWithCondition = plugin.files.map((f, i) => ({
              ...f,
              path: `src/pass${i}_${f.path.replace(/\//g, '_')}`,
              condition: { template } as FileCondition,
            }));
            const condPlugin = { ...plugin, files: filesWithCondition };
            
            const config = createBaseConfig(template);
            
            // Generate files
            const result = await generateFiles(iterDir, condPlugin, config);
            
            // All files should be generated
            expect(result.generatedFiles.length).toBe(filesWithCondition.length);
            expect(result.skippedFiles.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('existing files are skipped unless overwrite is true', async () => {
      let iterationCount = 0;
      await fc.assert(
        fc.asyncProperty(
          pluginWithFilesArb,
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          async (plugin, template) => {
            // Create unique subdirectory for each iteration
            const iterDir = path.join(tempDir, `iter${iterationCount++}`);
            await fs.ensureDir(iterDir);
            
            // Create files with overwrite: false
            const filesNoOverwrite = plugin.files.map((f, i) => ({
              ...f,
              path: `src/exist${i}_${f.path.replace(/\//g, '_')}`,
              overwrite: false,
            }));
            const noOverwritePlugin = { ...plugin, files: filesNoOverwrite };
            
            const config = createBaseConfig(template);
            
            // Pre-create the files
            for (const file of filesNoOverwrite) {
              const filePath = path.join(iterDir, file.path);
              await fs.ensureDir(path.dirname(filePath));
              await fs.writeFile(filePath, 'original content');
            }
            
            // Generate files
            const result = await generateFiles(iterDir, noOverwritePlugin, config);
            
            // All files should be skipped
            expect(result.generatedFiles.length).toBe(0);
            expect(result.skippedFiles.length).toBe(filesNoOverwrite.length);
            
            // Original content should be preserved
            for (const file of filesNoOverwrite) {
              const filePath = path.join(iterDir, file.path);
              const content = await fs.readFile(filePath, 'utf-8');
              expect(content).toBe('original content');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('existing files are overwritten when overwrite is true', async () => {
      let iterationCount = 0;
      await fc.assert(
        fc.asyncProperty(
          pluginWithFilesArb,
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          async (plugin, template) => {
            // Create unique subdirectory for each iteration
            const iterDir = path.join(tempDir, `iter${iterationCount++}`);
            await fs.ensureDir(iterDir);
            
            // Create files with overwrite: true
            const filesOverwrite = plugin.files.map((f, i) => ({
              ...f,
              path: `src/over${i}_${f.path.replace(/\//g, '_')}`,
              template: `new content ${i}`,
              overwrite: true,
            }));
            const overwritePlugin = { ...plugin, files: filesOverwrite };
            
            const config = createBaseConfig(template);
            
            // Pre-create the files
            for (const file of filesOverwrite) {
              const filePath = path.join(iterDir, file.path);
              await fs.ensureDir(path.dirname(filePath));
              await fs.writeFile(filePath, 'original content');
            }
            
            // Generate files
            const result = await generateFiles(iterDir, overwritePlugin, config);
            
            // All files should be generated (overwritten)
            expect(result.generatedFiles.length).toBe(filesOverwrite.length);
            
            // Content should be updated
            for (let i = 0; i < filesOverwrite.length; i++) {
              const file = filesOverwrite[i]!;
              const filePath = path.join(iterDir, file.path);
              const content = await fs.readFile(filePath, 'utf-8');
              expect(content).toBe(`new content ${i}`);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Additional property tests for condition evaluation
   */
  describe('Condition Evaluation Properties', () => {
    it('hasPlugin condition correctly filters based on installed plugins', () => {
      fc.assert(
        fc.property(
          pluginNameArb,
          fc.array(pluginNameArb, { minLength: 0, maxLength: 5 }),
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          (targetPlugin, installedPlugins, template) => {
            const context: GeneratorContext = {
              plugin: {
                name: 'test',
                displayName: 'Test',
                category: 'api',
                description: 'Test plugin',
                version: '1.0.0',
                supportedTemplates: FRAMEWORK_TEMPLATES,
                packages: {},
                files: [],
              },
              config: createBaseConfig(template),
              options: {},
              template,
              installedPlugins,
            };

            const condition: FileCondition = { hasPlugin: targetPlugin };
            const result = evaluateCondition(condition, context);

            // Result should be true only if targetPlugin is in installedPlugins
            expect(result).toBe(installedPlugins.includes(targetPlugin));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('notHasPlugin condition correctly filters based on installed plugins', () => {
      fc.assert(
        fc.property(
          pluginNameArb,
          fc.array(pluginNameArb, { minLength: 0, maxLength: 5 }),
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          (targetPlugin, installedPlugins, template) => {
            const context: GeneratorContext = {
              plugin: {
                name: 'test',
                displayName: 'Test',
                category: 'api',
                description: 'Test plugin',
                version: '1.0.0',
                supportedTemplates: FRAMEWORK_TEMPLATES,
                packages: {},
                files: [],
              },
              config: createBaseConfig(template),
              options: {},
              template,
              installedPlugins,
            };

            const condition: FileCondition = { notHasPlugin: targetPlugin };
            const result = evaluateCondition(condition, context);

            // Result should be true only if targetPlugin is NOT in installedPlugins
            expect(result).toBe(!installedPlugins.includes(targetPlugin));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('template condition correctly filters based on current template', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          (conditionTemplate, currentTemplate) => {
            const context: GeneratorContext = {
              plugin: {
                name: 'test',
                displayName: 'Test',
                category: 'api',
                description: 'Test plugin',
                version: '1.0.0',
                supportedTemplates: FRAMEWORK_TEMPLATES,
                packages: {},
                files: [],
              },
              config: createBaseConfig(currentTemplate),
              options: {},
              template: currentTemplate,
              installedPlugins: [],
            };

            const condition: FileCondition = { template: conditionTemplate };
            const result = evaluateCondition(condition, context);

            // Result should be true only if templates match
            expect(result).toBe(conditionTemplate === currentTemplate);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('combined conditions require all to pass', () => {
      fc.assert(
        fc.property(
          pluginNameArb,
          fc.array(pluginNameArb, { minLength: 0, maxLength: 5 }),
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          (requiredPlugin, installedPlugins, conditionTemplate, currentTemplate) => {
            const context: GeneratorContext = {
              plugin: {
                name: 'test',
                displayName: 'Test',
                category: 'api',
                description: 'Test plugin',
                version: '1.0.0',
                supportedTemplates: FRAMEWORK_TEMPLATES,
                packages: {},
                files: [],
              },
              config: createBaseConfig(currentTemplate),
              options: {},
              template: currentTemplate,
              installedPlugins,
            };

            const condition: FileCondition = {
              hasPlugin: requiredPlugin,
              template: conditionTemplate,
            };
            const result = evaluateCondition(condition, context);

            // Both conditions must pass
            const hasPluginPasses = installedPlugins.includes(requiredPlugin);
            const templatePasses = conditionTemplate === currentTemplate;
            expect(result).toBe(hasPluginPasses && templatePasses);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Dry run property tests
   */
  describe('Dry Run Properties', () => {
    it('dry run does not create any files', async () => {
      let iterationCount = 0;
      await fc.assert(
        fc.asyncProperty(
          pluginWithFilesArb,
          fc.constantFrom(...FRAMEWORK_TEMPLATES),
          async (plugin, template) => {
            // Create unique subdirectory for each iteration
            const iterDir = path.join(tempDir, `iter${iterationCount++}`);
            await fs.ensureDir(iterDir);
            
            // Ensure unique file paths
            const uniqueFiles = plugin.files.map((f, i) => ({
              ...f,
              path: `src/dry${i}_${f.path.replace(/\//g, '_')}`,
            }));
            const uniquePlugin = { ...plugin, files: uniqueFiles };
            
            const config = createBaseConfig(template);
            
            // Generate files with dry run
            const result = await generateFiles(iterDir, uniquePlugin, config, {}, { dryRun: true });
            
            // Files should be reported as generated
            expect(result.generatedFiles.length).toBe(uniqueFiles.length);
            
            // But no files should actually exist
            for (const file of uniqueFiles) {
              const filePath = path.join(iterDir, file.path);
              const exists = await fs.pathExists(filePath);
              expect(exists).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
