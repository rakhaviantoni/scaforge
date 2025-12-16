/**
 * Property-based tests for Environment Variable Utilities
 * 
 * **Feature: scaforge, Property 9: Environment Variable Documentation**
 * **Validates: Requirements 40.3**
 * 
 * Tests that environment variable management maintains consistency:
 * - Adding plugin env vars updates .env.example with all required variables
 * - Parsing and serializing .env files preserves content
 * - Plugin env vars can be retrieved after being added
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import type { EnvVarDefinition } from '../../plugin-system/types';
import {
  parseEnvFile,
  serializeEnvFile,
  updateEnvExample,
  removeEnvVars,
  getPluginEnvVars,
  EnvEntry,
} from '../env';

// Test directory for file operations
let testDir: string;

beforeEach(async () => {
  testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scaforge-env-test-'));
});

afterEach(async () => {
  if (testDir) {
    await fs.remove(testDir);
  }
});

// Arbitrary for generating valid environment variable names
// Must start with letter or underscore, contain only alphanumeric and underscore
const envVarNameArb = fc.stringOf(
  fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ_'.split('')),
  { minLength: 1, maxLength: 5 }
).chain(prefix =>
  fc.stringOf(
    fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'.split('')),
    { minLength: 0, maxLength: 20 }
  ).map(suffix => prefix + suffix)
).filter(s => /^[A-Z_][A-Z0-9_]*$/.test(s));

// Arbitrary for generating safe env var values (no newlines or special chars)
// Exclude whitespace-only values as they get trimmed during parsing (standard .env behavior)
const envVarValueArb = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-./: '.split('')),
  { minLength: 0, maxLength: 50 }
).map(s => s.trim()); // Normalize to trimmed values

// Arbitrary for generating safe descriptions (no newlines)
// Exclude whitespace-only descriptions as they get trimmed during parsing
const descriptionArb = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-.'.split('')),
  { minLength: 1, maxLength: 50 }
).filter(s => s.trim().length > 0); // Must have non-whitespace content

// Arbitrary for generating valid plugin names
const pluginNameArb = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-'.split('')),
  { minLength: 3, maxLength: 20 }
).filter(s => /^[a-z][a-z0-9-]*[a-z0-9]$/.test(s));


// Arbitrary for generating EnvVarDefinition
const envVarDefinitionArb: fc.Arbitrary<EnvVarDefinition> = fc.record({
  name: envVarNameArb,
  description: descriptionArb,
  required: fc.boolean(),
  default: fc.option(envVarValueArb, { nil: undefined }),
  secret: fc.option(fc.boolean(), { nil: undefined }),
});

// Arbitrary for generating EnvEntry
const envEntryArb: fc.Arbitrary<EnvEntry> = fc.record({
  name: envVarNameArb,
  value: envVarValueArb,
  comment: fc.option(descriptionArb, { nil: undefined }),
  plugin: fc.option(pluginNameArb, { nil: undefined }),
});

describe('Environment Variable Property Tests', () => {
  /**
   * **Feature: scaforge, Property 9: Environment Variable Documentation**
   * **Validates: Requirements 40.3**
   * 
   * Property: Parse/Serialize Round-Trip
   * For any list of env entries, serializing and parsing should preserve the entries.
   */
  it('parse/serialize round-trip preserves env entries', () => {
    fc.assert(
      fc.property(
        fc.array(envEntryArb, { minLength: 0, maxLength: 10 })
          // Ensure unique names
          .map(entries => {
            const seen = new Set<string>();
            return entries.filter(e => {
              if (seen.has(e.name)) return false;
              seen.add(e.name);
              return true;
            });
          }),
        (entries) => {
          const serialized = serializeEnvFile(entries);
          const parsed = parseEnvFile(serialized);
          
          // Should have same number of entries
          expect(parsed.length).toBe(entries.length);
          
          // Each entry should be preserved
          for (const original of entries) {
            const found = parsed.find(p => p.name === original.name);
            expect(found).toBeDefined();
            expect(found?.value).toBe(original.value);
            // Comments and plugins should be preserved
            if (original.comment) {
              expect(found?.comment).toBe(original.comment);
            }
            if (original.plugin) {
              expect(found?.plugin).toBe(original.plugin);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: scaforge, Property 9: Environment Variable Documentation**
   * **Validates: Requirements 40.3**
   * 
   * Property: Plugin Env Vars Are Added
   * For any plugin with env vars, after updateEnvExample, all vars should be present.
   */
  it('updateEnvExample adds all plugin env vars', async () => {
    await fc.assert(
      fc.asyncProperty(
        pluginNameArb,
        fc.array(envVarDefinitionArb, { minLength: 1, maxLength: 5 })
          // Ensure unique names
          .map(vars => {
            const seen = new Set<string>();
            return vars.filter(v => {
              if (seen.has(v.name)) return false;
              seen.add(v.name);
              return true;
            });
          }),
        async (pluginName, envVars) => {
          // Update env example
          await updateEnvExample(testDir, pluginName, envVars);
          
          // Read back the file
          const envPath = path.join(testDir, '.env.example');
          const content = await fs.readFile(envPath, 'utf-8');
          const entries = parseEnvFile(content);
          
          // All env vars should be present
          for (const envVar of envVars) {
            const found = entries.find(e => e.name === envVar.name);
            expect(found).toBeDefined();
            expect(found?.plugin).toBe(pluginName);
            
            // Default value should be set if provided
            if (envVar.default !== undefined) {
              expect(found?.value).toBe(envVar.default);
            }
          }
          
          // Clean up for next iteration
          await fs.remove(envPath);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: scaforge, Property 9: Environment Variable Documentation**
   * **Validates: Requirements 40.3**
   * 
   * Property: Plugin Env Vars Can Be Retrieved
   * After adding env vars, getPluginEnvVars should return them.
   */
  it('getPluginEnvVars returns added env vars', async () => {
    await fc.assert(
      fc.asyncProperty(
        pluginNameArb,
        fc.array(envVarDefinitionArb, { minLength: 1, maxLength: 5 })
          .map(vars => {
            const seen = new Set<string>();
            return vars.filter(v => {
              if (seen.has(v.name)) return false;
              seen.add(v.name);
              return true;
            });
          }),
        async (pluginName, envVars) => {
          // Add env vars
          await updateEnvExample(testDir, pluginName, envVars);
          
          // Retrieve them
          const retrieved = await getPluginEnvVars(testDir, pluginName);
          
          // Should have same count
          expect(retrieved.length).toBe(envVars.length);
          
          // All should be for this plugin
          for (const entry of retrieved) {
            expect(entry.plugin).toBe(pluginName);
          }
          
          // All original vars should be present
          for (const envVar of envVars) {
            const found = retrieved.find(e => e.name === envVar.name);
            expect(found).toBeDefined();
          }
          
          // Clean up
          await fs.remove(path.join(testDir, '.env.example'));
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * **Feature: scaforge, Property 9: Environment Variable Documentation**
   * **Validates: Requirements 40.3**
   * 
   * Property: Remove Env Vars Removes Only Plugin Vars
   * Removing env vars for a plugin should not affect other plugins' vars.
   */
  it('removeEnvVars removes only the specified plugin vars', async () => {
    await fc.assert(
      fc.asyncProperty(
        pluginNameArb,
        pluginNameArb.filter(n => n.length > 3), // Different plugin
        fc.array(envVarDefinitionArb, { minLength: 1, maxLength: 3 })
          .map(vars => {
            const seen = new Set<string>();
            return vars.filter(v => {
              if (seen.has(v.name)) return false;
              seen.add(v.name);
              return true;
            });
          }),
        fc.array(envVarDefinitionArb, { minLength: 1, maxLength: 3 })
          .map(vars => {
            const seen = new Set<string>();
            return vars.filter(v => {
              if (seen.has(v.name)) return false;
              seen.add(v.name);
              return true;
            });
          }),
        async (plugin1, plugin2, vars1, vars2) => {
          // Skip if plugins are the same
          if (plugin1 === plugin2) return;
          
          // Ensure no overlapping var names
          const names1 = new Set(vars1.map(v => v.name));
          const filteredVars2 = vars2.filter(v => !names1.has(v.name));
          if (filteredVars2.length === 0) return;
          
          // Add vars for both plugins
          await updateEnvExample(testDir, plugin1, vars1);
          await updateEnvExample(testDir, plugin2, filteredVars2);
          
          // Remove vars for plugin1
          await removeEnvVars(testDir, plugin1);
          
          // Plugin2 vars should still be present
          const remaining = await getPluginEnvVars(testDir, plugin2);
          expect(remaining.length).toBe(filteredVars2.length);
          
          // Plugin1 vars should be gone
          const plugin1Vars = await getPluginEnvVars(testDir, plugin1);
          expect(plugin1Vars.length).toBe(0);
          
          // Clean up
          await fs.remove(path.join(testDir, '.env.example'));
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: scaforge, Property 9: Environment Variable Documentation**
   * **Validates: Requirements 40.3**
   * 
   * Property: Add/Remove Round-Trip
   * Adding and then removing env vars should leave no trace of the plugin.
   */
  it('add/remove round-trip leaves no plugin vars', async () => {
    await fc.assert(
      fc.asyncProperty(
        pluginNameArb,
        fc.array(envVarDefinitionArb, { minLength: 1, maxLength: 5 })
          .map(vars => {
            const seen = new Set<string>();
            return vars.filter(v => {
              if (seen.has(v.name)) return false;
              seen.add(v.name);
              return true;
            });
          }),
        async (pluginName, envVars) => {
          // Add env vars
          await updateEnvExample(testDir, pluginName, envVars);
          
          // Verify they were added
          const added = await getPluginEnvVars(testDir, pluginName);
          expect(added.length).toBe(envVars.length);
          
          // Remove them
          const removed = await removeEnvVars(testDir, pluginName);
          expect(removed.length).toBe(envVars.length);
          
          // Verify they're gone
          const remaining = await getPluginEnvVars(testDir, pluginName);
          expect(remaining.length).toBe(0);
          
          // Clean up
          await fs.remove(path.join(testDir, '.env.example'));
        }
      ),
      { numRuns: 100 }
    );
  });
});
