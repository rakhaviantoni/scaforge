/**
 * @scaforge/template-nextjs
 * Next.js 15 App Router template for Scaforge
 */

export const templateName = 'nextjs';
export const displayName = 'Next.js';
export const description = 'React framework with App Router';

export interface TemplateDefinition {
  name: string;
  displayName: string;
  description: string;
  templatePath: string;
}

export const template: TemplateDefinition = {
  name: templateName,
  displayName,
  description,
  templatePath: '../template',
};
