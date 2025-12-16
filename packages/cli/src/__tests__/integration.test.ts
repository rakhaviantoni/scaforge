/**
 * Integration Tests
 * Tests the full workflow: init → add → remove → update
 * 
 * Requirements: 2.1, 2.3, 2.4, 43.1
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PluginManager, PluginRegistry } from '@scaforge/core';
import type { ScaforgeConfig, PluginDefinition } from '@scaforge/core';
import { createDefaultConfig } from '@scaforge/core';
import { z } from 'zod';

/**
 * Sample plugins for integration testing
 */
const createTestPlugins = (): PluginDefinition[] => [
  {
    name: 'api-trpc',
    displayName: 'tRPC',
    category: 'api',
    description: 'End-to-end typesafe APIs',
    version: '1.0.0',
    supportedTemplates: ['nextjs', 'tanstack', 'nuxt', 'hydrogen'],
    packages: {
      dependencies: {
        '@trpc/server': '^11.0.0',
        '@trpc/client': '^11.0.0',
      },
    },
    files: [
      {
        path: 'src/server/trpc/index.ts',
        template: 'export const trpc = {};',
      },
    ],
    postInstall: 'tRPC has been configured!',
  },
  {
    name: 'db-prisma',
    displayName: 'Prisma',
    category: 'database',
    description: 'Type-safe database ORM',
    version: '1.0.0',
    supportedTemplates: ['nextjs', 'tanstack', 'nuxt', 'hydrogen'],
    packages: {
      dependencies: {
        prisma: '^5.0.0',
        '@prisma/client': '^5.0.0',
      },
    },
    configSchema: z.object({
      provider: z.enum(['postgresql', 'mysql', 'sqlite']).default('postgresql'),
    }),
    files: [
      {
        path: 'prisma/schema.prisma',
        template: 'datasource db { provider = "{{options.provider}}" }',
      },
    ],
  },
  {
    name: 'auth-authjs',
    displayName: 'Auth.js',
    category: 'auth',
    description: 'Authentication for the web',
    version: '1.0.0',
    supportedTemplates: ['nextjs', 'tanstack'],
    dependencies: ['db-prisma'], // Depends on database
    packages: {
      dependencies: {
        'next-auth': '^5.0.0',
      },
    },
    files: [
      {
        path: 'src/lib/auth.ts',
        template: 'export const auth = {};',
      },
    ],
  },
  {
    name: 'api-apollo',
    displayName: 'Apollo GraphQL',
    category: 'api',
    description: 'GraphQL with Apollo',
    version: '1.0.0',
    supportedTemplates: ['nextjs', 'tanstack', 'nuxt'],
    conflicts: ['api-trpc'], // Conflicts with tRPC
    packages: {
      dependencies: {
        '@apollo/server': '^4.0.0',
      },
    },
    files: [],
  },
];

