/**
 * Add Command
 * Adds a plugin to the current Scaforge project
 * 
 * Requirements: 2.3, 40.4
 */
import { Command } from 'commander';
import { PluginManager, registry } from '@scaforge/core';
import { loadConfig, saveConfig, configExists } from '@scaforge/core';
import { logger } from '../utils/logger';
import { withSpinner } from '../utils/spinner';
import { promptSelect, promptConfirm, runPrompts } from '../utils/prompts';
import type { PluginDefinition } from '@scaforge/core';

export const addCommand = new Command('add')
  .description('Add a plugin to your project')
  .argument('[plugin]', 'Plugin name (e.g., api-trpc, auth-clerk)')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(async (pluginName: string | undefined, options: { yes?: boolean }) => {
    try {
      // Check if we're in a Scaforge project
      const projectRoot = process.cwd();
      if (!configExists(projectRoot)) {
        logger.error('Not in a Scaforge project. Run "scaforge init" first.');
        process.exit(1);
      }

      // Load current configuration
      const config = loadConfig(projectRoot);
      const manager = new PluginManager(config);

      let selectedPlugin: string;
      let plugin: PluginDefinition;

      if (pluginName) {
        // Direct plugin specification
        selectedPlugin = pluginName;
        const foundPlugin = registry.get(selectedPlugin);
        
        if (!foundPlugin) {
          logger.error(`Plugin "${selectedPlugin}" not found.`);
          logger.info('Run "scaforge list" to see available plugins.');
          process.exit(1);
        }
        
        plugin = foundPlugin;
      } else {
        // Interactive plugin selection
        const result = await selectPluginInteractively();
        if (!result) {
          logger.warn('No plugin selected.');
          process.exit(0);
        }
        selectedPlugin = result.pluginName;
        plugin = result.plugin;
      }

      // Validate the plugin can be added
      const validation = manager.validateAdd(selectedPlugin);
      if (!validation.valid) {
        logger.error(`Cannot add plugin "${selectedPlugin}":`);
        validation.errors.forEach(error => logger.error(`  ${error}`));
        process.exit(1);
      }

      // Show plugin information
      logger.info(`Adding ${plugin.displayName} (${plugin.name})`);
      logger.log(`  Category: ${plugin.category}`);
      logger.log(`  Description: ${plugin.description}`);
      
      if (plugin.dependencies && plugin.dependencies.length > 0) {
        const missingDeps = manager.getMissingDependencies(plugin);
        if (missingDeps.length > 0) {
          logger.info(`Dependencies to install: ${missingDeps.join(', ')}`);
        }
      }

      // Confirm installation unless --yes flag is used
      if (!options.yes) {
        const confirmed = await promptConfirm('Continue with installation?');
        if (!confirmed) {
          logger.warn('Installation cancelled.');
          process.exit(0);
        }
      }

      // Prompt for plugin-specific options
      const pluginOptions = await promptForPluginOptions(plugin);

      // Install the plugin
      await withSpinner(
        `Installing ${plugin.displayName}...`,
        async () => {
          const result = await manager.add(selectedPlugin, pluginOptions);
          
          // Save updated configuration
          await saveConfig(projectRoot, manager.getConfig());
          
          return result;
        },
        {
          successText: `${plugin.displayName} installed successfully!`,
          failText: `Failed to install ${plugin.displayName}`,
        }
      );

      // Show post-install information
      if (plugin.postInstall) {
        logger.newLine();
        logger.info('Next steps:');
        logger.log(plugin.postInstall);
      }

      logger.newLine();
      logger.success('Plugin added successfully!');
      
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message);
      } else {
        logger.error('An unexpected error occurred');
      }
      process.exit(1);
    }
  });

/**
 * Interactive plugin selection
 */
