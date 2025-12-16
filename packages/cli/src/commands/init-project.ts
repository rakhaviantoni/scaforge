/**
 * Project Creation Logic
 * Handles the actual creation of a new Scaforge project
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
import path from 'path';
import fs from 'fs/promises';
import { execSync } from 'child_process';
import type { FrameworkTemplate } from '@scaforge/core';
import { createDefaultConfig, generateConfigFileContent } from '@scaforge/core';
import { logger, createSpinner } from '../utils/index.js';

/** Options for creating a project */
export interface CreateProjectOptions {
  /** Project name */
  name: string;
  /** Framework template to use */
  template: FrameworkTemplate;
  /** Initial plugins to install */
  plugins?: string[];
  /** Full path to the project directory */
  projectPath: string;
  /** Whether to install dependencies */
  installDependencies?: boolean;
}

/**
 * Helper to ensure a directory exists (like fs-extra's ensureDir)
 */
async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Helper to write JSON to a file
 */
async function writeJson(filePath: string, data: unknown): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/** Template-specific package.json configurations */
const TEMPLATE_PACKAGE_JSON: Record<FrameworkTemplate, object> = {
  nextjs: {
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
    },
    dependencies: {
      next: '^15.0.0',
      react: '^19.0.0',
      'react-dom': '^19.0.0',
    },
    devDependencies: {
      '@types/node': '^20.0.0',
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      typescript: '^5.0.0',
      tailwindcss: '^3.4.0',
      postcss: '^8.4.0',
      autoprefixer: '^10.4.0',
    },
  },
  tanstack: {
    scripts: {
      dev: 'vinxi dev',
      build: 'vinxi build',
      start: 'vinxi start',
    },
    dependencies: {
      '@tanstack/react-router': '^1.0.0',
      '@tanstack/start': '^1.0.0',
      react: '^19.0.0',
      'react-dom': '^19.0.0',
      vinxi: '^0.4.0',
    },
    devDependencies: {
      '@types/node': '^20.0.0',
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      typescript: '^5.0.0',
      tailwindcss: '^3.4.0',
      postcss: '^8.4.0',
      autoprefixer: '^10.4.0',
    },
  },
  nuxt: {
    scripts: {
      dev: 'nuxt dev',
      build: 'nuxt build',
      generate: 'nuxt generate',
      preview: 'nuxt preview',
    },
    dependencies: {},
    devDependencies: {
      nuxt: '^3.13.0',
      typescript: '^5.0.0',
      '@nuxt/devtools': '^1.0.0',
    },
  },
  hydrogen: {
    scripts: {
      dev: 'shopify hydrogen dev',
      build: 'shopify hydrogen build',
      preview: 'shopify hydrogen preview',
    },
    dependencies: {
      '@shopify/hydrogen': '^2024.0.0',
      '@shopify/remix-oxygen': '^2.0.0',
      '@remix-run/react': '^2.0.0',
      react: '^18.0.0',
      'react-dom': '^18.0.0',
    },
    devDependencies: {
      '@shopify/cli': '^3.0.0',
      '@shopify/cli-hydrogen': '^8.0.0',
      '@types/react': '^18.0.0',
      '@types/react-dom': '^18.0.0',
      typescript: '^5.0.0',
      tailwindcss: '^3.4.0',
    },
  },
};


/**
 * Creates a new Scaforge project
 */
