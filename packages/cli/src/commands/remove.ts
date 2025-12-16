/**
 * Remove Command
 * Removes a plugin from the current Scaforge project
 * 
 * Requirements: 2.4
 */
import { Command } from 'commander';
import { PluginManager, registry } from '@scaforge/core';
import { loadConfig, saveConfig, configExists } from '@scaforge/core';
import { logger } from '../utils/logger';
import { withSpinner } from '../utils/spinner';
import { promptConfirm } from '../utils/prompts';

export const removeCommand = new Command('remove')
  .description('Remove a plugin from your project')
  .argument('<plugin>', 'Plugin name to remove (e.g., api-trpc, auth-clerk)')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(async (pluginName: string, options: { yes?: boolean }) => {
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

      // Get plugin information
      const plugin = registry.get(pluginName);
      if (!plugin) {
        logger.error(`Plugin "${pluginName}" not found.`);
        logger.info('Run "scaforge list --installed" to see installed plugins.');
        process.exit(1);
      }

      // Validate the plugin can be removed
      const validation = manager.validateRemove(pluginName);
      if (!validation.valid) {
        logger.error(`Cannot remove plugin "${pluginName}":`);
        validation.errors.forEach(error => logger.error(`  ${error}`));
        process.exit(1);
      }

      // Check for dependents before removal (Requirements: 3.5)
      const dependents = manager.getDependents(pluginName);
      if (dependents.length > 0) {
        logger.error(`Cannot remove "${pluginName}": the following plugins depend on it:`);
        dependents.forEach(dependent => {
          const depPlugin = registry.get(dependent);
          logger.error(`  ${depPlugin?.displayName || dependent} (${dependent})`);
        });
        logger.info('Remove the dependent plugins first, or use "scaforge remove" on them.');
        process.exit(1);
      }

      // Show plugin information
      logger.info(`Removing ${plugin.displayName} (${plugin.name})`);
      logger.log(`  Category: ${plugin.category}`);
      logger.log(`  Description: ${plugin.description}`);

      // Confirm removal unless --yes flag is used
      if (!options.yes) {
        logger.warn('This will remove the plugin configuration and may require manual cleanup of generated files.');
        const confirmed = await promptConfirm('Continue with removal?');
        if (!confirmed) {
          logger.warn('Removal cancelled.');
          process.exit(0);
        }
      }

      // Remove the plugin
      await withSpinner(
        `Removing ${plugin.displayName}...`,
        async () => {
          const result = await manager.remove(pluginName);
          
          // Save updated configuration
          await saveConfig(projectRoot, manager.getConfig());
          
          return result;
        },
        {
          successText: `${plugin.displayName} removed successfully!`,
          failText: `Failed to remove ${plugin.displayName}`,
        }
      );

      logger.newLine();
      logger.success('Plugin removed successfully!');
      logger.info('Note: You may need to manually remove generated files and dependencies.');
      
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message);
      } else {
        logger.error('An unexpected error occurred');
      }
      process.exit(1);
    }
  });
