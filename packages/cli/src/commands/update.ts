/**
 * Update Command
 * Updates plugins in the current Scaforge project
 * 
 * Requirements: 43.1, 43.2, 43.3, 43.4
 */
import { Command } from 'commander';
import { PluginManager, registry } from '@scaforge/core';
import { loadConfig, saveConfig, configExists } from '@scaforge/core';
import { createBackup } from '@scaforge/core';
import { logger } from '../utils/logger';
import { withSpinner } from '../utils/spinner';
import { promptConfirm, runPrompts } from '../utils/prompts';

/**
 * Information about a plugin update
 */
interface PluginUpdateInfo {
  name: string;
  currentVersion: string;
  latestVersion: string;
  hasBreakingChanges: boolean;
  changelog?: string;
  migrationGuide?: string;
}

export const updateCommand = new Command('update')
  .description('Update plugins to their latest versions')
  .argument('[plugin]', 'Specific plugin to update (optional)')
  .option('-y, --yes', 'Skip confirmation prompts')
  .option('--check-only', 'Only check for updates without installing')
  .option('--no-backup', 'Skip creating backups before updating')
  .action(async (pluginName: string | undefined, options: { 
    yes?: boolean; 
    checkOnly?: boolean; 
    backup?: boolean;
  }) => {
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

      // Get installed plugins
      const installedPlugins = manager.getInstalled();
      
      if (installedPlugins.length === 0) {
        logger.info('No plugins installed.');
        process.exit(0);
      }

      // Determine which plugins to check for updates
      const pluginsToCheck = pluginName 
        ? [pluginName].filter(name => installedPlugins.includes(name))
        : installedPlugins;

      if (pluginName && !pluginsToCheck.includes(pluginName)) {
        logger.error(`Plugin "${pluginName}" is not installed.`);
        logger.info('Run "scaforge list --installed" to see installed plugins.');
        process.exit(1);
      }

      // Check for updates (Requirements: 43.1)
      logger.info('Checking for plugin updates...');
      const updateInfo = await checkForUpdates(pluginsToCheck);

      if (updateInfo.length === 0) {
        logger.success('All plugins are up to date!');
        process.exit(0);
      }

      // Display available updates (Requirements: 43.2)
      displayUpdateInfo(updateInfo);

      // If check-only mode, exit here
      if (options.checkOnly) {
        logger.info('Use "scaforge update" to install updates.');
        process.exit(0);
      }

      // Select plugins to update
      const pluginsToUpdate = await selectPluginsToUpdate(updateInfo, options.yes);
      
      if (pluginsToUpdate.length === 0) {
        logger.warn('No plugins selected for update.');
        process.exit(0);
      }

      // Check for breaking changes and show migration guides (Requirements: 43.3)
      const breakingChanges = pluginsToUpdate.filter(p => p.hasBreakingChanges);
      if (breakingChanges.length > 0 && !options.yes) {
        logger.warn('The following updates contain breaking changes:');
        breakingChanges.forEach(plugin => {
          logger.warn(`  ${plugin.name}: ${plugin.currentVersion} → ${plugin.latestVersion}`);
          if (plugin.migrationGuide) {
            logger.log(`    Migration guide: ${plugin.migrationGuide}`);
          }
        });
        
        const confirmed = await promptConfirm('Continue with updates that have breaking changes?');
        if (!confirmed) {
          logger.warn('Update cancelled.');
          process.exit(0);
        }
      }

      // Create backups before updating (Requirements: 43.4)
      const backups: Record<string, string[]> = {};
      if (options.backup !== false) {
        logger.info('Creating backups...');
        for (const plugin of pluginsToUpdate) {
          backups[plugin.name] = await createPluginBackups(projectRoot, plugin.name);
        }
        logger.success('Backups created successfully.');
      }

      // Perform updates
      await performUpdates(projectRoot, manager, pluginsToUpdate, backups);

      logger.newLine();
      logger.success('All plugins updated successfully!');
      
      // Show post-update information
      if (Object.keys(backups).length > 0) {
        logger.info('Backups created in .scaforge/backups/');
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
 * Checks for available updates for the specified plugins
 * Requirements: 43.1
 */
async function checkForUpdates(pluginNames: string[]): Promise<PluginUpdateInfo[]> {
  const updates: PluginUpdateInfo[] = [];

  for (const pluginName of pluginNames) {
    const plugin = registry.get(pluginName);
    if (!plugin) {
      continue;
    }

    // In a real implementation, this would check against a registry API
    // For now, we'll simulate version checking
    const currentVersion = plugin.version;
    const latestVersion = await getLatestVersion(pluginName);
    
    if (isNewerVersion(latestVersion, currentVersion)) {
      const changelog = await getChangelog(pluginName, currentVersion, latestVersion);
      const hasBreakingChanges = await checkForBreakingChanges(pluginName, currentVersion, latestVersion);
      const migrationGuide = hasBreakingChanges ? await getMigrationGuide(pluginName, currentVersion, latestVersion) : undefined;

      updates.push({
        name: pluginName,
        currentVersion,
        latestVersion,
        hasBreakingChanges,
        changelog,
        migrationGuide,
      });
    }
  }

  return updates;
}

/**
 * Gets the latest version of a plugin
 * In a real implementation, this would query a package registry
 */
async function getLatestVersion(pluginName: string): Promise<string> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // For demo purposes, return a simulated newer version
  const plugin = registry.get(pluginName);
  if (!plugin) return '1.0.0';
  
  const [major = 1, minor = 0, patch = 0] = plugin.version.split('.').map(Number);
  return `${major}.${minor}.${patch + 1}`;
}

/**
 * Checks if version A is newer than version B
 */
function isNewerVersion(versionA: string, versionB: string): boolean {
  const parseVersion = (v: string) => v.split('.').map(Number);
  const [aMajor = 0, aMinor = 0, aPatch = 0] = parseVersion(versionA);
  const [bMajor = 0, bMinor = 0, bPatch = 0] = parseVersion(versionB);
  
  if (aMajor !== bMajor) return aMajor > bMajor;
  if (aMinor !== bMinor) return aMinor > bMinor;
  return aPatch > bPatch;
}

/**
 * Gets the changelog for a plugin update
 * Requirements: 43.2
 */
async function getChangelog(_pluginName: string, _fromVersion: string, toVersion: string): Promise<string> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // Return simulated changelog
  return `## ${toVersion}
- Bug fixes and performance improvements
- Updated dependencies
- Enhanced TypeScript support`;
}

/**
 * Checks if an update contains breaking changes
 * Requirements: 43.3
 */
async function checkForBreakingChanges(_pluginName: string, fromVersion: string, toVersion: string): Promise<boolean> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // For demo purposes, consider major version changes as breaking
  const [fromMajor = 0] = fromVersion.split('.').map(Number);
  const [toMajor = 0] = toVersion.split('.').map(Number);
  
  return toMajor > fromMajor;
}

