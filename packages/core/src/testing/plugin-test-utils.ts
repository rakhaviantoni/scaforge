/**
 * Plugin Test Utilities Generator
 * Generates test mocks and utilities for each plugin type/category
 */
import type { 
  PluginDefinition, 
  PluginCategory, 
  FrameworkTemplate,
  PluginFile,
  EnvVarDefinition
} from '../plugin-system/types';
import { createMockPlugin, createMockPluginFile, createMockEnvVar } from './mocks';
import { ALL_PLUGIN_CATEGORIES, ALL_FRAMEWORK_TEMPLATES } from './helpers';

/**
 * Category-specific plugin templates with realistic defaults
 */
export interface CategoryPluginTemplate {
  category: PluginCategory;
  defaultPackages: Record<string, string>;
  defaultEnvVars: EnvVarDefinition[];
  defaultFiles: PluginFile[];
  supportedTemplates: FrameworkTemplate[];
}

/**
 * Plugin templates for each category
 */
export const CATEGORY_TEMPLATES: Record<PluginCategory, CategoryPluginTemplate> = {
  api: {
    category: 'api',
    defaultPackages: { 'api-client': '^1.0.0' },
    defaultEnvVars: [createMockEnvVar('API_URL', { required: true })],
    defaultFiles: [createMockPluginFile('src/lib/api.ts', '// API client setup')],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  cms: {
    category: 'cms',
    defaultPackages: { 'cms-client': '^1.0.0' },
    defaultEnvVars: [
      createMockEnvVar('CMS_PROJECT_ID', { required: true }),
      createMockEnvVar('CMS_API_KEY', { required: true, secret: true }),
    ],
    defaultFiles: [createMockPluginFile('src/lib/cms.ts', '// CMS client setup')],
    supportedTemplates: ['nextjs', 'tanstack', 'nuxt'],
  },
  auth: {
    category: 'auth',
    defaultPackages: { 'auth-provider': '^1.0.0' },
    defaultEnvVars: [
      createMockEnvVar('AUTH_SECRET', { required: true, secret: true }),
    ],
    defaultFiles: [
      createMockPluginFile('src/lib/auth.ts', '// Auth setup'),
      createMockPluginFile('src/middleware.ts', '// Auth middleware'),
    ],
    supportedTemplates: ['nextjs', 'tanstack'],
  },
  database: {
    category: 'database',
    defaultPackages: { 'db-client': '^1.0.0' },
    defaultEnvVars: [
      createMockEnvVar('DATABASE_URL', { required: true, secret: true }),
    ],
    defaultFiles: [
      createMockPluginFile('src/lib/db.ts', '// Database client'),
      createMockPluginFile('prisma/schema.prisma', '// Schema'),
    ],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  payments: {
    category: 'payments',
    defaultPackages: { 'payment-sdk': '^1.0.0' },
    defaultEnvVars: [
      createMockEnvVar('PAYMENT_API_KEY', { required: true, secret: true }),
      createMockEnvVar('PAYMENT_WEBHOOK_SECRET', { required: true, secret: true }),
    ],
    defaultFiles: [createMockPluginFile('src/lib/payments.ts', '// Payment setup')],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  email: {
    category: 'email',
    defaultPackages: { 'email-client': '^1.0.0' },
    defaultEnvVars: [
      createMockEnvVar('EMAIL_API_KEY', { required: true, secret: true }),
    ],
    defaultFiles: [createMockPluginFile('src/lib/email.ts', '// Email client')],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  storage: {
    category: 'storage',
    defaultPackages: { 'storage-sdk': '^1.0.0' },
    defaultEnvVars: [
      createMockEnvVar('STORAGE_BUCKET', { required: true }),
      createMockEnvVar('STORAGE_ACCESS_KEY', { required: true, secret: true }),
    ],
    defaultFiles: [createMockPluginFile('src/lib/storage.ts', '// Storage client')],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  analytics: {
    category: 'analytics',
    defaultPackages: { 'analytics-sdk': '^1.0.0' },
    defaultEnvVars: [
      createMockEnvVar('ANALYTICS_ID', { required: true }),
    ],
    defaultFiles: [createMockPluginFile('src/lib/analytics.ts', '// Analytics setup')],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  monitoring: {
    category: 'monitoring',
    defaultPackages: { 'monitoring-sdk': '^1.0.0' },
    defaultEnvVars: [
      createMockEnvVar('MONITORING_DSN', { required: true }),
    ],
    defaultFiles: [createMockPluginFile('src/lib/monitoring.ts', '// Monitoring setup')],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  caching: {
    category: 'caching',
    defaultPackages: { 'cache-client': '^1.0.0' },
    defaultEnvVars: [
      createMockEnvVar('CACHE_URL', { required: true }),
    ],
    defaultFiles: [createMockPluginFile('src/lib/cache.ts', '// Cache client')],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  jobs: {
    category: 'jobs',
    defaultPackages: { 'jobs-sdk': '^1.0.0' },
    defaultEnvVars: [
      createMockEnvVar('JOBS_API_KEY', { required: true, secret: true }),
    ],
    defaultFiles: [createMockPluginFile('src/lib/jobs.ts', '// Jobs setup')],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  search: {
    category: 'search',
    defaultPackages: { 'search-client': '^1.0.0' },
    defaultEnvVars: [
      createMockEnvVar('SEARCH_API_KEY', { required: true, secret: true }),
      createMockEnvVar('SEARCH_HOST', { required: true }),
    ],
    defaultFiles: [createMockPluginFile('src/lib/search.ts', '// Search client')],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  flags: {
    category: 'flags',
    defaultPackages: { 'feature-flags-sdk': '^1.0.0' },
    defaultEnvVars: [
      createMockEnvVar('FLAGS_SDK_KEY', { required: true }),
    ],
    defaultFiles: [createMockPluginFile('src/lib/flags.ts', '// Feature flags')],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  sms: {
    category: 'sms',
    defaultPackages: { 'sms-client': '^1.0.0' },
    defaultEnvVars: [
      createMockEnvVar('SMS_API_KEY', { required: true, secret: true }),
    ],
    defaultFiles: [createMockPluginFile('src/lib/sms.ts', '// SMS client')],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  push: {
    category: 'push',
    defaultPackages: { 'push-sdk': '^1.0.0' },
    defaultEnvVars: [
      createMockEnvVar('PUSH_API_KEY', { required: true, secret: true }),
    ],
    defaultFiles: [createMockPluginFile('src/lib/push.ts', '// Push notifications')],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  realtime: {
    category: 'realtime',
    defaultPackages: { 'realtime-client': '^1.0.0' },
    defaultEnvVars: [
      createMockEnvVar('REALTIME_APP_KEY', { required: true }),
      createMockEnvVar('REALTIME_SECRET', { required: true, secret: true }),
    ],
    defaultFiles: [createMockPluginFile('src/lib/realtime.ts', '// Realtime setup')],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  ai: {
    category: 'ai',
    defaultPackages: { 'ai-sdk': '^1.0.0' },
    defaultEnvVars: [
      createMockEnvVar('AI_API_KEY', { required: true, secret: true }),
    ],
    defaultFiles: [createMockPluginFile('src/lib/ai.ts', '// AI client')],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  vector: {
    category: 'vector',
    defaultPackages: { 'vector-db-client': '^1.0.0' },
    defaultEnvVars: [
      createMockEnvVar('VECTOR_DB_URL', { required: true }),
      createMockEnvVar('VECTOR_DB_API_KEY', { required: true, secret: true }),
    ],
    defaultFiles: [createMockPluginFile('src/lib/vector.ts', '// Vector DB client')],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  i18n: {
    category: 'i18n',
    defaultPackages: { 'i18n-lib': '^1.0.0' },
    defaultEnvVars: [],
    defaultFiles: [
      createMockPluginFile('src/lib/i18n.ts', '// i18n setup'),
      createMockPluginFile('messages/en.json', '{}'),
    ],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  forms: {
    category: 'forms',
    defaultPackages: { 'forms-lib': '^1.0.0' },
    defaultEnvVars: [],
    defaultFiles: [createMockPluginFile('src/lib/forms.ts', '// Forms setup')],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  state: {
    category: 'state',
    defaultPackages: { 'state-lib': '^1.0.0' },
    defaultEnvVars: [],
    defaultFiles: [createMockPluginFile('src/lib/store.ts', '// State store')],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  testing: {
    category: 'testing',
    defaultPackages: { 'testing-lib': '^1.0.0' },
    defaultEnvVars: [],
    defaultFiles: [createMockPluginFile('src/test/setup.ts', '// Test setup')],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  security: {
    category: 'security',
    defaultPackages: { 'security-lib': '^1.0.0' },
    defaultEnvVars: [
      createMockEnvVar('CAPTCHA_SITE_KEY', { required: true }),
      createMockEnvVar('CAPTCHA_SECRET_KEY', { required: true, secret: true }),
    ],
    defaultFiles: [createMockPluginFile('src/lib/security.ts', '// Security setup')],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  media: {
    category: 'media',
    defaultPackages: { 'media-sdk': '^1.0.0' },
    defaultEnvVars: [
      createMockEnvVar('MEDIA_CLOUD_NAME', { required: true }),
      createMockEnvVar('MEDIA_API_KEY', { required: true, secret: true }),
    ],
    defaultFiles: [createMockPluginFile('src/lib/media.ts', '// Media client')],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  maps: {
    category: 'maps',
    defaultPackages: { 'maps-sdk': '^1.0.0' },
    defaultEnvVars: [
      createMockEnvVar('MAPS_API_KEY', { required: true }),
    ],
    defaultFiles: [createMockPluginFile('src/lib/maps.ts', '// Maps setup')],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  charts: {
    category: 'charts',
    defaultPackages: { 'charts-lib': '^1.0.0' },
    defaultEnvVars: [],
    defaultFiles: [createMockPluginFile('src/components/charts/index.ts', '// Charts')],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  pdf: {
    category: 'pdf',
    defaultPackages: { 'pdf-lib': '^1.0.0' },
    defaultEnvVars: [],
    defaultFiles: [createMockPluginFile('src/lib/pdf.ts', '// PDF utilities')],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  seo: {
    category: 'seo',
    defaultPackages: { 'seo-lib': '^1.0.0' },
    defaultEnvVars: [],
    defaultFiles: [createMockPluginFile('src/lib/seo.ts', '// SEO utilities')],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  scheduling: {
    category: 'scheduling',
    defaultPackages: { 'scheduling-sdk': '^1.0.0' },
    defaultEnvVars: [
      createMockEnvVar('SCHEDULING_API_KEY', { required: true, secret: true }),
    ],
    defaultFiles: [createMockPluginFile('src/lib/scheduling.ts', '// Scheduling')],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  comments: {
    category: 'comments',
    defaultPackages: { 'comments-lib': '^1.0.0' },
    defaultEnvVars: [],
    defaultFiles: [createMockPluginFile('src/components/comments.tsx', '// Comments')],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  notifications: {
    category: 'notifications',
    defaultPackages: { 'notifications-sdk': '^1.0.0' },
    defaultEnvVars: [
      createMockEnvVar('NOTIFICATIONS_API_KEY', { required: true, secret: true }),
    ],
    defaultFiles: [createMockPluginFile('src/lib/notifications.ts', '// Notifications')],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  admin: {
    category: 'admin',
    defaultPackages: { 'admin-lib': '^1.0.0' },
    defaultEnvVars: [],
    defaultFiles: [createMockPluginFile('src/admin/index.ts', '// Admin setup')],
    supportedTemplates: ['nextjs', 'tanstack'],
  },
  content: {
    category: 'content',
    defaultPackages: { 'content-lib': '^1.0.0' },
    defaultEnvVars: [],
    defaultFiles: [createMockPluginFile('src/lib/content.ts', '// Content processing')],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
  indonesian: {
    category: 'indonesian',
    defaultPackages: { 'indonesian-services': '^1.0.0' },
    defaultEnvVars: [
      createMockEnvVar('RAJAONGKIR_API_KEY', { required: true, secret: true }),
    ],
    defaultFiles: [createMockPluginFile('src/lib/indonesian.ts', '// Indonesian services')],
    supportedTemplates: ALL_FRAMEWORK_TEMPLATES,
  },
};

/**
 * Creates a mock plugin for a specific category with realistic defaults
 */
export function createCategoryMockPlugin(
  category: PluginCategory,
  name?: string
): PluginDefinition {
  const template = CATEGORY_TEMPLATES[category];
  
  return createMockPlugin({
    name: name ?? `${category}-test-plugin`,
    displayName: `Test ${category.charAt(0).toUpperCase() + category.slice(1)} Plugin`,
    category,
    packages: { dependencies: template.defaultPackages },
    envVars: template.defaultEnvVars,
    files: template.defaultFiles,
    supportedTemplates: template.supportedTemplates,
  });
}

/**
 * Creates mock plugins for all categories
 */
export function createAllCategoryMockPlugins(): PluginDefinition[] {
  return ALL_PLUGIN_CATEGORIES.map(category => createCategoryMockPlugin(category));
}

/**
 * Creates a mock plugin set for testing integrations between categories
 */
export function createIntegrationTestPlugins(): {
  api: PluginDefinition;
  auth: PluginDefinition;
  database: PluginDefinition;
} {
  const database = createCategoryMockPlugin('database', 'db-test');
  const auth = createMockPlugin({
    ...createCategoryMockPlugin('auth', 'auth-test'),
    dependencies: ['db-test'],
  });
  const api = createMockPlugin({
    ...createCategoryMockPlugin('api', 'api-test'),
    dependencies: ['auth-test'],
  });
  
  return { api, auth, database };
}

/**
 * Checks if a plugin has test utilities (files in test directory)
 */
export function pluginHasTestUtilities(plugin: PluginDefinition): boolean {
  return plugin.files.some(file => 
    file.path.includes('/test/') || 
    file.path.includes('/__tests__/') ||
    file.path.endsWith('.test.ts') ||
    file.path.endsWith('.test.tsx') ||
    file.path.endsWith('.spec.ts') ||
    file.path.endsWith('.spec.tsx')
  );
}

/**
 * Gets the test utility files from a plugin
 */
export function getPluginTestUtilityFiles(plugin: PluginDefinition): PluginFile[] {
  return plugin.files.filter(file => 
    file.path.includes('/test/') || 
    file.path.includes('/__tests__/') ||
    file.path.endsWith('.test.ts') ||
    file.path.endsWith('.test.tsx') ||
    file.path.endsWith('.spec.ts') ||
    file.path.endsWith('.spec.tsx')
  );
}

/**
 * Creates a plugin with test utilities included
 */
export function createPluginWithTestUtilities(
  category: PluginCategory,
  name?: string
): PluginDefinition {
  const basePlugin = createCategoryMockPlugin(category, name);
  const testFiles: PluginFile[] = [
    createMockPluginFile(`src/__tests__/${category}.test.ts`, `// Tests for ${category}`),
    createMockPluginFile(`src/test/mocks/${category}.ts`, `// Mocks for ${category}`),
  ];
  
  return {
    ...basePlugin,
    files: [...basePlugin.files, ...testFiles],
  };
}
