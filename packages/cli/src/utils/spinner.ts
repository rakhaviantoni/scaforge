/**
 * Spinner utilities for CLI loading states
 */
import ora from 'ora';

export interface SpinnerInstance {
  start(text?: string): SpinnerInstance;
  stop(): SpinnerInstance;
  succeed(text?: string): SpinnerInstance;
  fail(text?: string): SpinnerInstance;
  warn(text?: string): SpinnerInstance;
  info(text?: string): SpinnerInstance;
  text: string;
}

/**
 * Create a new spinner instance
 */
export function createSpinner(text?: string): SpinnerInstance {
  return ora(text);
}

/**
 * Run an async operation with a spinner
 */
export async function withSpinner<T>(
  text: string,
  operation: () => Promise<T>,
  options?: {
    successText?: string;
    failText?: string;
  }
): Promise<T> {
  const spinner = ora(text).start();

  try {
    const result = await operation();
    spinner.succeed(options?.successText ?? text);
    return result;
  } catch (error) {
    spinner.fail(options?.failText ?? text);
    throw error;
  }
}