async function selectPluginInteractively(): Promise<{ pluginName: string; plugin: PluginDefinition } | null> {
  const categories = registry.getCategories();
  
  if (categories.length === 0) {
    logger.error('No plugins available.');
    return null;
  }

  // Select category
  const selectedCategory = await promptSelect(
    'Select a plugin category:',
    categories.map(category => ({
      title: category.charAt(0).toUpperCase() + category.slice(1),
      value: category,
      description: `${registry.getByCategory(category).length} plugins available`,
    }))
  );

  if (!selectedCategory) {
    return null;
  }

  // Select plugin from category
  const plugins = registry.getByCategory(selectedCategory);
  
  if (plugins.length === 0) {
    logger.error(`No plugins available in category "${selectedCategory}".`);
    return null;
  }

  const selectedPluginName = await promptSelect(
    'Select a plugin:',
    plugins.map(plugin => ({
      title: plugin.displayName,
      value: plugin.name,
      description: plugin.description,
    }))
  );

  if (!selectedPluginName) {
    return null;
  }

  const plugin = registry.get(selectedPluginName);
  if (!plugin) {
    logger.error(`Plugin "${selectedPluginName}" not found.`);
    return null;
  }

  return { pluginName: selectedPluginName, plugin };
}

/**
 * Prompt for plugin-specific configuration options
 * Requirements: 40.4
 */
async function promptForPluginOptions(plugin: PluginDefinition): Promise<Record<string, unknown>> {
  if (!plugin.configSchema) {
    return {};
  }

  logger.info(`Configuring ${plugin.displayName}...`);
  
  try {
    // Parse the schema to get default values and create prompts
    const options = await parseSchemaAndPrompt(plugin);
    
    // Validate the collected options against the schema
    const validatedOptions = plugin.configSchema.parse(options);
    
    return validatedOptions;
  } catch (error) {
    logger.warn('Using default configuration due to schema parsing error.');
    
    // Try to get defaults from the schema
    try {
      const defaults = plugin.configSchema.parse({});
      return defaults;
    } catch {
      return {};
    }
  }
}

/**
 * Parse Zod schema and create interactive prompts
 */
async function parseSchemaAndPrompt(plugin: PluginDefinition): Promise<Record<string, unknown>> {
  if (!plugin.configSchema) {
    return {};
  }

  const options: Record<string, unknown> = {};
  
  // This is a simplified implementation that handles basic Zod types
  // In a full implementation, you would recursively parse the schema
  
  try {
    // Try to parse with empty object to get defaults
    const defaults = plugin.configSchema.parse({});
    
    // For each default value, create a prompt
    for (const [key, defaultValue] of Object.entries(defaults)) {
      const promptResult = await createPromptForField(key, defaultValue);
      if (promptResult !== undefined) {
        options[key] = promptResult;
      }
    }
  } catch (parseError) {
    // If we can't get defaults, try to infer from schema structure
    logger.info('No default configuration available. Skipping configuration prompts.');
  }

  return options;
}

/**
 * Create a prompt for a specific configuration field
 */
async function createPromptForField(fieldName: string, defaultValue: unknown): Promise<unknown> {
  const fieldLabel = fieldName.replace(/([A-Z])/g, ' $1').toLowerCase();
  const capitalizedLabel = fieldLabel.charAt(0).toUpperCase() + fieldLabel.slice(1);

  if (typeof defaultValue === 'boolean') {
    return await promptConfirm(`${capitalizedLabel}?`, defaultValue);
  }
  
  if (typeof defaultValue === 'string') {
    const result = await runPrompts([
      {
        type: 'text',
        name: 'value',
        message: `${capitalizedLabel}:`,
        initial: defaultValue,
      },
    ]);
    return result.value || defaultValue;
  }
  
  if (typeof defaultValue === 'number') {
    const result = await runPrompts([
      {
        type: 'number',
        name: 'value',
        message: `${capitalizedLabel}:`,
        initial: defaultValue,
      },
    ]);
    return result.value !== undefined ? result.value : defaultValue;
  }

  // For complex types, just return the default
  return defaultValue;
}
