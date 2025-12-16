/**
 * Plugin Registry
 * Central registry for managing plugin definitions
 */
import type { PluginDefinition, PluginCategory } from './types';

/**
 * Plugin Registry class for managing plugin definitions
 * Provides methods to register, retrieve, and query plugins
 */
export class PluginRegistry {
  private plugins: Map<string, PluginDefinition> = new Map();

  /**
   * Register a plugin definition
   * @param plugin - The plugin definition to register
   */
  register(plugin: PluginDefinition): void {
    this.plugins.set(plugin.name, plugin);
  }

  /**
   * Unregister a plugin by name
   * @param name - The plugin name to unregister
   * @returns true if the plugin was removed, false if it didn't exist
   */
  unregister(name: string): boolean {
    return this.plugins.delete(name);
  }

  /**
   * Get a plugin by name
   * @param name - The plugin name
   * @returns The plugin definition or undefined if not found
   */
  get(name: string): PluginDefinition | undefined {
    return this.plugins.get(name);
  }

  /**
   * Check if a plugin is registered
   * @param name - The plugin name
   * @returns true if the plugin exists
   */
  has(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Get all plugins in a specific category
   * @param category - The plugin category
   * @returns Array of plugins in that category
   */
  getByCategory(category: PluginCategory): PluginDefinition[] {
    return Array.from(this.plugins.values())
      .filter(p => p.category === category);
  }

  /**
   * Get all registered plugins
   * @returns Array of all plugin definitions
   */
  getAll(): PluginDefinition[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get all unique categories that have registered plugins
   * @returns Array of categories
   */
  getCategories(): PluginCategory[] {
    const categories = new Set<PluginCategory>();
    this.plugins.forEach(p => categories.add(p.category));
    return Array.from(categories);
  }

  /**
   * Get the number of registered plugins
   * @returns The count of registered plugins
   */
  size(): number {
    return this.plugins.size;
  }

  /**
   * Clear all registered plugins
   */
  clear(): void {
    this.plugins.clear();
  }
}

/**
 * Global plugin registry instance
 */
export const registry = new PluginRegistry();
