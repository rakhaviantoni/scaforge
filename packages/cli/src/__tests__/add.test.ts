/**
 * Add Command Tests
 * Tests for the add command functionality
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { PluginManager, PluginRegistry } from '@scaforge/core';
import type { ScaforgeConfig, PluginDefinition } from '@scaforge/core';
import { z } from 'zod';

describe('Add Command', () => {
  let registry: PluginRegistry;
  let config: ScaforgeConfig;
  let manager: PluginManager;

  const samplePlugin: PluginDefinition = {
    name: 'test-plugin',
    displayName: 'Test Plugin',
    category: 'api',
    description: 'A test plugin',
    version: '1.0.0',
    supportedTemplates: ['nextjs'],
    packages: {
      dependencies: {
        'test-package': '^1.0.0',
      },
    },
    configSchema: z.object({
      enabled: z.boolean().default(true),
      apiKey: z.string().default('test-key'),
    }),
    files: [
      {
        path: 'src/test.ts',
        template: 'export const test = "{{options.apiKey}}";',
      },
    ],
  };

  beforeEach(() => {
    registry = new PluginRegistry();
    registry.register(samplePlugin);
    
    config = {
      name: 'test-project',
      template: 'nextjs',
      plugins: {},
    };
    
    manager = new PluginManager(config, { registry });
  });

  it('should validate plugin can be added', () => {
    const validation = manager.validateAdd('test-plugin');
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should prevent adding non-existent plugin', () => {
    const validation = manager.validateAdd('non-existent');
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('Plugin "non-existent" not found in registry');
  });

  it('should prevent adding plugin for unsupported template', () => {
    const unsupportedConfig = {
      ...config,
      template: 'vue' as any,
    };
    const unsupportedManager = new PluginManager(unsupportedConfig, { registry });
    
    const validation = unsupportedManager.validateAdd('test-plugin');
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('Plugin "test-plugin" does not support vue template');
  });

  it('should add plugin successfully', async () => {
    const options = { apiKey: 'custom-key', enabled: false };
    const result = await manager.add('test-plugin', options);
    
    expect(result.success).toBe(true);
    expect(result.message).toContain('added successfully');
    expect(manager.isInstalled('test-plugin')).toBe(true);
    
    const updatedConfig = manager.getConfig();
    expect(updatedConfig.plugins['test-plugin']).toEqual({
      enabled: true,
      options,
    });
  });

  it('should prevent adding already installed plugin', async () => {
    await manager.add('test-plugin');
    
    await expect(manager.add('test-plugin')).rejects.toThrow(
      'Plugin "test-plugin" is already installed'
    );
  });
});