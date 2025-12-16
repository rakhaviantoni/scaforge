/**
 * Plugin Manager
 * Manages plugin installation, removal, and lifecycle
 * 
 * Requirements: 2.3, 2.4, 3.1, 3.5, 3.6, 41.4
 */
import type { PluginDefinition } from './types';
import { PluginRegistry, registry as globalRegistry } from './registry';
import type { ScaforgeConfig } from '../config/types';

/**
 * Result of a plugin operation
 */
export interface PluginOperationResult {
  success: boolean;
  message: string;
  installedDependencies?: string[];
  generatedFiles?: string[];
}

/**
 * Error thrown when a plugin operation fails
 */
export class PluginError extends Error {
  constructor(
    message: string,
    public code: PluginErrorCode,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PluginError';
  }
}

export type PluginErrorCode =
  | 'PLUGIN_NOT_FOUND'
  | 'PLUGIN_CONFLICT'
  | 'PLUGIN_DEPENDENCY_MISSING'
  | 'PLUGIN_HAS_DEPENDENTS'
  | 'TEMPLATE_NOT_SUPPORTED'
  | 'PLUGIN_ALREADY_INSTALLED'
  | 'PLUGIN_NOT_INSTALLED';

/**
 * Options for the PluginManager
 */
export interface PluginManagerOptions {
  /** Custom registry to use (defaults to global registry) */
  registry?: PluginRegistry;
  /** Whether to auto-install dependencies */
  autoInstallDependencies?: boolean;
}


/**
 * Plugin Manager class
 * Handles plugin installation, removal, and state management
 */
export class PluginManager {
  private config: ScaforgeConfig;
  private registry: PluginRegistry;
  private autoInstallDependencies: boolean;

  /**
   * Creates a new PluginManager instance
   * 
   * @param config - The current project configuration
   * @param options - Manager options
   */
  constructor(config: ScaforgeConfig, options: PluginManagerOptions = {}) {
    this.config = { ...config, plugins: { ...config.plugins } };
    this.registry = options.registry ?? globalRegistry;
    this.autoInstallDependencies = options.autoInstallDependencies ?? true;
  }

  /**
   * Gets the current configuration
   */
  getConfig(): ScaforgeConfig {
    return this.config;
  }

  /**
   * Gets the list of installed plugin names
   * 
   * @returns Array of installed plugin names
   */
  getInstalled(): string[] {
    return Object.keys(this.config.plugins)
      .filter(name => this.config.plugins[name]?.enabled);
  }

  /**
   * Checks if a plugin is installed
   * 
   * @param pluginName - Name of the plugin to check
   * @returns true if the plugin is installed and enabled
   */
  isInstalled(pluginName: string): boolean {
    return this.config.plugins[pluginName]?.enabled === true;
  }

  /**
   * Adds a plugin to the project
   * 
   * Requirements: 2.3
   * 
   * @param pluginName - Name of the plugin to add
   * @param options - Plugin-specific options
   * @returns Result of the operation
   * @throws PluginError if the operation fails
   */
  async add(
    pluginName: string,
    options?: Record<string, unknown>
  ): Promise<PluginOperationResult> {
    const plugin = this.registry.get(pluginName);
    
    if (!plugin) {
      throw new PluginError(
        `Plugin "${pluginName}" not found in registry`,
        'PLUGIN_NOT_FOUND',
        { pluginName }
      );
    }

    // Check if already installed
    if (this.isInstalled(pluginName)) {
      throw new PluginError(
        `Plugin "${pluginName}" is already installed`,
        'PLUGIN_ALREADY_INSTALLED',
        { pluginName }
      );
    }

    // Check template compatibility
    if (!plugin.supportedTemplates.includes(this.config.template)) {
      throw new PluginError(
        `Plugin "${pluginName}" does not support ${this.config.template} template`,
        'TEMPLATE_NOT_SUPPORTED',
        { pluginName, template: this.config.template, supportedTemplates: plugin.supportedTemplates }
      );
    }

    // Check for conflicts
    const conflicts = this.checkConflicts(plugin);
    if (conflicts.length > 0) {
      throw new PluginError(
        `Plugin "${pluginName}" conflicts with installed plugins: ${conflicts.join(', ')}`,
        'PLUGIN_CONFLICT',
        { pluginName, conflicts }
      );
    }

    // Install dependencies first
    const installedDependencies: string[] = [];
    if (this.autoInstallDependencies) {
      const deps = await this.installDependencies(plugin);
      installedDependencies.push(...deps);
    } else {
      // Check that all dependencies are installed
      const missingDeps = this.getMissingDependencies(plugin);
      if (missingDeps.length > 0) {
        throw new PluginError(
          `Plugin "${pluginName}" requires these plugins to be installed first: ${missingDeps.join(', ')}`,
          'PLUGIN_DEPENDENCY_MISSING',
          { pluginName, missingDependencies: missingDeps }
        );
      }
    }

    // Add plugin to config
    this.config.plugins[pluginName] = {
      enabled: true,
      options: options ?? {},
    };

    return {
      success: true,
      message: `Plugin "${pluginName}" added successfully`,
      installedDependencies,
    };
  }

