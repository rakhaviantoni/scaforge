/**
 * Prompt utilities for CLI user input
 */
import prompts, { type PromptObject, type Answers } from 'prompts';
import chalk from 'chalk';

export type { PromptObject, Answers };

/**
 * Prompt for text input
 */
export async function promptText(
  message: string,
  options?: {
    initial?: string;
    validate?: (value: string) => boolean | string;
  }
): Promise<string | undefined> {
  const response = await prompts({
    type: 'text',
    name: 'value',
    message,
    initial: options?.initial,
    validate: options?.validate,
  });

  return response.value;
}

/**
 * Prompt for selection from a list
 */
export async function promptSelect<T extends string>(
  message: string,
  choices: Array<{
    title: string;
    value: T;
    description?: string;
  }>
): Promise<T | undefined> {
  const response = await prompts({
    type: 'select',
    name: 'value',
    message,
    choices,
  });

  return response.value;
}

/**
 * Prompt for multiple selections
 */
export async function promptMultiSelect<T extends string>(
  message: string,
  choices: Array<{
    title: string;
    value: T;
    description?: string;
    selected?: boolean;
  }>,
  options?: {
    hint?: string;
    min?: number;
    max?: number;
  }
): Promise<T[] | undefined> {
  const response = await prompts({
    type: 'multiselect',
    name: 'value',
    message,
    choices,
    hint: options?.hint ?? 'Space to select, Enter to confirm',
    min: options?.min,
    max: options?.max,
  });

  return response.value;
}

/**
 * Prompt for confirmation (yes/no)
 */
export async function promptConfirm(
  message: string,
  initial?: boolean
): Promise<boolean | undefined> {
  const response = await prompts({
    type: 'confirm',
    name: 'value',
    message,
    initial: initial ?? true,
  });

  return response.value;
}

/**
 * Run multiple prompts in sequence
 */
export async function runPrompts<T extends string = string>(
  questions: PromptObject<T>[]
): Promise<Answers<T>> {
  return prompts(questions, {
    onCancel: () => {
      console.log(chalk.yellow('\nOperation cancelled.'));
      process.exit(0);
    },
  });
}

/**
 * Cancel handler for prompts - exits gracefully
 */
export function onPromptCancel(): void {
  console.log(chalk.yellow('\nOperation cancelled.'));
  process.exit(0);
}
