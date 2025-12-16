/**
 * Property-based tests for File Utilities
 * 
 * **Feature: scaforge, Property 11: Backup Creation on Update**
 * **Validates: Requirements 43.4**
 * 
 * Tests that backup creation maintains file integrity:
 * - Creating a backup preserves the original file content
 * - Backup files are created in the correct location
 * - Restoring from backup recreates the original file
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  createBackup,
  restoreFromBackup,
  writeGeneratedFile,
  removeGeneratedFile,
  fileExists,
  readProjectFile,
} from '../files';

// Test directory for file operations
let testDir: string;

beforeEach(async () => {
  testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scaforge-files-test-'));
});

afterEach(async () => {
  if (testDir) {
    await fs.remove(testDir);
  }
});

// Arbitrary for generating valid file paths (no leading slash, no special chars)
const filePathArb = fc.array(
  fc.stringOf(
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-_'.split('')),
    { minLength: 1, maxLength: 10 }
  ),
  { minLength: 1, maxLength: 3 }
).map(parts => parts.join('/'))
.chain(basePath => 
  fc.constantFrom('.ts', '.js', '.json', '.md', '.txt')
    .map(ext => basePath + ext)
);

// Arbitrary for generating file content (printable ASCII, no null bytes)
const fileContentArb = fc.stringOf(
  fc.integer({ min: 32, max: 126 }).map(code => String.fromCharCode(code)),
  { minLength: 0, maxLength: 1000 }
);

// Arbitrary for generating plugin names
const pluginNameArb = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-'.split('')),
  { minLength: 3, maxLength: 20 }
).filter(s => /^[a-z][a-z0-9-]*[a-z0-9]$/.test(s));

describe('File Utilities Property Tests', () => {
  /**
   * **Feature: scaforge, Property 11: Backup Creation on Update**
   * **Validates: Requirements 43.4**
   * 
   * Property: Backup Preserves Content
   * For any file with content, creating a backup should preserve the exact content.
   */
  it('backup preserves file content exactly', async () => {
    await fc.assert(
      fc.asyncProperty(
        filePathArb,
        fileContentArb,
        async (filePath, content) => {
          // Create the original file
          const fullPath = path.join(testDir, filePath);
          await fs.ensureDir(path.dirname(fullPath));
          await fs.writeFile(fullPath, content, 'utf-8');
          
          // Create backup
          const backupPath = await createBackup(testDir, filePath);
          
          // Backup should be created
          expect(backupPath).toBeDefined();
          expect(backupPath).not.toBeNull();
          
          if (backupPath) {
            // Backup file should exist
            const fullBackupPath = path.join(testDir, backupPath);
            expect(await fs.pathExists(fullBackupPath)).toBe(true);
            
            // Backup content should match original
            const backupContent = await fs.readFile(fullBackupPath, 'utf-8');
            expect(backupContent).toBe(content);
            
            // Original file should still exist and be unchanged
            const originalContent = await fs.readFile(fullPath, 'utf-8');
            expect(originalContent).toBe(content);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: scaforge, Property 11: Backup Creation on Update**
   * **Validates: Requirements 43.4**
   * 
   * Property: Backup/Restore Round-Trip
   * For any file, creating a backup and then restoring should recreate the original.
   */
  it('backup/restore round-trip preserves content', async () => {
    await fc.assert(
      fc.asyncProperty(
        filePathArb,
        fileContentArb,
        async (filePath, content) => {
          // Create the original file
          const fullPath = path.join(testDir, filePath);
          await fs.ensureDir(path.dirname(fullPath));
          await fs.writeFile(fullPath, content, 'utf-8');
          
          // Create backup
          const backupPath = await createBackup(testDir, filePath);
          expect(backupPath).toBeDefined();
          
          if (backupPath) {
            // Modify the original file
            const modifiedContent = content + '\n// MODIFIED';
            await fs.writeFile(fullPath, modifiedContent, 'utf-8');
            
            // Verify it was modified
            const modifiedRead = await fs.readFile(fullPath, 'utf-8');
            expect(modifiedRead).toBe(modifiedContent);
            
            // Restore from backup
            await restoreFromBackup(testDir, backupPath, filePath);
            
            // Content should be back to original
            const restoredContent = await fs.readFile(fullPath, 'utf-8');
            expect(restoredContent).toBe(content);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: scaforge, Property 11: Backup Creation on Update**
   * **Validates: Requirements 43.4**
   * 
   * Property: Backup Path Structure
   * Backup paths should be in the .scaforge/backups directory with timestamp.
   */
  it('backup paths follow expected structure', async () => {
    await fc.assert(
      fc.asyncProperty(
        filePathArb,
        fileContentArb,
        async (filePath, content) => {
          // Create the original file
          const fullPath = path.join(testDir, filePath);
          await fs.ensureDir(path.dirname(fullPath));
          await fs.writeFile(fullPath, content, 'utf-8');
          
          // Create backup
          const backupPath = await createBackup(testDir, filePath);
          
          if (backupPath) {
            // Backup path should start with .scaforge/backups
            expect(backupPath.startsWith('.scaforge/backups/')).toBe(true);
            
            // Should contain the original file path
            expect(backupPath.includes(filePath)).toBe(true);
            
            // Should end with .bak
            expect(backupPath.endsWith('.bak')).toBe(true);
            
            // Should contain a timestamp-like pattern
            expect(backupPath).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: scaforge, Property 11: Backup Creation on Update**
   * **Validates: Requirements 43.4**
   * 
   * Property: Backup of Non-Existent File
   * Creating a backup of a non-existent file should return null.
   */
  it('backup of non-existent file returns null', async () => {
    await fc.assert(
      fc.asyncProperty(
        filePathArb,
        async (filePath) => {
          // Ensure file doesn't exist
          const fullPath = path.join(testDir, filePath);
          if (await fs.pathExists(fullPath)) {
            await fs.remove(fullPath);
          }
          
          // Try to create backup
          const backupPath = await createBackup(testDir, filePath);
          
          // Should return null for non-existent file
          expect(backupPath).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: scaforge, Property 11: Backup Creation on Update**
   * **Validates: Requirements 43.4**
   * 
   * Property: Multiple Backups Have Different Timestamps
   * Creating multiple backups of the same file should result in different backup paths.
   */
  it('multiple backups have different timestamps', async () => {
    await fc.assert(
      fc.asyncProperty(
        filePathArb,
        fileContentArb,
        async (filePath, content) => {
          // Create the original file
          const fullPath = path.join(testDir, filePath);
          await fs.ensureDir(path.dirname(fullPath));
          await fs.writeFile(fullPath, content, 'utf-8');
          
          // Create first backup
          const backup1 = await createBackup(testDir, filePath);
          expect(backup1).toBeDefined();
          
          // Wait a small amount to ensure different timestamp
          await new Promise(resolve => setTimeout(resolve, 10));
          
          // Modify file slightly
          await fs.writeFile(fullPath, content + '\n// Modified', 'utf-8');
          
          // Create second backup
          const backup2 = await createBackup(testDir, filePath);
          expect(backup2).toBeDefined();
          
          // Backup paths should be different
          if (backup1 && backup2) {
            expect(backup1).not.toBe(backup2);
            
            // Both should exist
            expect(await fs.pathExists(path.join(testDir, backup1))).toBe(true);
            expect(await fs.pathExists(path.join(testDir, backup2))).toBe(true);
          }
        }
      ),
      { numRuns: 50 } // Fewer runs due to timing sensitivity
    );
  });

  /**
   * **Feature: scaforge, Property 11: Backup Creation on Update**
   * **Validates: Requirements 43.4**
   * 
   * Property: Generated File Tracking
   * Files written with writeGeneratedFile should be trackable and removable.
   */
  it('generated files are properly tracked', async () => {
    await fc.assert(
      fc.asyncProperty(
        filePathArb,
        fileContentArb,
        pluginNameArb,
        async (filePath, content, pluginName) => {
          // Write generated file
          await writeGeneratedFile(testDir, filePath, content, pluginName);
          
          // File should exist
          expect(await fileExists(testDir, filePath)).toBe(true);
          
          // Content should match
          const readContent = await readProjectFile(testDir, filePath);
          expect(readContent).toBe(content);
          
          // Should be able to remove it
          const removed = await removeGeneratedFile(testDir, filePath);
          expect(removed).toBe(true);
          
          // File should no longer exist
          expect(await fileExists(testDir, filePath)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});