export async function createProject(options: CreateProjectOptions): Promise<void> {
  const { name, template, plugins = [], projectPath, installDependencies = true } = options;

  const spinner = createSpinner();

  // Step 1: Create project directory
  spinner.start('Creating project directory...');
  await ensureDir(projectPath);
  spinner.succeed('Project directory created');

  // Step 2: Create package.json
  spinner.start('Creating package.json...');
  await createPackageJson(projectPath, name, template);
  spinner.succeed('package.json created');

  // Step 3: Create TypeScript configuration
  spinner.start('Creating TypeScript configuration...');
  await createTsConfig(projectPath, template);
  spinner.succeed('TypeScript configuration created');

  // Step 4: Create Tailwind CSS configuration
  spinner.start('Creating Tailwind CSS configuration...');
  await createTailwindConfig(projectPath, template);
  spinner.succeed('Tailwind CSS configuration created');

  // Step 5: Create Scaforge configuration (Requirement 4.5)
  spinner.start('Creating scaforge.config.ts...');
  await createScaforgeConfig(projectPath, name, template);
  spinner.succeed('scaforge.config.ts created');

  // Step 6: Create base project structure
  spinner.start('Creating project structure...');
  await createProjectStructure(projectPath, template);
  spinner.succeed('Project structure created');

  // Step 7: Create .env.example
  spinner.start('Creating .env.example...');
  await createEnvExample(projectPath);
  spinner.succeed('.env.example created');

  // Step 8: Create .gitignore
  spinner.start('Creating .gitignore...');
  await createGitignore(projectPath);
  spinner.succeed('.gitignore created');

  // Step 9: Install dependencies
  if (installDependencies) {
    spinner.start('Installing dependencies...');
    try {
      execSync('pnpm install', {
        cwd: projectPath,
        stdio: 'pipe',
      });
      spinner.succeed('Dependencies installed');
    } catch {
      spinner.warn('Failed to install dependencies. Run "pnpm install" manually.');
    }
  }

  // Step 10: Add initial plugins if any
  if (plugins.length > 0) {
    logger.info(`Initial plugins selected: ${plugins.join(', ')}`);
    logger.info('Run "npx scaforge add <plugin>" to install them after setup.');
  }
}

/**
 * Creates the package.json file
 */
async function createPackageJson(
  projectPath: string,
  name: string,
  template: FrameworkTemplate
): Promise<void> {
  const templateConfig = TEMPLATE_PACKAGE_JSON[template];
  
  const packageJson = {
    name,
    version: '0.1.0',
    private: true,
    type: 'module',
    ...templateConfig,
  };

  await writeJson(path.join(projectPath, 'package.json'), packageJson);
}

/**
 * Creates the TypeScript configuration
 */
