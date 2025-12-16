/**
 * @scaforge/core - Error Handling
 * Custom error types and user-friendly error formatting for Scaforge
 */

/**
 * Error codes for all Scaforge errors
 */
export type ErrorCode =
  | 'PLUGIN_NOT_FOUND'
  | 'PLUGIN_CONFLICT'
  | 'PLUGIN_DEPENDENCY_MISSING'
  | 'PLUGIN_HAS_DEPENDENTS'
  | 'TEMPLATE_NOT_SUPPORTED'
  | 'CONFIG_INVALID'
  | 'CONFIG_NOT_FOUND'
  | 'FILE_EXISTS'
  | 'INSTALL_FAILED'
  | 'NETWORK_ERROR';

/**
 * Details type for error context
 */
export interface ErrorDetails {
  name?: string;
  conflict?: string;
  dependency?: string;
  dependents?: string[];
  template?: string;
  details?: string;
  path?: string;
  [key: string]: unknown;
}

/**
 * Custom error class for Scaforge operations
 */
export class ScaforgeError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: ErrorDetails;

  constructor(
    message: string,
    code: ErrorCode,
    details?: ErrorDetails
  ) {
    super(message);
    this.name = 'ScaforgeError';
    this.code = code;
    this.details = details;
    
    // Maintains proper stack trace for where error was thrown (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ScaforgeError);
    }
  }
}


/**
 * Error message templates for user-friendly error formatting
 */
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  PLUGIN_NOT_FOUND: 'Plugin "{name}" not found in registry',
  PLUGIN_CONFLICT: 'Plugin "{name}" conflicts with installed plugin "{conflict}"',
  PLUGIN_DEPENDENCY_MISSING: 'Plugin "{name}" requires "{dependency}" to be installed first',
  PLUGIN_HAS_DEPENDENTS: 'Cannot remove "{name}": {dependents} depend on it',
  TEMPLATE_NOT_SUPPORTED: 'Plugin "{name}" does not support {template} template',
  CONFIG_INVALID: 'Invalid configuration: {details}',
  CONFIG_NOT_FOUND: 'scaforge.config.ts not found. Is this a Scaforge project?',
  FILE_EXISTS: 'File already exists: {path}',
  INSTALL_FAILED: 'Failed to install packages: {details}',
  NETWORK_ERROR: 'Network error: {details}',
};

/**
 * Formats an error message by replacing placeholders with actual values
 * @param template - The message template with {placeholder} syntax
 * @param details - The details object containing replacement values
 * @returns The formatted message string
 */
function formatMessage(template: string, details?: ErrorDetails): string {
  if (!details) return template;
  
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = details[key];
    if (value === undefined) return match;
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  });
}

/**
 * Creates a user-friendly error message for a given error code
 * @param code - The error code
 * @param details - Optional details for message formatting
 * @returns The formatted error message
 */
export function getErrorMessage(code: ErrorCode, details?: ErrorDetails): string {
  const template = ERROR_MESSAGES[code];
  return formatMessage(template, details);
}

/**
 * Creates a ScaforgeError with a formatted message
 * @param code - The error code
 * @param details - Optional details for message formatting and context
 * @returns A new ScaforgeError instance
 */
export function createError(code: ErrorCode, details?: ErrorDetails): ScaforgeError {
  const message = getErrorMessage(code, details);
  return new ScaforgeError(message, code, details);
}

/**
 * Type guard to check if an error is a ScaforgeError
 * @param error - The error to check
 * @returns True if the error is a ScaforgeError
 */
export function isScaforgeError(error: unknown): error is ScaforgeError {
  return error instanceof ScaforgeError;
}

/**
 * Formats a ScaforgeError for display to the user
 * @param error - The ScaforgeError to format
 * @returns A formatted string for user display
 */
export function formatErrorForDisplay(error: ScaforgeError): string {
  const lines: string[] = [
    `Error [${error.code}]: ${error.message}`,
  ];
  
  if (error.details) {
    const relevantDetails = Object.entries(error.details)
      .filter(([key]) => !['name', 'conflict', 'dependency', 'dependents', 'template', 'details', 'path'].includes(key))
      .map(([key, value]) => `  ${key}: ${JSON.stringify(value)}`);
    
    if (relevantDetails.length > 0) {
      lines.push('Additional details:');
      lines.push(...relevantDetails);
    }
  }
  
  return lines.join('\n');
}
