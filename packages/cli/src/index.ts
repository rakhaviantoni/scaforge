#!/usr/bin/env node
/**
 * @scaforge/cli
 * CLI for Scaforge - create and manage Scaforge projects
 * 
 * Usage:
 *   npx scaforge init           - Create a new project
 *   npx scaforge add <plugin>   - Add a plugin
 *   npx scaforge remove <plugin> - Remove a plugin
 *   npx scaforge list           - List available plugins
 *   npx scaforge update         - Update plugins
 */
import { Command } from 'commander';
import chalk from 'chalk';
import {
  initCommand,
  addCommand,
  removeCommand,
  listCommand,
  updateCommand,
} from './commands';

// Package version - will be replaced during build
const VERSION = '0.0.1';

/**
 * Create and configure the main CLI program
 */
function createProgram(): Command {
  const program = new Command();

  program
    .name('scaforge')
    .description('Scaforge - Modular full-stack boilerplate ecosystem')
    .version(VERSION, '-v, --version', 'Display version number');

  // Register commands
  program.addCommand(initCommand);
  program.addCommand(addCommand);
  program.addCommand(removeCommand);
  program.addCommand(listCommand);
  program.addCommand(updateCommand);

  // Custom help
  program.addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.dim('$')} scaforge init                    ${chalk.dim('# Create a new project interactively')}
  ${chalk.dim('$')} scaforge init -t nextjs -n myapp ${chalk.dim('# Create Next.js project named "myapp"')}
  ${chalk.dim('$')} scaforge add api-trpc            ${chalk.dim('# Add tRPC to your project')}
  ${chalk.dim('$')} scaforge add                     ${chalk.dim('# Browse and select plugins interactively')}
  ${chalk.dim('$')} scaforge list                    ${chalk.dim('# List all available plugins')}
  ${chalk.dim('$')} scaforge list --installed        ${chalk.dim('# List installed plugins')}
  ${chalk.dim('$')} scaforge remove api-trpc         ${chalk.dim('# Remove tRPC from your project')}
  ${chalk.dim('$')} scaforge update                  ${chalk.dim('# Update all plugins')}

${chalk.bold('Documentation:')}
  ${chalk.cyan('https://scaforge.dev/docs')}
`);

  return program;
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const program = createProgram();

  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red('Error:'), error.message);
    } else {
      console.error(chalk.red('An unexpected error occurred'));
    }
    process.exit(1);
  }
}

// Run CLI
main();

// Export for programmatic usage
export { createProgram };
export * from './commands';
export * from './utils';