async function createTsConfig(
  projectPath: string,
  template: FrameworkTemplate
): Promise<void> {
  // Use a type that allows dynamic paths
  interface TsConfigPaths {
    [key: string]: string[];
  }
  
  interface TsConfig {
    compilerOptions: {
      target: string;
      lib: string[];
      allowJs: boolean;
      skipLibCheck: boolean;
      strict: boolean;
      noEmit: boolean;
      esModuleInterop: boolean;
      module: string;
      moduleResolution: string;
      resolveJsonModule: boolean;
      isolatedModules: boolean;
      jsx: string;
      incremental: boolean;
      baseUrl: string;
      paths: TsConfigPaths;
      plugins?: Array<{ name: string }>;
    };
    include: string[];
    exclude: string[];
  }

  const baseConfig: TsConfig = {
    compilerOptions: {
      target: 'ES2022',
      lib: ['dom', 'dom.iterable', 'ES2022'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      baseUrl: '.',
      paths: {
        '@/*': ['./src/*'],
      },
    },
    include: ['**/*.ts', '**/*.tsx'],
    exclude: ['node_modules'],
  };

  // Template-specific adjustments
  if (template === 'nextjs') {
    baseConfig.compilerOptions.plugins = [{ name: 'next' }];
    baseConfig.include = ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'];
  }

  if (template === 'nuxt') {
    // Nuxt generates its own tsconfig
    baseConfig.compilerOptions.paths = {
      '@/*': ['./*'],
      '~/*': ['./*'],
    };
  }

  await writeJson(path.join(projectPath, 'tsconfig.json'), baseConfig);
}

/**
 * Creates Tailwind CSS configuration
 */
async function createTailwindConfig(
  projectPath: string,
  template: FrameworkTemplate
): Promise<void> {
  const contentPaths: Record<FrameworkTemplate, string[]> = {
    nextjs: ['./src/**/*.{js,ts,jsx,tsx,mdx}', './app/**/*.{js,ts,jsx,tsx,mdx}'],
    tanstack: ['./src/**/*.{js,ts,jsx,tsx}', './app/**/*.{js,ts,jsx,tsx}'],
    nuxt: ['./components/**/*.{vue,js,ts}', './layouts/**/*.vue', './pages/**/*.vue', './app.vue'],
    hydrogen: ['./app/**/*.{js,ts,jsx,tsx}'],
  };

  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: ${JSON.stringify(contentPaths[template], null, 4)},
  theme: {
    extend: {},
  },
  plugins: [],
};
`;

  await fs.writeFile(path.join(projectPath, 'tailwind.config.js'), tailwindConfig);

  // PostCSS config
  const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;

  await fs.writeFile(path.join(projectPath, 'postcss.config.js'), postcssConfig);
}

/**
 * Creates the Scaforge configuration file (Requirement 4.5)
 */
async function createScaforgeConfig(
  projectPath: string,
  name: string,
  template: FrameworkTemplate
): Promise<void> {
  const config = createDefaultConfig(name, template);
  const content = generateConfigFileContent(config);
  await fs.writeFile(path.join(projectPath, 'scaforge.config.ts'), content);
}

/**
 * Creates the base project structure
 * Requirements: 4.1, 4.2, 4.3, 4.4 - Minimal base template
 */
async function createProjectStructure(
  projectPath: string,
  template: FrameworkTemplate
): Promise<void> {
  switch (template) {
    case 'nextjs':
      await createNextJsStructure(projectPath);
      break;
    case 'tanstack':
      await createTanStackStructure(projectPath);
      break;
    case 'nuxt':
      await createNuxtStructure(projectPath);
      break;
    case 'hydrogen':
      await createHydrogenStructure(projectPath);
      break;
  }
}


/**
 * Creates Next.js project structure
 */
async function createNextJsStructure(projectPath: string): Promise<void> {
  // Create directories
  await ensureDir(path.join(projectPath, 'src/app'));
  await ensureDir(path.join(projectPath, 'src/components'));
  await ensureDir(path.join(projectPath, 'src/lib'));
  await ensureDir(path.join(projectPath, 'public'));

  // Create layout.tsx
  const layoutContent = `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Scaforge App',
  description: 'Created with Scaforge',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;
  await fs.writeFile(path.join(projectPath, 'src/app/layout.tsx'), layoutContent);

  // Create page.tsx
  const pageContent = `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Welcome to Scaforge</h1>
      <p className="mt-4 text-lg text-gray-600">
        Start building your app by editing src/app/page.tsx
      </p>
    </main>
  );
}
`;
  await fs.writeFile(path.join(projectPath, 'src/app/page.tsx'), pageContent);

  // Create globals.css
  const globalsContent = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;
  await fs.writeFile(path.join(projectPath, 'src/app/globals.css'), globalsContent);

  // Create next.config.js
  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
`;
  await fs.writeFile(path.join(projectPath, 'next.config.js'), nextConfig);

  // Create next-env.d.ts
  const nextEnv = `/// <reference types="next" />
/// <reference types="next/image-types/global" />
`;
  await fs.writeFile(path.join(projectPath, 'next-env.d.ts'), nextEnv);
}

/**
 * Creates TanStack Start project structure
 */
async function createTanStackStructure(projectPath: string): Promise<void> {
  await ensureDir(path.join(projectPath, 'src/routes'));
  await ensureDir(path.join(projectPath, 'src/components'));
  await ensureDir(path.join(projectPath, 'src/lib'));
  await ensureDir(path.join(projectPath, 'src/styles'));

  // Create root route
  const rootRoute = `import { createRootRoute, Outlet } from '@tanstack/react-router';
import '../styles/globals.css';

export const Route = createRootRoute({
  component: () => (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Scaforge App</title>
      </head>
      <body>
        <Outlet />
      </body>
    </html>
  ),
});
`;
  await fs.writeFile(path.join(projectPath, 'src/routes/__root.tsx'), rootRoute);

  // Create index route
  const indexRoute = `import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Welcome to Scaforge</h1>
      <p className="mt-4 text-lg text-gray-600">
        Start building your app by editing src/routes/index.tsx
      </p>
    </main>
  );
}
`;
  await fs.writeFile(path.join(projectPath, 'src/routes/index.tsx'), indexRoute);

  // Create styles
  const globalsContent = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;
  await fs.writeFile(path.join(projectPath, 'src/styles/globals.css'), globalsContent);

  // Create app.config.ts
  const appConfig = `import { defineConfig } from '@tanstack/start/config';

