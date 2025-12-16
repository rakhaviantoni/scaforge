/**
 * Configuration Loader
 * Functions for loading and saving Scaforge configuration files
 * 
 * Requirements: 40.1, 40.3
 */
import fs from 'fs-extra';
import path from 'path';
import { ScaforgeConfig, scaforgeConfigSchema } from './types';

/** Default config file name */
export const CONFIG_FILE_NAME = 'scaforge.config.ts';

/** Default env example file name */
export const ENV_EXAMPLE_FILE_NAME = '.env.example';

/**
 * Loads and parses the Scaforge configuration from a project
 * 
 * @param projectRoot - Path to the project root directory
 * @returns Parsed and validated ScaforgeConfig
 * @throws Error if config file not found or invalid
 */
export function loadConfig(projectRoot: string): ScaforgeConfig {
  const configPath = path.join(projectRoot, CONFIG_FILE_NAME);
  
  if (!fs.existsSync(configPath)) {
    throw new Error(`${CONFIG_FILE_NAME} not found. Is this a Scaforge project?`);
  }

  const content = fs.readFileSync(configPath, 'utf-8');
  const configObject = parseConfigContent(content);
  
  return scaforgeConfigSchema.parse(configObject);
}

/**
 * Parses the TypeScript config file content to extract the config object
 * 
 * @param content - Raw file content
 * @returns Parsed config object
 */
export function parseConfigContent(content: string): unknown {
  // Extract the config object from defineConfig() or export default
  // This is a simplified parser that handles common patterns
  
  // Pattern 1: defineConfig({ ... })
  const defineConfigMatch = content.match(/defineConfig\s*\(\s*(\{[\s\S]*\})\s*\)/);
  if (defineConfigMatch && defineConfigMatch[1]) {
    return parseObjectLiteral(defineConfigMatch[1]);
  }
  
  // Pattern 2: export default { ... }
  const exportDefaultMatch = content.match(/export\s+default\s+(\{[\s\S]*\})\s*;?\s*$/);
  if (exportDefaultMatch && exportDefaultMatch[1]) {
    return parseObjectLiteral(exportDefaultMatch[1]);
  }
  
  throw new Error('Could not parse config file. Expected defineConfig() or export default.');
}

/**
 * Parses a JavaScript/TypeScript object literal string to a JS object
 * Uses a safe JSON-like parsing approach
 * 
 * @param objectStr - Object literal string
 * @returns Parsed JavaScript object
 */
export function parseObjectLiteral(objectStr: string): unknown {
  // Clean up the string for JSON parsing
  let cleaned = objectStr
    // Remove trailing commas before closing brackets
    .replace(/,(\s*[}\]])/g, '$1')
    // Convert single quotes to double quotes (for string values)
    .replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '"$1"')
    // Handle unquoted keys
    .replace(/(\s*)(\w+)(\s*):/g, '$1"$2"$3:')
    // Remove duplicate quotes on already quoted keys
    .replace(/"+"(\w+)"+"/g, '"$1"');
  
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse config object. Ensure it uses valid JSON-compatible syntax.');
  }
}

/**
 * Saves the Scaforge configuration to a project
 * 
 * @param projectRoot - Path to the project root directory
 * @param config - Configuration to save
 */
export async function saveConfig(
  projectRoot: string,
  config: ScaforgeConfig
): Promise<void> {
  const configPath = path.join(projectRoot, CONFIG_FILE_NAME);
  const content = generateConfigFileContent(config);
  await fs.writeFile(configPath, content, 'utf-8');
}

/**
 * Generates the TypeScript config file content from a config object
 * 
 * @param config - Configuration object
 * @returns TypeScript file content
 */
export function generateConfigFileContent(config: ScaforgeConfig): string {
  const codeStyle = config.settings?.codeStyle;
  const indent = ' '.repeat(codeStyle?.tabWidth ?? 2);
  const quote = codeStyle?.singleQuote !== false ? "'" : '"';
  const semi = codeStyle?.semicolons !== false ? ';' : '';
  
  return `import { defineConfig } from '@scaforge/core'${semi}

export default defineConfig({
${indent}name: ${quote}${config.name}${quote},
${indent}template: ${quote}${config.template}${quote},
${indent}plugins: ${formatPlugins(config.plugins, indent, quote)},
${formatSettings(config.settings, indent)}})${semi}
`;
}

/**
 * Formats the plugins object for the config file
 */
function formatPlugins(
  plugins: ScaforgeConfig['plugins'],
  indent: string,
  quote: string
): string {
  const entries = Object.entries(plugins);
  
  if (entries.length === 0) {
    return '{}';
  }
  
  const lines = entries.map(([name, config]) => {
    const optionsStr = config.options && Object.keys(config.options).length > 0
      ? `,\n${indent}${indent}${indent}options: ${JSON.stringify(config.options)}`
      : '';
    return `${indent}${indent}${quote}${name}${quote}: {\n${indent}${indent}${indent}enabled: ${config.enabled}${optionsStr}\n${indent}${indent}}`;
  });
  
  return `{\n${lines.join(',\n')}\n${indent}}`;
}

/**
 * Formats the settings object for the config file
 */
function formatSettings(
  settings: ScaforgeConfig['settings'],
  indent: string
): string {
  if (!settings) {
    return '';
  }
  
  const parts: string[] = [];
  
  if (settings.generateExamples !== undefined) {
    parts.push(`${indent}${indent}generateExamples: ${settings.generateExamples}`);
  }
  
  if (settings.codeStyle) {
    const styleLines: string[] = [];
    if (settings.codeStyle.semicolons !== undefined) {
      styleLines.push(`${indent}${indent}${indent}semicolons: ${settings.codeStyle.semicolons}`);
    }
    if (settings.codeStyle.singleQuote !== undefined) {
      styleLines.push(`${indent}${indent}${indent}singleQuote: ${settings.codeStyle.singleQuote}`);
    }
    if (settings.codeStyle.tabWidth !== undefined) {
      styleLines.push(`${indent}${indent}${indent}tabWidth: ${settings.codeStyle.tabWidth}`);
    }
    if (styleLines.length > 0) {
      parts.push(`${indent}${indent}codeStyle: {\n${styleLines.join(',\n')}\n${indent}${indent}}`);
    }
  }
  
  if (parts.length === 0) {
    return '';
  }
  
  return `${indent}settings: {\n${parts.join(',\n')}\n${indent}},\n`;
}

/**
 * Checks if a Scaforge config file exists in the given directory
 * 
 * @param projectRoot - Path to check
 * @returns true if config exists
 */
export function configExists(projectRoot: string): boolean {
  return fs.existsSync(path.join(projectRoot, CONFIG_FILE_NAME));
}

/**
 * Serializes a config object to a JSON-compatible string
 * Used for round-trip testing
 * 
 * @param config - Configuration to serialize
 * @returns JSON string representation
 */
export function serializeConfig(config: ScaforgeConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * Deserializes a JSON string to a config object
 * Used for round-trip testing
 * 
 * @param json - JSON string
 * @returns Parsed and validated config
 */
export function deserializeConfig(json: string): ScaforgeConfig {
  const parsed = JSON.parse(json);
  return scaforgeConfigSchema.parse(parsed);
}
