/**
 * Handlebars Template Helpers
 * Custom helpers for plugin template generation
 * 
 * Requirements: 42.1
 */
import type { HelperDelegate, HelperOptions } from 'handlebars';

/**
 * Type for Handlebars instance
 */
interface HandlebarsInstance {
  registerHelper(name: string, fn: HelperDelegate): void;
}

/**
 * Generator context type for helpers
 */
interface HelperContext {
  installedPlugins?: string[];
  template?: string;
  options?: Record<string, unknown>;
  config?: {
    name?: string;
    template?: string;
    plugins?: Record<string, { enabled?: boolean; options?: Record<string, unknown> }>;
    settings?: {
      generateExamples?: boolean;
      codeStyle?: {
        semicolons?: boolean;
        singleQuote?: boolean;
        tabWidth?: number;
      };
    };
  };
  plugin?: {
    name?: string;
    displayName?: string;
    category?: string;
  };
}

/**
 * Registers all custom Handlebars helpers
 * 
 * @param Handlebars - The Handlebars instance to register helpers on
 */
export function registerHelpers(Handlebars: HandlebarsInstance): void {
  // Register all helpers
  Handlebars.registerHelper('hasPlugin', hasPlugin);
  Handlebars.registerHelper('ifEquals', ifEquals);
  Handlebars.registerHelper('ifNotEquals', ifNotEquals);
  Handlebars.registerHelper('ifTemplate', ifTemplate);
  Handlebars.registerHelper('ifOption', ifOption);
  Handlebars.registerHelper('getOption', getOption);
  Handlebars.registerHelper('json', json);
  Handlebars.registerHelper('camelCase', camelCase);
  Handlebars.registerHelper('pascalCase', pascalCase);
  Handlebars.registerHelper('kebabCase', kebabCase);
  Handlebars.registerHelper('snakeCase', snakeCase);
  Handlebars.registerHelper('upperCase', upperCase);
  Handlebars.registerHelper('lowerCase', lowerCase);
  Handlebars.registerHelper('capitalize', capitalize);
  Handlebars.registerHelper('indent', indent);
  Handlebars.registerHelper('semicolon', semicolon);
  Handlebars.registerHelper('quote', quote);
}


/**
 * Checks if a plugin is installed
 * Usage: {{#if (hasPlugin 'db-prisma')}}...{{/if}}
 * 
 * @param pluginName - Name of the plugin to check
 * @param options - Handlebars options
 * @returns true if the plugin is in installedPlugins
 */
export function hasPlugin(
  this: HelperContext,
  pluginName: string,
  options: HelperOptions
): boolean {
  const context = options?.data?.root ?? this;
  const installedPlugins = context.installedPlugins ?? [];
  return installedPlugins.includes(pluginName);
}

/**
 * Conditional block if two values are equal
 * Usage: {{#ifEquals template 'nextjs'}}...{{else}}...{{/ifEquals}}
 * 
 * @param a - First value
 * @param b - Second value
 * @param options - Handlebars options
 * @returns Block content if equal
 */
export function ifEquals(
  this: HelperContext,
  a: unknown,
  b: unknown,
  options: HelperOptions
): string {
  if (a === b) {
    return options.fn(this);
  }
  return options.inverse ? options.inverse(this) : '';
}

/**
 * Conditional block if two values are not equal
 * Usage: {{#ifNotEquals template 'nextjs'}}...{{/ifNotEquals}}
 * 
 * @param a - First value
 * @param b - Second value
 * @param options - Handlebars options
 * @returns Block content if not equal
 */
export function ifNotEquals(
  this: HelperContext,
  a: unknown,
  b: unknown,
  options: HelperOptions
): string {
  if (a !== b) {
    return options.fn(this);
  }
  return options.inverse ? options.inverse(this) : '';
}

/**
 * Conditional block based on current template
 * Usage: {{#ifTemplate 'nextjs'}}...{{/ifTemplate}}
 * 
 * @param templateName - Template to check for
 * @param options - Handlebars options
 * @returns Block content if template matches
 */
export function ifTemplate(
  this: HelperContext,
  templateName: string,
  options: HelperOptions
): string {
  const context = options?.data?.root ?? this;
  if (context.template === templateName) {
    return options.fn(this);
  }
  return options.inverse ? options.inverse(this) : '';
}

/**
 * Conditional block based on plugin option value
 * Usage: {{#ifOption 'batching'}}...{{/ifOption}}
 * 
 * @param optionName - Option name to check
 * @param options - Handlebars options
 * @returns Block content if option is truthy
 */
