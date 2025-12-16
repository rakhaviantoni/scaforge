/**
 * Environment Variable Utilities
 * Functions for managing .env.example files
 * 
 * Requirements: 40.3
 */
import fs from 'fs-extra';
import path from 'path';
import type { EnvVarDefinition } from '../plugin-system/types';

const ENV_EXAMPLE_FILE = '.env.example';

/**
 * Represents a parsed environment variable entry
 */
export interface EnvEntry {
  /** Variable name */
  name: string;
  /** Variable value (empty string for placeholders) */
  value: string;
  /** Comment/description above the variable */
  comment?: string;
  /** Plugin that added this variable */
  plugin?: string;
}

/**
 * Parses an .env.example file into structured entries
 */
export function parseEnvFile(content: string): EnvEntry[] {
  const entries: EnvEntry[] = [];
  const lines = content.split('\n');
  let currentComment: string | undefined;
  let currentPlugin: string | undefined;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check for plugin marker comment
    if (trimmed.startsWith('# @scaforge/')) {
      currentPlugin = trimmed.replace('# @scaforge/', '').trim();
      continue;
    }
    
    // Check for regular comment
    if (trimmed.startsWith('#')) {
      currentComment = trimmed.substring(1).trim();
      continue;
    }
    
    // Check for variable assignment
    if (trimmed.includes('=')) {
      const [name, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      
      if (name) {
        entries.push({
          name: name.trim(),
          value: value.trim(),
          comment: currentComment,
          plugin: currentPlugin,
        });
      }
      
      currentComment = undefined;
    }
  }
  
  return entries;
}


/**
 * Serializes environment entries back to .env format
 */
export function serializeEnvFile(entries: EnvEntry[]): string {
  const lines: string[] = [];
  let currentPlugin: string | undefined;
  
  for (const entry of entries) {
    // Add plugin section header if changed
    if (entry.plugin && entry.plugin !== currentPlugin) {
      if (lines.length > 0) {
        lines.push(''); // Add blank line before new section
      }
      lines.push(`# @scaforge/${entry.plugin}`);
      currentPlugin = entry.plugin;
    }
    
    // Add comment if present
    if (entry.comment) {
      lines.push(`# ${entry.comment}`);
    }
    
    // Add variable
    lines.push(`${entry.name}=${entry.value}`);
  }
  
  return lines.join('\n') + '\n';
}

/**
 * Converts EnvVarDefinition to EnvEntry
 */
function envVarToEntry(envVar: EnvVarDefinition, pluginName: string): EnvEntry {
  let description = envVar.description;
  if (envVar.required) {
    description += ' (required)';
  }
  if (envVar.secret) {
    description += ' [secret]';
  }
  
  return {
    name: envVar.name,
    value: envVar.default || '',
    comment: description,
    plugin: pluginName,
  };
}

/**
 * Updates .env.example with environment variables from a plugin
 * 
 * @param projectRoot - The root directory of the project
 * @param pluginName - The name of the plugin adding variables
 * @param envVars - The environment variables to add
 */
export async function updateEnvExample(
  projectRoot: string,
  pluginName: string,
  envVars: EnvVarDefinition[]
): Promise<void> {
  if (!envVars || envVars.length === 0) {
    return;
  }
  
  const envPath = path.join(projectRoot, ENV_EXAMPLE_FILE);
  
  // Load existing content or start fresh
  let entries: EnvEntry[] = [];
  if (await fs.pathExists(envPath)) {
    const content = await fs.readFile(envPath, 'utf-8');
    entries = parseEnvFile(content);
  }
  
  // Convert new env vars to entries
  const newEntries = envVars.map(v => envVarToEntry(v, pluginName));
  
  // Add new entries (avoid duplicates)
  for (const newEntry of newEntries) {
    const existingIndex = entries.findIndex(e => e.name === newEntry.name);
    if (existingIndex >= 0) {
      // Update existing entry
      entries[existingIndex] = newEntry;
    } else {
      // Add new entry
      entries.push(newEntry);
    }
  }
  
  // Sort entries by plugin, then by name
  entries.sort((a, b) => {
    if (a.plugin !== b.plugin) {
      // Entries without plugin come first
      if (!a.plugin) return -1;
      if (!b.plugin) return 1;
      return a.plugin.localeCompare(b.plugin);
    }
    return a.name.localeCompare(b.name);
  });
  
  // Write back
  const content = serializeEnvFile(entries);
  await fs.writeFile(envPath, content, 'utf-8');
}

/**
 * Removes environment variables for a plugin from .env.example
 * 
 * @param projectRoot - The root directory of the project
 * @param pluginName - The name of the plugin to remove variables for
 */
export async function removeEnvVars(
  projectRoot: string,
  pluginName: string
): Promise<string[]> {
  const envPath = path.join(projectRoot, ENV_EXAMPLE_FILE);
  
  if (!(await fs.pathExists(envPath))) {
    return [];
  }
  
  const content = await fs.readFile(envPath, 'utf-8');
  const entries = parseEnvFile(content);
  
  // Find entries to remove
  const removedVars = entries
    .filter(e => e.plugin === pluginName)
    .map(e => e.name);
  
  // Filter out plugin entries
  const remainingEntries = entries.filter(e => e.plugin !== pluginName);
  
  // Write back
  const newContent = serializeEnvFile(remainingEntries);
  await fs.writeFile(envPath, newContent, 'utf-8');
  
  return removedVars;
}

/**
 * Gets all environment variables for a specific plugin
 * 
 * @param projectRoot - The root directory of the project
 * @param pluginName - The name of the plugin
 */
export async function getPluginEnvVars(
  projectRoot: string,
  pluginName: string
): Promise<EnvEntry[]> {
  const envPath = path.join(projectRoot, ENV_EXAMPLE_FILE);
  
  if (!(await fs.pathExists(envPath))) {
    return [];
  }
  
  const content = await fs.readFile(envPath, 'utf-8');
  const entries = parseEnvFile(content);
  
  return entries.filter(e => e.plugin === pluginName);
}

/**
 * Checks if all required environment variables are set
 * 
 * @param projectRoot - The root directory of the project
 * @param envVars - The environment variable definitions to check
 * @returns List of missing required variables
 */
export async function checkRequiredEnvVars(
  projectRoot: string,
  envVars: EnvVarDefinition[]
): Promise<string[]> {
  const envPath = path.join(projectRoot, '.env');
  const missing: string[] = [];
  
  // Load .env file if it exists
  let envContent = '';
  if (await fs.pathExists(envPath)) {
    envContent = await fs.readFile(envPath, 'utf-8');
  }
  
  const entries = parseEnvFile(envContent);
  const envMap = new Map(entries.map(e => [e.name, e.value]));
  
  for (const envVar of envVars) {
    if (envVar.required) {
      const value = envMap.get(envVar.name);
      if (!value || value.trim() === '') {
        missing.push(envVar.name);
      }
    }
  }
  
  return missing;
}
