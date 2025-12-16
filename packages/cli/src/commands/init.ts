/**
 * Init Command
 * Creates a new Scaforge project
 * 
 * Requirements: 2.1, 2.2
 */
import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import type { FrameworkTemplate } from '@scaforge/core';
import { logger, runPrompts, promptConfirm } from '../utils';
import { createProject } from './init-project.js';

/** Valid framework templates */
const VALID_TEMPLATES: FrameworkTemplate[] = ['nextjs', 'tanstack', 'nuxt', 'hydrogen'];

/** Template display information */
const TEMPLATE_INFO: Record<FrameworkTemplate, { title: string; description: string }> = {
  nextjs: {
    title: 'Next.js',
    description: 'React framework with App Router (recommended)',
  },
  tanstack: {
    title: 'TanStack Start',
    description: 'Full-stack React with TanStack Router',
  },
  nuxt: {
    title: 'Nuxt',
    description: 'Vue.js framework with auto-imports',
  },
  hydrogen: {
    title: 'Hydrogen',
    description: 'Shopify storefront framework',
  },
};

/** Initial plugin choices for quick setup */
const INITIAL_PLUGIN_CHOICES = [
  { title: 'tRPC', value: 'api-trpc', description: 'End-to-end typesafe APIs' },
  { title: 'Prisma', value: 'db-prisma', description: 'Type-safe database ORM' },
  { title: 'Auth.js', value: 'auth-authjs', description: 'Authentication for the web' },
];

/**
 * Validates a project name
 */
function validateProjectName(name: string): boolean | string {
  if (!name || name.trim().length === 0) {
    return 'Project name is required';
  }
  
  // Check for valid npm package name characters
  if (!/^[a-z0-9@][a-z0-9-._]*$/i.test(name)) {
    return 'Project name can only contain letters, numbers, hyphens, underscores, and dots';
  }
  
  // Check length (npm limit is 214)
  if (name.length > 214) {
    return 'Project name must be 214 characters or less';
  }
  
  return true;
}

/**
 * Validates a template name
 */
function isValidTemplate(template: string): template is FrameworkTemplate {
  return VALID_TEMPLATES.includes(template as FrameworkTemplate);
}

export const initCommand = new Command('init')
  .description('Create a new Scaforge project')
  .option('-t, --template <template>', 'Framework template (nextjs, tanstack, nuxt, hydrogen)')
  .option('-n, --name <name>', 'Project name')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .option('--no-install', 'Skip dependency installation')
  .action(async (options: {
    template?: string;
    name?: string;
    yes?: boolean;
    install?: boolean;
  }) => {
    logger.newLine();
    logger.log(chalk.bold.cyan('🔨 Scaforge') + chalk.dim(' - Create a new project'));
    logger.newLine();

    // Validate template if provided via flag
    if (options.template && !isValidTemplate(options.template)) {
      logger.error(`Invalid template: ${options.template}`);
      logger.info(`Valid templates: ${VALID_TEMPLATES.join(', ')}`);
      process.exit(1);
    }

    // Validate name if provided via flag
    if (options.name) {
      const nameValidation = validateProjectName(options.name);
      if (typeof nameValidation === 'string') {
        logger.error(nameValidation);
        process.exit(1);
      }
    }

    let projectName = options.name;
    let template = options.template as FrameworkTemplate | undefined;
    let selectedPlugins: string[] = [];

    // Interactive prompts if not using --yes flag
    if (!options.yes) {
      const answers = await runPrompts([
        {
          type: projectName ? null : 'text',
          name: 'name',
          message: 'Project name:',
          initial: 'my-scaforge-app',
          validate: (value: string) => {
            const result = validateProjectName(value);
            return result === true ? true : result;
          },
        },
        {
          type: template ? null : 'select',
          name: 'template',
          message: 'Select framework:',
          choices: VALID_TEMPLATES.map((t) => {
            const info = TEMPLATE_INFO[t]!;
            return {
              title: info.title,
              value: t,
              description: info.description,
            };
          }),
          initial: 0,
        },
        {
          type: 'multiselect',
          name: 'plugins',
          message: 'Select initial plugins (optional):',
          choices: INITIAL_PLUGIN_CHOICES,
          hint: 'Space to select, Enter to confirm',
        },
      ]);

      projectName = projectName ?? answers.name;
      template = template ?? answers.template;
      selectedPlugins = answers.plugins ?? [];
    } else {
      // Use defaults for --yes flag
      projectName = projectName || 'my-scaforge-app';
      template = template || 'nextjs';
    }

    // Final validation - ensure we have values
    if (!projectName || !template) {
      logger.error('Project name and template are required');
      process.exit(1);
    }

    // Check if directory already exists
    const projectPath = path.resolve(process.cwd(), projectName);
    if (fs.existsSync(projectPath)) {
      const isEmpty = fs.readdirSync(projectPath).length === 0;
      
      if (!isEmpty) {
        const overwrite = await promptConfirm(
          `Directory "${projectName}" already exists and is not empty. Continue anyway?`,
          false
        );
        
        if (!overwrite) {
          logger.info('Operation cancelled');
          process.exit(0);
        }
      }
    }

    const templateInfo = TEMPLATE_INFO[template]!;
    logger.newLine();
    logger.info(`Creating ${chalk.cyan(projectName)} with ${chalk.cyan(templateInfo.title)} template...`);
    logger.newLine();

    try {
      // Create the project
      await createProject({
        name: projectName,
        template,
        plugins: selectedPlugins,
        projectPath,
        installDependencies: options.install !== false,
      });

      // Success message
      logger.newLine();
      logger.success(chalk.bold('Project created successfully!'));
      logger.newLine();
      
      logger.log(chalk.bold('Next steps:'));
      logger.log(chalk.dim('  cd ') + chalk.cyan(projectName));
      
      if (options.install === false) {
        logger.log(chalk.dim('  pnpm install'));
      }
      
      logger.log(chalk.dim('  pnpm dev'));
      logger.newLine();
      
      logger.log(chalk.bold('Add more plugins anytime:'));
      logger.log(chalk.dim('  npx scaforge add <plugin>'));
      logger.log(chalk.dim('  npx scaforge list'));
      logger.newLine();
      
    } catch (error) {
      logger.newLine();
      logger.error('Failed to create project');
      
      if (error instanceof Error) {
        logger.error(error.message);
      }
      
      process.exit(1);
    }
  });