export function ifOption(
  this: HelperContext,
  optionName: string,
  options: HelperOptions
): string {
  const context = options?.data?.root ?? this;
  const optionValue = context.options?.[optionName];
  if (optionValue) {
    return options.fn(this);
  }
  return options.inverse ? options.inverse(this) : '';
}

/**
 * Gets a plugin option value
 * Usage: {{getOption 'transformer' 'superjson'}}
 * 
 * @param optionName - Option name to get
 * @param defaultValue - Default value if option not set
 * @param options - Handlebars options
 * @returns Option value or default
 */
export function getOption(
  this: HelperContext,
  optionName: string,
  defaultValue: unknown,
  options: HelperOptions
): unknown {
  const context = options?.data?.root ?? this;
  const optionValue = context.options?.[optionName];
  return optionValue !== undefined ? optionValue : defaultValue;
}

/**
 * Converts a value to JSON string
 * Usage: {{json options}}
 * 
 * @param value - Value to stringify
 * @param indent - Indentation (default: 2)
 * @returns JSON string
 */
export function json(value: unknown, indentArg?: number | HelperOptions): string {
  const indentValue = typeof indentArg === 'number' ? indentArg : 2;
  return JSON.stringify(value, null, indentValue);
}

/**
 * Converts string to camelCase
 * Usage: {{camelCase 'my-plugin-name'}} -> myPluginName
 * 
 * @param str - String to convert
 * @returns camelCase string
 */
export function camelCase(str: string): string {
  if (!str) return '';
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toLowerCase());
}

/**
 * Converts string to PascalCase
 * Usage: {{pascalCase 'my-plugin-name'}} -> MyPluginName
 * 
 * @param str - String to convert
 * @returns PascalCase string
 */
export function pascalCase(str: string): string {
  if (!str) return '';
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase());
}

/**
 * Converts string to kebab-case
 * Usage: {{kebabCase 'MyPluginName'}} -> my-plugin-name
 * 
 * @param str - String to convert
 * @returns kebab-case string
 */
export function kebabCase(str: string): string {
  if (!str) return '';
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Converts string to snake_case
 * Usage: {{snakeCase 'MyPluginName'}} -> my_plugin_name
 * 
 * @param str - String to convert
 * @returns snake_case string
 */
export function snakeCase(str: string): string {
  if (!str) return '';
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

/**
 * Converts string to UPPER_CASE
 * Usage: {{upperCase 'myVar'}} -> MYVAR
 * 
 * @param str - String to convert
 * @returns UPPER_CASE string
 */
export function upperCase(str: string): string {
  if (!str) return '';
  return str.toUpperCase();
}

/**
 * Converts string to lower case
 * Usage: {{lowerCase 'MyVar'}} -> myvar
 * 
 * @param str - String to convert
 * @returns lower case string
 */
export function lowerCase(str: string): string {
  if (!str) return '';
  return str.toLowerCase();
}

/**
 * Capitalizes first letter
 * Usage: {{capitalize 'hello'}} -> Hello
 * 
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Indents each line of a string
 * Usage: {{indent content 2}}
 * 
 * @param str - String to indent
 * @param spaces - Number of spaces (default: 2)
 * @returns Indented string
 */
export function indent(str: string, spaces?: number | HelperOptions): string {
  if (!str) return '';
  const indentSpaces = typeof spaces === 'number' ? spaces : 2;
  const indentStr = ' '.repeat(indentSpaces);
  return str
    .split('\n')
    .map(line => (line.trim() ? indentStr + line : line))
    .join('\n');
}

/**
 * Returns semicolon based on code style settings
 * Usage: {{semicolon}}
 * 
 * @param options - Handlebars options
 * @returns ';' or ''
 */
export function semicolon(this: HelperContext, options: HelperOptions): string {
  const context = options?.data?.root ?? this;
  const useSemicolons = context.config?.settings?.codeStyle?.semicolons;
  return useSemicolons !== false ? ';' : '';
}

/**
 * Returns appropriate quote character based on code style settings
 * Usage: {{quote}}
 * 
 * @param options - Handlebars options
 * @returns "'" or '"'
 */
export function quote(this: HelperContext, options: HelperOptions): string {
  const context = options?.data?.root ?? this;
  const useSingleQuote = context.config?.settings?.codeStyle?.singleQuote;
  return useSingleQuote !== false ? "'" : '"';
}
