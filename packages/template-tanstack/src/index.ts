/**
 * @scaforge/template-tanstack
 * TanStack Start template for Scaforge
 */

export const templateName = 'tanstack';
export const displayName = 'TanStack Start';
export const description = 'Full-stack React with TanStack Router';

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