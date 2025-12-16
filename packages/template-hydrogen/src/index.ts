/**
 * @scaforge/template-hydrogen
 * Shopify Hydrogen template for Scaforge
 */

export const templateName = 'hydrogen';
export const displayName = 'Hydrogen';
export const description = 'Shopify storefront framework';

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