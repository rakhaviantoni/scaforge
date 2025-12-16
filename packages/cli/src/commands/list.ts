/**
 * List Command
 * Lists available or installed plugins
 * 
 * Requirements: 2.5, 2.6
 */
import { Command } from 'commander';
import { PluginManager, registry } from '@scaforge/core';
import { loadConfig, configExists } from '@scaforge/core';
import { logger } from '../utils/logger';
import chalk from 'chalk';
import type { PluginCategory, PluginDefinition } from '@scaforge/core';

export const listCommand = new Command('list')
  .description('List available plugins')
  .option('-i, --installed', 'Show only installed plugins')
  .option('-c, --category <category>', 'Filter by category')
  .action(async (options: { installed?: boolean; category?: string }) => {
    try {
      if (options.installed) {
        await listInstalledPlugins(options.category);
      } else {
        await listAvailablePlugins(options.category);
      }
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
 * List all available plugins grouped by category
 * Requirements: 2.5
 */
async function listAvailablePlugins(categoryFilter?: string): Promise<void> {
  const allPlugins = registry.getAll();
  
  if (allPlugins.length === 0) {
    logger.warn('No plugins available.');
    return;
  }

  // Filter by category if specified
  let pluginsToShow = allPlugins;
  if (categoryFilter) {
    pluginsToShow = registry.getByCategory(categoryFilter as PluginCategory);
    
    if (pluginsToShow.length === 0) {
      logger.error(`No plugins found in category "${categoryFilter}".`);
      logger.info('Available categories: ' + registry.getCategories().join(', '));
      return;
    }
  }

  // Group plugins by category
  const pluginsByCategory = groupPluginsByCategory(pluginsToShow);
  const categories = Object.keys(pluginsByCategory).sort();

  // Display header
  if (categoryFilter) {
    logger.info(`Available plugins in category "${categoryFilter}":`);
  } else {
    logger.info(`Available plugins (${allPlugins.length} total):`);
  }
  logger.newLine();

  // Display each category
  for (const category of categories) {
    const plugins = pluginsByCategory[category];
    if (!plugins) continue;
    
    // Category header
    console.log(chalk.bold.cyan(`${category.toUpperCase()} (${plugins.length})`));
    
    // List plugins in category
    for (const plugin of plugins.sort((a, b) => a.name.localeCompare(b.name))) {
      const nameDisplay = chalk.green(plugin.name);
      const displayNameDisplay = chalk.dim(`(${plugin.displayName})`);
      const descriptionDisplay = chalk.gray(plugin.description);
      
      console.log(`  ${nameDisplay} ${displayNameDisplay}`);
      console.log(`    ${descriptionDisplay}`);
      
      // Show supported templates
      const templatesDisplay = chalk.dim(`Templates: ${plugin.supportedTemplates.join(', ')}`);
      console.log(`    ${templatesDisplay}`);
    }
    
    logger.newLine();
  }

  // Show usage hint
  logger.info('Usage:');
  logger.log('  scaforge add <plugin>     # Add a plugin to your project');
  logger.log('  scaforge list --installed # Show installed plugins');
  logger.log('  scaforge list -c <category> # Filter by category');
}

/**
 * List installed plugins
 * Requirements: 2.6
 */
async function listInstalledPlugins(categoryFilter?: string): Promise<void> {
  // Check if we're in a Scaforge project
  const projectRoot = process.cwd();
  if (!configExists(projectRoot)) {
    logger.error('Not in a Scaforge project. Run "scaforge init" first.');
    return;
  }

  // Load current configuration
  const config = loadConfig(projectRoot);
  const manager = new PluginManager(config);
  const installedPluginNames = manager.getInstalled();

  if (installedPluginNames.length === 0) {
    logger.warn('No plugins installed.');
    logger.info('Run "scaforge add <plugin>" to install plugins.');
    return;
  }

  // Get plugin definitions for installed plugins
  const installedPlugins: PluginDefinition[] = [];
  for (const pluginName of installedPluginNames) {
    const plugin = registry.get(pluginName);
    if (plugin) {
      installedPlugins.push(plugin);
    }
  }

  // Filter by category if specified
  let pluginsToShow = installedPlugins;
  if (categoryFilter) {
    pluginsToShow = installedPlugins.filter(p => p.category === categoryFilter);
    
    if (pluginsToShow.length === 0) {
      logger.error(`No installed plugins found in category "${categoryFilter}".`);
      const installedCategories = [...new Set(installedPlugins.map(p => p.category))];
      if (installedCategories.length > 0) {
        logger.info('Installed categories: ' + installedCategories.join(', '));
      }
      return;
    }
  }

  // Group plugins by category
  const pluginsByCategory = groupPluginsByCategory(pluginsToShow);
  const categories = Object.keys(pluginsByCategory).sort();

  // Display header
  if (categoryFilter) {
    logger.info(`Installed plugins in category "${categoryFilter}":`);
  } else {
    logger.info(`Installed plugins (${installedPlugins.length} total):`);
  }
  logger.newLine();

  // Display each category
  for (const category of categories) {
    const plugins = pluginsByCategory[category];
    if (!plugins) continue;
    
    // Category header
    console.log(chalk.bold.green(`${category.toUpperCase()} (${plugins.length})`));
    
    // List plugins in category
    for (const plugin of plugins.sort((a, b) => a.name.localeCompare(b.name))) {
      const nameDisplay = chalk.green(plugin.name);
      const displayNameDisplay = chalk.dim(`(${plugin.displayName})`);
      const descriptionDisplay = chalk.gray(plugin.description);
      const installedBadge = chalk.bgGreen.black(' INSTALLED ');
      
      console.log(`  ${nameDisplay} ${displayNameDisplay} ${installedBadge}`);
      console.log(`    ${descriptionDisplay}`);
      
      // Show plugin options if configured
      const pluginConfig = config.plugins[plugin.name];
      if (pluginConfig && pluginConfig.options && Object.keys(pluginConfig.options).length > 0) {
        const optionsDisplay = chalk.dim(`Options: ${JSON.stringify(pluginConfig.options)}`);
        console.log(`    ${optionsDisplay}`);
      }
    }
    
    logger.newLine();
  }

  // Show usage hint
  logger.info('Usage:');
  logger.log('  scaforge remove <plugin>  # Remove a plugin from your project');
  logger.log('  scaforge list             # Show all available plugins');
}

/**
 * Group plugins by category
 */
function groupPluginsByCategory(plugins: PluginDefinition[]): Record<string, PluginDefinition[]> {
  const grouped: Record<string, PluginDefinition[]> = {};
  
  for (const plugin of plugins) {
    if (!grouped[plugin.category]) {
      grouped[plugin.category] = [];
    }
    grouped[plugin.category]!.push(plugin);
  }
  
  return grouped;
}
