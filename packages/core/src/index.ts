/**
 * @scaforge/core
 * Core utilities and plugin system for Scaforge
 */

// Plugin System
export * from './plugin-system/types';
export * from './plugin-system/registry';
export * from './plugin-system/manager';

// Configuration
export * from './config';

// Code Generation
export * from './codegen';

// Integration Engine
export * from './integrations';

// Error Handling
export * from './errors';

// Utilities
export * from './utils';

// Testing Utilities
export * from './testing';

// Documentation Generation
export * from './docs';

// Register sample plugins
import { registry } from './plugin-system/registry';
import { samplePlugins } from './plugin-system/sample-plugins';

// Auto-register sample plugins when the core module is imported
samplePlugins.forEach(plugin => registry.register(plugin));