describe('Integration Tests: Full Workflow', () => {
  let registry: PluginRegistry;
  let config: ScaforgeConfig;
  let manager: PluginManager;
  let testPlugins: PluginDefinition[];

  beforeEach(() => {
    // Set up fresh registry and config for each test
    registry = new PluginRegistry();
    testPlugins = createTestPlugins();
    testPlugins.forEach(plugin => registry.register(plugin));
    
    // Create a default config simulating a new project
    config = createDefaultConfig('test-project', 'nextjs');
    manager = new PluginManager(config, { registry });
  });

  afterEach(() => {
    registry.clear();
  });

  describe('Init → Add Workflow', () => {
    it('should start with empty plugins after init', () => {
      // Requirement 2.1: After init, project should have no plugins
      expect(manager.getInstalled()).toHaveLength(0);
      expect(config.plugins).toEqual({});
    });

    it('should add a single plugin successfully', async () => {
      // Requirement 2.3: Add plugin
      const result = await manager.add('api-trpc');
      
      expect(result.success).toBe(true);
      expect(manager.isInstalled('api-trpc')).toBe(true);
      expect(manager.getInstalled()).toContain('api-trpc');
    });

    it('should add multiple plugins sequentially', async () => {
      // Add multiple plugins
      await manager.add('api-trpc');
      await manager.add('db-prisma', { provider: 'postgresql' });
      
      const installed = manager.getInstalled();
      expect(installed).toHaveLength(2);
      expect(installed).toContain('api-trpc');
      expect(installed).toContain('db-prisma');
    });

    it('should auto-install dependencies when adding plugin', async () => {
      // auth-authjs depends on db-prisma
      const result = await manager.add('auth-authjs');
      
      expect(result.success).toBe(true);
      expect(result.installedDependencies).toContain('db-prisma');
      expect(manager.isInstalled('auth-authjs')).toBe(true);
      expect(manager.isInstalled('db-prisma')).toBe(true);
    });
  });

  describe('Add → Remove Workflow', () => {
    it('should remove a plugin that was added', async () => {
      // Requirement 2.3, 2.4: Add then remove
      await manager.add('api-trpc');
      expect(manager.isInstalled('api-trpc')).toBe(true);
      
      const result = await manager.remove('api-trpc');
      
      expect(result.success).toBe(true);
      expect(manager.isInstalled('api-trpc')).toBe(false);
      expect(manager.getInstalled()).not.toContain('api-trpc');
    });

    it('should prevent removing plugin with dependents', async () => {
      // Add auth-authjs which auto-installs db-prisma
      await manager.add('auth-authjs');
      
      // Try to remove db-prisma (auth-authjs depends on it)
      await expect(manager.remove('db-prisma')).rejects.toThrow(
        'Cannot remove "db-prisma"'
      );
      
      // db-prisma should still be installed
      expect(manager.isInstalled('db-prisma')).toBe(true);
    });

    it('should allow removing dependent first, then dependency', async () => {
      // Add auth-authjs which auto-installs db-prisma
      await manager.add('auth-authjs');
      
      // Remove auth-authjs first
      await manager.remove('auth-authjs');
      expect(manager.isInstalled('auth-authjs')).toBe(false);
      
      // Now we can remove db-prisma
      await manager.remove('db-prisma');
      expect(manager.isInstalled('db-prisma')).toBe(false);
      
      // Both should be gone
      expect(manager.getInstalled()).toHaveLength(0);
    });
  });

  describe('Conflict Detection', () => {
    it('should prevent adding conflicting plugins', async () => {
      // Add api-trpc first
      await manager.add('api-trpc');
      
      // Try to add api-apollo which conflicts with api-trpc
      await expect(manager.add('api-apollo')).rejects.toThrow(
        'conflicts with installed plugins'
      );
      
      // api-apollo should not be installed
      expect(manager.isInstalled('api-apollo')).toBe(false);
    });

    it('should allow adding conflicting plugin after removing the other', async () => {
      // Add and remove api-trpc
      await manager.add('api-trpc');
      await manager.remove('api-trpc');
      
      // Now api-apollo should be installable
      const result = await manager.add('api-apollo');
      expect(result.success).toBe(true);
      expect(manager.isInstalled('api-apollo')).toBe(true);
    });
  });

  describe('Template Compatibility', () => {
    it('should prevent adding plugin for unsupported template', async () => {
      // Create a hydrogen config
      const hydrogenConfig = createDefaultConfig('hydrogen-project', 'hydrogen');
      const hydrogenManager = new PluginManager(hydrogenConfig, { registry });
      
      // auth-authjs only supports nextjs and tanstack
      await expect(hydrogenManager.add('auth-authjs')).rejects.toThrow(
        'does not support hydrogen template'
      );
    });

    it('should allow adding plugin for supported template', async () => {
      // Create a tanstack config
      const tanstackConfig = createDefaultConfig('tanstack-project', 'tanstack');
      const tanstackManager = new PluginManager(tanstackConfig, { registry });
      
      // auth-authjs supports tanstack
      const result = await tanstackManager.add('auth-authjs');
      expect(result.success).toBe(true);
    });
  });

  describe('Configuration Persistence', () => {
    it('should update config when adding plugins', async () => {
      await manager.add('api-trpc');
      
      const updatedConfig = manager.getConfig();
      expect(updatedConfig.plugins['api-trpc']).toBeDefined();
      expect(updatedConfig.plugins['api-trpc']?.enabled).toBe(true);
    });

    it('should update config when removing plugins', async () => {
      await manager.add('api-trpc');
      await manager.remove('api-trpc');
      
      const updatedConfig = manager.getConfig();
      expect(updatedConfig.plugins['api-trpc']).toBeUndefined();
    });

    it('should preserve plugin options in config', async () => {
      const options = { provider: 'mysql' };
      await manager.add('db-prisma', options);
      
      const updatedConfig = manager.getConfig();
      expect(updatedConfig.plugins['db-prisma']?.options).toEqual(options);
    });
  });

  describe('Full Lifecycle: Init → Add → Remove → Re-add', () => {
    it('should handle complete plugin lifecycle', async () => {
      // Step 1: Fresh project (init)
      expect(manager.getInstalled()).toHaveLength(0);
      
      // Step 2: Add plugins
      await manager.add('api-trpc');
      await manager.add('db-prisma');
      expect(manager.getInstalled()).toHaveLength(2);
      
      // Step 3: Remove one plugin
      await manager.remove('api-trpc');
      expect(manager.getInstalled()).toHaveLength(1);
      expect(manager.isInstalled('db-prisma')).toBe(true);
      
      // Step 4: Re-add the removed plugin
      await manager.add('api-trpc');
      expect(manager.getInstalled()).toHaveLength(2);
      
      // Step 5: Verify final state
      const finalConfig = manager.getConfig();
      expect(finalConfig.plugins['api-trpc']?.enabled).toBe(true);
      expect(finalConfig.plugins['db-prisma']?.enabled).toBe(true);
    });
  });

  describe('Validation Methods', () => {
    it('should validate add operation correctly', async () => {
      // Valid add
      let validation = manager.validateAdd('api-trpc');
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      
      // Add the plugin
      await manager.add('api-trpc');
      
      // Now it should be invalid (already installed)
      validation = manager.validateAdd('api-trpc');
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('already installed'))).toBe(true);
    });

    it('should validate remove operation correctly', async () => {
      // Invalid remove (not installed)
      let validation = manager.validateRemove('api-trpc');
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('not installed'))).toBe(true);
      
      // Add the plugin
      await manager.add('api-trpc');
      
      // Now it should be valid
      validation = manager.validateRemove('api-trpc');
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });
});