  /**
   * Removes a plugin from the project
   * 
   * Requirements: 2.4
   * 
   * @param pluginName - Name of the plugin to remove
   * @returns Result of the operation
   * @throws PluginError if the operation fails
   */
  async remove(pluginName: string): Promise<PluginOperationResult> {
    const plugin = this.registry.get(pluginName);
    
    if (!plugin) {
      throw new PluginError(
        `Plugin "${pluginName}" not found in registry`,
        'PLUGIN_NOT_FOUND',
        { pluginName }
      );
    }

    // Check if installed
    if (!this.isInstalled(pluginName)) {
      throw new PluginError(
        `Plugin "${pluginName}" is not installed`,
        'PLUGIN_NOT_INSTALLED',
        { pluginName }
      );
    }

    // Check if other plugins depend on this one
    const dependents = this.getDependents(pluginName);
    if (dependents.length > 0) {
      throw new PluginError(
        `Cannot remove "${pluginName}": ${dependents.join(', ')} depend on it`,
        'PLUGIN_HAS_DEPENDENTS',
        { pluginName, dependents }
      );
    }

    // Remove plugin from config
    delete this.config.plugins[pluginName];

    return {
      success: true,
      message: `Plugin "${pluginName}" removed successfully`,
    };
  }


  /**
   * Checks for conflicts between a plugin and installed plugins
   * 
   * Requirements: 3.6, 41.4
   * 
   * @param plugin - The plugin to check
   * @returns Array of conflicting plugin names
   */
  checkConflicts(plugin: PluginDefinition): string[] {
    if (!plugin.conflicts || plugin.conflicts.length === 0) {
      return [];
    }

    return plugin.conflicts.filter(conflict => this.isInstalled(conflict));
  }

  /**
   * Gets plugins that depend on the specified plugin
   * 
   * @param pluginName - Name of the plugin to check
   * @returns Array of dependent plugin names
   */
  getDependents(pluginName: string): string[] {
    const installed = this.getInstalled();
    
    return installed.filter(name => {
      const plugin = this.registry.get(name);
      return plugin?.dependencies?.includes(pluginName) ?? false;
    });
  }

  /**
   * Gets missing dependencies for a plugin
   * 
   * @param plugin - The plugin to check
   * @returns Array of missing dependency names
   */
  getMissingDependencies(plugin: PluginDefinition): string[] {
    if (!plugin.dependencies || plugin.dependencies.length === 0) {
      return [];
    }

    return plugin.dependencies.filter(dep => !this.isInstalled(dep));
  }

  /**
   * Installs dependencies for a plugin
   * 
   * Requirements: 3.1, 3.5
   * 
   * @param plugin - The plugin whose dependencies to install
   * @returns Array of installed dependency names
   */
  async installDependencies(plugin: PluginDefinition): Promise<string[]> {
    if (!plugin.dependencies || plugin.dependencies.length === 0) {
      return [];
    }

    const installedDeps: string[] = [];

    for (const depName of plugin.dependencies) {
      if (!this.isInstalled(depName)) {
        // Recursively add the dependency
        await this.add(depName);
        installedDeps.push(depName);
      }
    }

    return installedDeps;
  }

  /**
   * Validates that a plugin can be added
   * 
   * @param pluginName - Name of the plugin to validate
   * @returns Object with validation result and any errors
   */
  validateAdd(pluginName: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const plugin = this.registry.get(pluginName);

    if (!plugin) {
      errors.push(`Plugin "${pluginName}" not found in registry`);
      return { valid: false, errors };
    }

    if (this.isInstalled(pluginName)) {
      errors.push(`Plugin "${pluginName}" is already installed`);
    }

    if (!plugin.supportedTemplates.includes(this.config.template)) {
      errors.push(`Plugin "${pluginName}" does not support ${this.config.template} template`);
    }

    const conflicts = this.checkConflicts(plugin);
    if (conflicts.length > 0) {
      errors.push(`Plugin "${pluginName}" conflicts with: ${conflicts.join(', ')}`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validates that a plugin can be removed
   * 
   * @param pluginName - Name of the plugin to validate
   * @returns Object with validation result and any errors
   */
  validateRemove(pluginName: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const plugin = this.registry.get(pluginName);

    if (!plugin) {
      errors.push(`Plugin "${pluginName}" not found in registry`);
      return { valid: false, errors };
    }

    if (!this.isInstalled(pluginName)) {
      errors.push(`Plugin "${pluginName}" is not installed`);
    }

    const dependents = this.getDependents(pluginName);
    if (dependents.length > 0) {
      errors.push(`Cannot remove "${pluginName}": ${dependents.join(', ')} depend on it`);
    }

    return { valid: errors.length === 0, errors };
  }
}
