/**
 * Logging utilities for CLI output
 */
import chalk from 'chalk';

export const logger = {
  /**
   * Log an info message
   */
  info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  },

  /**
   * Log a success message
   */
  success(message: string): void {
    console.log(chalk.green('✓'), message);
  },

  /**
   * Log a warning message
   */
  warn(message: string): void {
    console.log(chalk.yellow('⚠'), message);
  },

  /**
   * Log an error message
   */
  error(message: string): void {
    console.error(chalk.red('✖'), message);
  },

  /**
   * Log a plain message without prefix
   */
  log(message: string): void {
    console.log(message);
  },

  /**
   * Log a blank line
   */
  newLine(): void {
    console.log();
  },

  /**
   * Log a step in a process
   */
  step(step: number, total: number, message: string): void {
    console.log(chalk.dim(`[${step}/${total}]`), message);
  },
};
