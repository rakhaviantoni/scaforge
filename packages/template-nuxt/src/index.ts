/**
 * @scaforge/template-nuxt
 * Nuxt 3 template for Scaforge
 */

export const templateName = 'nuxt';
export const displayName = 'Nuxt';
export const description = 'Vue.js framework';

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