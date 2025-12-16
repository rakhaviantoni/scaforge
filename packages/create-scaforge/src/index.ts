#!/usr/bin/env node
/**
 * create-scaforge
 * Create a new Scaforge project with npx create-scaforge
 * 
 * This package serves as the npx entry point for creating new Scaforge projects.
 * It delegates all functionality to @scaforge/cli's init command.
 * 
 * Usage:
 *   npx create-scaforge                    # Interactive mode
 *   npx create-scaforge my-app             # Create project named "my-app"
 *   npx create-scaforge my-app -t nextjs   # Create Next.js project
 *   npx create-scaforge --help             # Show help
 * 
 * Requirements: 2.1
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

/**
 * Get the path to the scaforge CLI binary
 */
function getScaforgeCLIPath(): string {
  // In development/monorepo, the CLI is in a sibling package
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  
  // Try to find the CLI in node_modules (installed dependency)
  const cliPath = path.resolve(__dirname, '../node_modules/@scaforge/cli/dist/index.js');
  
  return cliPath;
}

/**
 * Parse command line arguments and convert to init command format
 * 
 * create-scaforge accepts:
 *   npx create-scaforge [project-name] [options]
 * 
 * Which maps to:
 *   scaforge init --name [project-name] [options]
 */
function parseArgs(args: string[]): string[] {
  const initArgs: string[] = ['init'];
  
  // Skip node and script path (first two args)
  const userArgs = args.slice(2);
  
  // Check if first arg is a project name (not a flag)
  if (userArgs.length > 0 && !userArgs[0]!.startsWith('-')) {
    initArgs.push('--name', userArgs[0]!);
    // Add remaining args
    initArgs.push(...userArgs.slice(1));
  } else {
    // All args are flags, pass them through
    initArgs.push(...userArgs);
  }
  
  return initArgs;
}

/**
 * Run the scaforge CLI init command
 */
async function main(): Promise<void> {
  const cliPath = getScaforgeCLIPath();
  const initArgs = parseArgs(process.argv);
  
  // Spawn the CLI process with the init command
  const child = spawn('node', [cliPath, ...initArgs], {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  
  // Handle process exit
  child.on('close', (code) => {
    process.exit(code ?? 0);
  });
  
  // Handle errors
  child.on('error', (error) => {
    console.error('Failed to start scaforge CLI:', error.message);
    process.exit(1);
  });
}

// Run the main function
main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});

export { parseArgs, getScaforgeCLIPath };