describe('Registry Integration', () => {
  let registry: PluginRegistry;
  let testPlugins: PluginDefinition[];

  beforeEach(() => {
    registry = new PluginRegistry();
    testPlugins = createTestPlugins();
    testPlugins.forEach(plugin => registry.register(plugin));
  });

  afterEach(() => {
    registry.clear();
  });

  it('should list all registered plugins', () => {
    const allPlugins = registry.getAll();
    expect(allPlugins).toHaveLength(testPlugins.length);
  });

  it('should filter plugins by category', () => {
    const apiPlugins = registry.getByCategory('api');
    expect(apiPlugins).toHaveLength(2); // api-trpc and api-apollo
    expect(apiPlugins.every(p => p.category === 'api')).toBe(true);
  });

  it('should get unique categories', () => {
    const categories = registry.getCategories();
    expect(categories).toContain('api');
    expect(categories).toContain('database');
    expect(categories).toContain('auth');
  });

  it('should get plugin by name', () => {
    const plugin = registry.get('api-trpc');
    expect(plugin).toBeDefined();
    expect(plugin?.name).toBe('api-trpc');
    expect(plugin?.displayName).toBe('tRPC');
  });

  it('should return undefined for non-existent plugin', () => {
    const plugin = registry.get('non-existent');
    expect(plugin).toBeUndefined();
  });
});