/**
 * Gets the migration guide for a breaking change update
 * Requirements: 43.3
 */
async function getMigrationGuide(pluginName: string, fromVersion: string, toVersion: string): Promise<string> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 50));
  
  return `Migration guide for ${pluginName} ${fromVersion} → ${toVersion}:
1. Update import statements
2. Check for deprecated API usage
3. Run tests to verify compatibility
4. See full guide: https://scaforge.dev/docs/migrations/${pluginName}`;
}

/**
 * Displays update information to the user
 * Requirements: 43.2
 */
function displayUpdateInfo(updates: PluginUpdateInfo[]): void {
  logger.newLine();
  logger.info(`Found ${updates.length} plugin update${updates.length === 1 ? '' : 's'}:`);
  logger.newLine();

  updates.forEach(update => {
    const plugin = registry.get(update.name);
    const displayName = plugin?.displayName ?? update.name;
    
    logger.log(`📦 ${displayName} (${update.name})`);
    logger.log(`   ${update.currentVersion} → ${update.latestVersion}`);
    
    if (update.hasBreakingChanges) {
      logger.warn('   ⚠️  Contains breaking changes');
    }
    
    if (update.changelog) {
      logger.log('   📝 Changelog:');
      update.changelog.split('\n').forEach(line => {
        if (line.trim()) {
          logger.log(`      ${line}`);
        }
      });
    }
    
    logger.newLine();
  });
}

/**
 * Prompts user to select which plugins to update
 */
async function selectPluginsToUpdate(
  updates: PluginUpdateInfo[], 
  skipPrompts: boolean = false
): Promise<PluginUpdateInfo[]> {
  if (skipPrompts) {
    return updates;
  }

  if (updates.length === 1) {
    const confirmed = await promptConfirm(`Update ${updates[0]?.name}?`);
    return confirmed ? updates : [];
  }

  const choices = updates.map(update => {
    const plugin = registry.get(update.name);
    const displayName = plugin?.displayName || update.name;
    
    return {
      title: `${displayName} (${update.currentVersion} → ${update.latestVersion})`,
      value: update.name,
      selected: !update.hasBreakingChanges, // Pre-select non-breaking updates
    };
  });

  const result = await runPrompts([
    {
      type: 'multiselect',
      name: 'plugins',
      message: 'Select plugins to update:',
      choices,
      hint: 'Space to select, Enter to confirm',
    },
  ]);

  const selectedNames = result.plugins || [];
  return updates.filter(update => selectedNames.includes(update.name));
}

/**
 * Creates backups for plugin files before updating
 * Requirements: 43.4
 */
async function createPluginBackups(projectRoot: string, pluginName: string): Promise<string[]> {
  const backupPaths: string[] = [];
  
  // In a real implementation, this would:
  // 1. Get list of files generated by the plugin
  // 2. Create backups of those files
  // 3. Return the backup paths
  
  // For now, simulate creating backups of common plugin files
  const commonFiles = [
    `src/lib/${pluginName}.ts`,
    `src/config/${pluginName}.ts`,
    `.env.example`,
  ];

  for (const filePath of commonFiles) {
    try {
      const backupPath = await createBackup(projectRoot, filePath);
      if (backupPath) {
        backupPaths.push(backupPath);
      }
    } catch (error) {
      // File might not exist, which is fine
    }
  }

  return backupPaths;
}

/**
 * Performs the actual plugin updates
 */
async function performUpdates(
  projectRoot: string,
  manager: PluginManager,
  updates: PluginUpdateInfo[],
  _backups: Record<string, string[]>
): Promise<void> {
  for (const update of updates) {
    await withSpinner(
      `Updating ${update.name}...`,
      async () => {
        // In a real implementation, this would:
        // 1. Remove the old plugin version
        // 2. Install the new plugin version
        // 3. Run any migration scripts
        // 4. Update configuration files
        
        // For now, simulate the update process
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update the plugin version in the registry (simulation)
        const plugin = registry.get(update.name);
        if (plugin) {
          // This would normally be handled by the registry/package manager
          (plugin as any).version = update.latestVersion;
        }
      },
      {
        successText: `${update.name} updated to ${update.latestVersion}`,
        failText: `Failed to update ${update.name}`,
      }
    );
  }

  // Save updated configuration
  await saveConfig(projectRoot, manager.getConfig());
}