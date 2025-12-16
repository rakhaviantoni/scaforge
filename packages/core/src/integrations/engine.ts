/**
 * Integration Engine
 * Handles automatic integrations between plugins
 * 
 * Requirements: 41.1, 41.2, 41.3
 */
import type { PluginDefinition, PluginIntegration } from '../plugin-system/types';
import type { ScaforgeConfig } from '../config/types';
import { generateFiles, GeneratorContext, evaluateCondition } from '../codegen/generator';

/**
 * Result of running integrations
 */
export interface IntegrationResult {
  /** Integrations that were successfully applied */
  appliedIntegrations: AppliedIntegration[];
  /** Integrations that were skipped */
  skippedIntegrations: SkippedIntegration[];
  /** Any errors that occurred */
  errors: IntegrationError[];
}

/**
 * Details of an applied integration
 */
export interface AppliedIntegration {
  /** Source plugin name */
  sourcePlugin: string;
  /** Target plugin name */
  targetPlugin: string;
  /** Integration type */
  type: string;
  /** Files generated for this integration */
  generatedFiles: string[];
}

/**
 * Details of a skipped integration
 */
export interface SkippedIntegration {
  /** Source plugin name */
  sourcePlugin: string;
  /** Target plugin name */
  targetPlugin: string;
  /** Reason for skipping */
  reason: string;
}

/**
 * Integration error details
 */
export interface IntegrationError {
  /** Source plugin name */
  sourcePlugin: string;
  /** Target plugin name */
  targetPlugin: string;
  /** Error message */
  error: string;
}


/**
 * Options for running integrations
 */
export interface RunIntegrationsOptions {
  /** Whether to perform a dry run (don't write files) */
  dryRun?: boolean;
  /** Whether to force overwrite existing files */
  forceOverwrite?: boolean;
}

/**
 * Runs integrations for a plugin with other installed plugins
 * 
 * When a plugin is installed, this function checks if it has integrations
 * defined with other plugins. If those plugins are already installed,
 * the integration files are generated.
 * 
 * Requirements: 41.1, 41.2, 41.3
 * 
 * @param projectRoot - Path to the project root directory
 * @param plugin - The plugin being installed
 * @param config - Current project configuration
 * @param options - Integration options
 * @returns Result of running integrations
 */
export async function runIntegrations(
  projectRoot: string,
  plugin: PluginDefinition,
  config: ScaforgeConfig,
  options: RunIntegrationsOptions = {}
): Promise<IntegrationResult> {
  const result: IntegrationResult = {
    appliedIntegrations: [],
    skippedIntegrations: [],
    errors: [],
  };

  // If plugin has no integrations defined, return early
  if (!plugin.integrations || plugin.integrations.length === 0) {
    return result;
  }

  // Get list of installed plugins
  const installedPlugins = Object.keys(config.plugins).filter(
    p => config.plugins[p]?.enabled
  );

  // Process each integration
  for (const integration of plugin.integrations) {
    try {
      // Check if the target plugin is installed
      if (!installedPlugins.includes(integration.plugin)) {
        result.skippedIntegrations.push({
          sourcePlugin: plugin.name,
          targetPlugin: integration.plugin,
          reason: `Target plugin "${integration.plugin}" is not installed`,
        });
        continue;
      }

      // Generate integration files
      const integrationResult = await generateIntegrationFiles(
        projectRoot,
        plugin,
        integration,
        config,
        options
      );

      result.appliedIntegrations.push({
        sourcePlugin: plugin.name,
        targetPlugin: integration.plugin,
        type: integration.type,
        generatedFiles: integrationResult.generatedFiles,
      });
    } catch (error) {
      result.errors.push({
        sourcePlugin: plugin.name,
        targetPlugin: integration.plugin,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

/**
 * Generates files for a specific integration
 */
async function generateIntegrationFiles(
  projectRoot: string,
  plugin: PluginDefinition,
  integration: PluginIntegration,
  config: ScaforgeConfig,
  options: RunIntegrationsOptions
): Promise<{ generatedFiles: string[] }> {
  // Create a temporary plugin definition with just the integration files
  const integrationPlugin: PluginDefinition = {
    ...plugin,
    files: integration.files,
  };

  const result = await generateFiles(
    projectRoot,
    integrationPlugin,
    config,
    config.plugins[plugin.name]?.options ?? {},
    {
      dryRun: options.dryRun,
      forceOverwrite: options.forceOverwrite,
    }
  );

  return {
    generatedFiles: result.generatedFiles,
  };
}


/**
 * Gets the list of integrations that would be applied for a plugin
 * (without actually applying them)
 * 
 * @param plugin - The plugin to check
 * @param config - Current project configuration
 * @returns Array of integration details that would be applied
 */
export function getApplicableIntegrations(
  plugin: PluginDefinition,
  config: ScaforgeConfig
): Array<{ targetPlugin: string; type: string; files: string[] }> {
  if (!plugin.integrations || plugin.integrations.length === 0) {
    return [];
  }

  const installedPlugins = Object.keys(config.plugins).filter(
    p => config.plugins[p]?.enabled
  );

  const context: GeneratorContext = {
    plugin,
    config,
    options: config.plugins[plugin.name]?.options ?? {},
    template: config.template,
    installedPlugins,
  };

  return plugin.integrations
    .filter(integration => installedPlugins.includes(integration.plugin))
    .map(integration => ({
      targetPlugin: integration.plugin,
      type: integration.type,
      files: integration.files
        .filter(file => {
          if (file.condition) {
            return evaluateCondition(file.condition, context);
          }
          return true;
        })
        .map(file => file.path),
    }));
}

/**
 * Checks if two plugins have an integration defined between them
 * 
 * @param sourcePlugin - The source plugin
 * @param targetPluginName - Name of the target plugin
 * @returns true if an integration exists
 */
export function hasIntegration(
  sourcePlugin: PluginDefinition,
  targetPluginName: string
): boolean {
  if (!sourcePlugin.integrations) {
    return false;
  }

  return sourcePlugin.integrations.some(
    integration => integration.plugin === targetPluginName
  );
}

/**
 * Gets all integration files that would be generated between two plugins
 * 
 * @param sourcePlugin - The source plugin
 * @param targetPluginName - Name of the target plugin
 * @param config - Current project configuration
 * @returns Array of file paths that would be generated
 */
export function getIntegrationFiles(
  sourcePlugin: PluginDefinition,
  targetPluginName: string,
  config: ScaforgeConfig
): string[] {
  if (!sourcePlugin.integrations) {
    return [];
  }

  const integration = sourcePlugin.integrations.find(
    i => i.plugin === targetPluginName
  );

  if (!integration) {
    return [];
  }

  const installedPlugins = Object.keys(config.plugins).filter(
    p => config.plugins[p]?.enabled
  );

  const context: GeneratorContext = {
    plugin: sourcePlugin,
    config,
    options: config.plugins[sourcePlugin.name]?.options ?? {},
    template: config.template,
    installedPlugins,
  };

  return integration.files
    .filter(file => {
      if (file.condition) {
        return evaluateCondition(file.condition, context);
      }
      return true;
    })
    .map(file => file.path);
}