export default defineConfig({});
`;
  await fs.writeFile(path.join(projectPath, 'app.config.ts'), appConfig);
}

/**
 * Creates Nuxt project structure
 */
async function createNuxtStructure(projectPath: string): Promise<void> {
  await ensureDir(path.join(projectPath, 'pages'));
  await ensureDir(path.join(projectPath, 'components'));
  await ensureDir(path.join(projectPath, 'composables'));
  await ensureDir(path.join(projectPath, 'assets/css'));

  // Create app.vue
  const appVue = `<template>
  <NuxtPage />
</template>
`;
  await fs.writeFile(path.join(projectPath, 'app.vue'), appVue);

  // Create index page
  const indexPage = `<template>
  <main class="flex min-h-screen flex-col items-center justify-center p-24">
    <h1 class="text-4xl font-bold">Welcome to Scaforge</h1>
    <p class="mt-4 text-lg text-gray-600">
      Start building your app by editing pages/index.vue
    </p>
  </main>
</template>
`;
  await fs.writeFile(path.join(projectPath, 'pages/index.vue'), indexPage);

  // Create nuxt.config.ts
  const nuxtConfig = `export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
});
`;
  await fs.writeFile(path.join(projectPath, 'nuxt.config.ts'), nuxtConfig);

  // Create main.css
  const mainCss = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;
  await fs.writeFile(path.join(projectPath, 'assets/css/main.css'), mainCss);
}

/**
 * Creates Hydrogen project structure
 */
async function createHydrogenStructure(projectPath: string): Promise<void> {
  await ensureDir(path.join(projectPath, 'app/routes'));
  await ensureDir(path.join(projectPath, 'app/components'));
  await ensureDir(path.join(projectPath, 'app/styles'));

  // Create root.tsx
  const rootTsx = `import { Links, Meta, Outlet, Scripts, ScrollRestoration } from '@remix-run/react';
import './styles/globals.css';

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
`;
  await fs.writeFile(path.join(projectPath, 'app/root.tsx'), rootTsx);

  // Create index route
  const indexRoute = `export default function Index() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Welcome to Scaforge</h1>
      <p className="mt-4 text-lg text-gray-600">
        Start building your Hydrogen storefront
      </p>
    </main>
  );
}
`;
  await fs.writeFile(path.join(projectPath, 'app/routes/_index.tsx'), indexRoute);

  // Create globals.css
  const globalsContent = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;
  await fs.writeFile(path.join(projectPath, 'app/styles/globals.css'), globalsContent);

  // Create hydrogen.config.ts
  const hydrogenConfig = `import { defineConfig } from '@shopify/hydrogen/config';

export default defineConfig({
  shopify: {
    storeDomain: process.env.PUBLIC_STORE_DOMAIN || '',
    storefrontToken: process.env.PUBLIC_STOREFRONT_API_TOKEN || '',
    storefrontApiVersion: '2024-01',
  },
});
`;
  await fs.writeFile(path.join(projectPath, 'hydrogen.config.ts'), hydrogenConfig);
}

/**
 * Creates .env.example file
 */
async function createEnvExample(projectPath: string): Promise<void> {
  const content = `# Environment Variables
# Copy this file to .env.local and fill in the values

# Add your environment variables here
# Example:
# DATABASE_URL=postgresql://user:password@localhost:5432/mydb
`;
  await fs.writeFile(path.join(projectPath, '.env.example'), content);
}

/**
 * Creates .gitignore file
 */
async function createGitignore(projectPath: string): Promise<void> {
  const content = `# Dependencies
node_modules/
.pnpm-store/

# Build outputs
.next/
.nuxt/
.output/
dist/
build/

# Environment files
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Testing
coverage/

# Scaforge
.scaforge/
`;
  await fs.writeFile(path.join(projectPath, '.gitignore'), content);
}
