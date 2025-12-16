/**
 * NPM Utilities
 * Functions for installing and uninstalling npm packages
 * 
 * Requirements: 3.1
 */
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import type { PluginPackages } from '../plugin-system/types';

/**
 * Detects the package manager used in the project
 */
export function detectPackageManager(projectRoot: string): 'npm' | 'yarn' | 'pnpm' {
  if (fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  if (fs.existsSync(path.join(projectRoot, 'yarn.lock'))) {
    return 'yarn';
  }
  return 'npm';
}

/**
 * Gets the install command for the detected package manager
 */
function getInstallCommand(
  packageManager: 'npm' | 'yarn' | 'pnpm',
  packages: string[],
  isDev: boolean
): string {
  const packagesStr = packages.join(' ');
  
  switch (packageManager) {
    case 'pnpm':
      return `pnpm add ${isDev ? '-D ' : ''}${packagesStr}`;
    case 'yarn':
      return `yarn add ${isDev ? '-D ' : ''}${packagesStr}`;
    case 'npm':
    default:
      return `npm install ${isDev ? '--save-dev ' : ''}${packagesStr}`;
  }
}

/**
 * Gets the uninstall command for the detected package manager
 */
function getUninstallCommand(
  packageManager: 'npm' | 'yarn' | 'pnpm',
  packages: string[]
): string {
  const packagesStr = packages.join(' ');
  
  switch (packageManager) {
    case 'pnpm':
      return `pnpm remove ${packagesStr}`;
    case 'yarn':
      return `yarn remove ${packagesStr}`;
    case 'npm':
    default:
      return `npm uninstall ${packagesStr}`;
  }
}


/**
 * Formats packages with versions for installation
 */
function formatPackagesWithVersions(packages: Record<string, string>): string[] {
  return Object.entries(packages).map(([name, version]) => `${name}@${version}`);
}

/**
 * Installs npm packages for a plugin
 * 
 * @param projectRoot - The root directory of the project
 * @param packages - The packages to install (dependencies and devDependencies)
 * @throws Error if installation fails
 */
export async function installPackages(
  projectRoot: string,
  packages: PluginPackages
): Promise<void> {
  const packageManager = detectPackageManager(projectRoot);
  
  // Install production dependencies
  if (packages.dependencies && Object.keys(packages.dependencies).length > 0) {
    const deps = formatPackagesWithVersions(packages.dependencies);
    const command = getInstallCommand(packageManager, deps, false);
    
    execSync(command, {
      cwd: projectRoot,
      stdio: 'inherit',
    });
  }
  
  // Install dev dependencies
  if (packages.devDependencies && Object.keys(packages.devDependencies).length > 0) {
    const devDeps = formatPackagesWithVersions(packages.devDependencies);
    const command = getInstallCommand(packageManager, devDeps, true);
    
    execSync(command, {
      cwd: projectRoot,
      stdio: 'inherit',
    });
  }
}

/**
 * Uninstalls npm packages
 * 
 * @param projectRoot - The root directory of the project
 * @param packages - The packages to uninstall (dependencies and devDependencies)
 * @throws Error if uninstallation fails
 */
export async function uninstallPackages(
  projectRoot: string,
  packages: PluginPackages
): Promise<void> {
  const packageManager = detectPackageManager(projectRoot);
  
  // Collect all package names (both deps and devDeps)
  const allPackages: string[] = [
    ...Object.keys(packages.dependencies || {}),
    ...Object.keys(packages.devDependencies || {}),
  ];
  
  if (allPackages.length === 0) {
    return;
  }
  
  const command = getUninstallCommand(packageManager, allPackages);
  
  execSync(command, {
    cwd: projectRoot,
    stdio: 'inherit',
  });
}

/**
 * Checks if a package is installed in the project
 * 
 * @param projectRoot - The root directory of the project
 * @param packageName - The name of the package to check
 * @returns true if the package is installed
 */
export function isPackageInstalled(
  projectRoot: string,
  packageName: string
): boolean {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }
  
  const packageJson = fs.readJsonSync(packageJsonPath);
  
  return (
    (packageJson.dependencies && packageName in packageJson.dependencies) ||
    (packageJson.devDependencies && packageName in packageJson.devDependencies)
  );
}

/**
 * Gets the installed version of a package
 * 
 * @param projectRoot - The root directory of the project
 * @param packageName - The name of the package
 * @returns The installed version or undefined if not installed
 */
export function getInstalledVersion(
  projectRoot: string,
  packageName: string
): string | undefined {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    return undefined;
  }
  
  const packageJson = fs.readJsonSync(packageJsonPath);
  
  return (
    packageJson.dependencies?.[packageName] ||
    packageJson.devDependencies?.[packageName]
  );
}
