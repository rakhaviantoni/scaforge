/**
 * Configuration System Types
 * Zod schemas and types for Scaforge project configuration
 * 
 * Requirements: 40.1, 40.2
 */
import { z } from 'zod';

/**
 * Framework template enum schema
 */
export const frameworkTemplateSchema = z.enum(['nextjs', 'tanstack', 'nuxt', 'hydrogen']);

/**
 * Plugin configuration schema
 */
export const pluginConfigSchema = z.object({
  /** Whether the plugin is enabled */
  enabled: z.boolean(),
  /** Plugin-specific options */
  options: z.record(z.unknown()).optional(),
});

/**
 * Code style preferences schema
 */
export const codeStyleSchema = z.object({
  /** Use semicolons */
  semicolons: z.boolean().default(true),
  /** Use single quotes */
  singleQuote: z.boolean().default(true),
  /** Tab width for indentation */
  tabWidth: z.number().int().min(1).max(8).default(2),
});

/**
 * Global settings schema
 */
export const settingsSchema = z.object({
  /** Generate example code when adding plugins */
  generateExamples: z.boolean().default(true),
  /** Code style preferences */
  codeStyle: codeStyleSchema.optional(),
});

/**
 * Main Scaforge configuration schema
 * Validates the structure of scaforge.config.ts
 */
export const scaforgeConfigSchema = z.object({
  /** Project name */
  name: z.string().min(1).max(214), // npm package name limit
  
  /** Framework template used */
  template: frameworkTemplateSchema,
  
  /** Installed plugins and their configuration */
  plugins: z.record(pluginConfigSchema),
  
  /** Global settings */
  settings: settingsSchema.optional(),
});

/**
 * Inferred TypeScript type from the schema
 */
export type ScaforgeConfig = z.infer<typeof scaforgeConfigSchema>;

/**
 * Plugin configuration type
 */
export type PluginConfig = z.infer<typeof pluginConfigSchema>;

/**
 * Code style type
 */
export type CodeStyle = z.infer<typeof codeStyleSchema>;

/**
 * Settings type
 */
export type Settings = z.infer<typeof settingsSchema>;

/**
 * Framework template type (re-exported for convenience)
 */
export type FrameworkTemplateConfig = z.infer<typeof frameworkTemplateSchema>;

/**
 * Helper function to define a config with type safety
 * Used in scaforge.config.ts files
 */
export function defineConfig(config: ScaforgeConfig): ScaforgeConfig {
  return scaforgeConfigSchema.parse(config);
}

/**
 * Creates a default configuration for a new project
 */
export function createDefaultConfig(
  name: string,
  template: FrameworkTemplateConfig
): ScaforgeConfig {
  return {
    name,
    template,
    plugins: {},
    settings: {
      generateExamples: true,
      codeStyle: {
        semicolons: true,
        singleQuote: true,
        tabWidth: 2,
      },
    },
  };
}
