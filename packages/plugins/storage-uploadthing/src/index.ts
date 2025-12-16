/**
 * Uploadthing Storage Plugin for Scaforge
 * Simple and secure file uploads with built-in CDN
 */
import { z } from 'zod';
import { definePlugin } from '@scaforge/core';

export const storageUploadthingPlugin = definePlugin({
  name: 'storage-uploadthing',
  displayName: 'Uploadthing Storage',
  category: 'storage',
  description: 'Simple and secure file uploads with built-in CDN',
  version: '1.0.0',
  
  supportedTemplates: ['nextjs', 'tanstack', 'nuxt', 'hydrogen'],
  
  packages: {
    dependencies: {
      'uploadthing': '^6.7.0',
      '@uploadthing/react': '^6.7.0',
    },
  },
  
  configSchema: z.object({
    maxFileSize: z.string().default('4MB'),
    maxFileCount: z.number().default(1),
    allowedFileTypes: z.array(z.string()).default(['image']),
    enableImageOptimization: z.boolean().default(true),
    enableProgressTracking: z.boolean().default(true),
  }),
  
  envVars: [
    {
      name: 'UPLOADTHING_SECRET',
      description: 'Uploadthing secret key',
      required: true,
      secret: true,
    },
    {
      name: 'UPLOADTHING_APP_ID',
      description: 'Uploadthing app ID',
      required: true,
    },
  ],
  
  files: [
    // Uploadthing core configuration
    {
      path: 'src/lib/uploadthing/core.ts',
      template: `import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';
{{#if (hasPlugin 'auth-authjs')}}
import { auth } from '@/auth';
{{/if}}
{{#if (hasPlugin 'auth-clerk')}}
import { getAuth } from '@clerk/nextjs/server';
{{/if}}

const f = createUploadthing();

// Fake auth function for demo
const auth = async (req: Request) => {
  {{#if (hasPlugin 'auth-authjs')}}
  const session = await auth();
  return { id: session?.user?.id };
  {{else if (hasPlugin 'auth-clerk')}}
  const { userId } = getAuth(req);
  return { id: userId };
  {{else}}
  // Replace with your auth logic
  return { id: 'user-123' };
  {{/if}}
};

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({
    image: {
      maxFileSize: '{{options.maxFileSize}}',
      maxFileCount: {{options.maxFileCount}},
    },
  })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const user = await auth(req);

      // If you throw, the user will not be able to upload
      if (!user) throw new UploadThingError('Unauthorized');

      // Whatever is returned here is accessible in onUploadComplete as \`metadata\`
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log('Upload complete for userId:', metadata.userId);
      console.log('file url', file.url);

      // !!! Whatever is returned here is sent to the clientside \`onClientUploadComplete\` callback
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // Multiple file uploader
  multipleFileUploader: f({
    {{#each options.allowedFileTypes}}
    {{this}}: {
      maxFileSize: '{{../options.maxFileSize}}',
      maxFileCount: {{../options.maxFileCount}},
    },
    {{/each}}
  })
    .middleware(async ({ req }) => {
      const user = await auth(req);
      if (!user) throw new UploadThingError('Unauthorized');
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete for userId:', metadata.userId);
      console.log('file url', file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // PDF uploader
  pdfUploader: f({
    pdf: {
      maxFileSize: '16MB',
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const user = await auth(req);
      if (!user) throw new UploadThingError('Unauthorized');
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('PDF upload complete for userId:', metadata.userId);
      console.log('file url', file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
`,
      overwrite: false,
    },
    
    // Uploadthing API route
    {
      path: 'src/app/api/uploadthing/route.ts',
      template: `import { createRouteHandler } from 'uploadthing/next';
import { ourFileRouter } from '@/lib/uploadthing/core';

// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  
  // Apply an (optional) custom config:
  // config: { ... },
});
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Uploadthing client utilities
    {
      path: 'src/lib/uploadthing/utils.ts',
      template: `import {
  generateUploadButton,
  generateUploadDropzone,
} from '@uploadthing/react';
import type { OurFileRouter } from './core';

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

// Utility functions
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

export function isImageFile(filename: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const extension = getFileExtension(filename).toLowerCase();
  return imageExtensions.includes(extension);
}

export function isPdfFile(filename: string): boolean {
  return getFileExtension(filename).toLowerCase() === 'pdf';
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  const fileType = file.type.split('/')[0];
  return allowedTypes.includes(fileType) || allowedTypes.includes(file.type);
}

export function validateFileSize(file: File, maxSize: string): boolean {
  const maxSizeInBytes = parseFileSize(maxSize);
  return file.size <= maxSizeInBytes;
}

function parseFileSize(size: string): number {
  const units: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
  };
  
  const match = size.match(/^(\\d+(?:\\.\\d+)?)\\s*(B|KB|MB|GB)$/i);
  if (!match) return 0;
  
  const [, value, unit] = match;
  return parseFloat(value) * (units[unit.toUpperCase()] || 1);
}
`,
      overwrite: false,
    },
    
    // Upload components
    {
      path: 'src/components/uploadthing/upload-button.tsx',
      template: `'use client';

import { UploadButton as UTUploadButton } from '@/lib/uploadthing/utils';
import type { OurFileRouter } from '@/lib/uploadthing/core';

interface UploadButtonProps {
  endpoint: keyof OurFileRouter;
  onClientUploadComplete?: (res: any) => void;
  onUploadError?: (error: Error) => void;
  onUploadBegin?: (name: string) => void;
  onUploadProgress?: (progress: number) => void;
  className?: string;
  appearance?: {
    button?: string;
    container?: string;
    allowedContent?: string;
  };
}

export function UploadButton({
  endpoint,
  onClientUploadComplete,
  onUploadError,
  onUploadBegin,
  onUploadProgress,
  className,
  appearance,
}: UploadButtonProps) {
  return (
    <UTUploadButton
      endpoint={endpoint}
      onClientUploadComplete={onClientUploadComplete}
      onUploadError={onUploadError}
      onUploadBegin={onUploadBegin}
      {{#if options.enableProgressTracking}}
      onUploadProgress={onUploadProgress}
      {{/if}}
      className={className}
      appearance={{
        button: \`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors \${appearance?.button || ''}\`,
        container: \`flex flex-col items-center gap-2 \${appearance?.container || ''}\`,
        allowedContent: \`text-sm text-gray-600 \${appearance?.allowedContent || ''}\`,
        ...appearance,
      }}
    />
  );
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    {
      path: 'src/components/uploadthing/upload-dropzone.tsx',
      template: `'use client';

import { UploadDropzone as UTUploadDropzone } from '@/lib/uploadthing/utils';
import type { OurFileRouter } from '@/lib/uploadthing/core';

interface UploadDropzoneProps {
  endpoint: keyof OurFileRouter;
  onClientUploadComplete?: (res: any) => void;
  onUploadError?: (error: Error) => void;
  onUploadBegin?: (name: string) => void;
  onUploadProgress?: (progress: number) => void;
  className?: string;
  appearance?: {
    container?: string;
    uploadIcon?: string;
    label?: string;
    allowedContent?: string;
    button?: string;
  };
}

export function UploadDropzone({
  endpoint,
  onClientUploadComplete,
  onUploadError,
  onUploadBegin,
  onUploadProgress,
  className,
  appearance,
}: UploadDropzoneProps) {
  return (
    <UTUploadDropzone
      endpoint={endpoint}
      onClientUploadComplete={onClientUploadComplete}
      onUploadError={onUploadError}
      onUploadBegin={onUploadBegin}
      {{#if options.enableProgressTracking}}
      onUploadProgress={onUploadProgress}
      {{/if}}
      className={className}
      appearance={{
        container: \`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors \${appearance?.container || ''}\`,
        uploadIcon: \`text-gray-400 mb-4 \${appearance?.uploadIcon || ''}\`,
        label: \`text-lg font-medium text-gray-700 mb-2 \${appearance?.label || ''}\`,
        allowedContent: \`text-sm text-gray-500 \${appearance?.allowedContent || ''}\`,
        button: \`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors mt-4 \${appearance?.button || ''}\`,
        ...appearance,
      }}
    />
  );
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // File preview component
    {
      path: 'src/components/uploadthing/file-preview.tsx',
      template: `'use client';

import { useState } from 'react';
import { formatFileSize, isImageFile, isPdfFile } from '@/lib/uploadthing/utils';

interface FilePreviewProps {
  files: Array<{
    name: string;
    size: number;
    url: string;
    type?: string;
  }>;
  onRemove?: (index: number) => void;
  className?: string;
}

export function FilePreview({ files, onRemove, className }: FilePreviewProps) {
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set(prev).add(index));
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <div className={\`space-y-3 \${className || ''}\`}>
      <h3 className="text-sm font-medium text-gray-700">Uploaded Files</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {files.map((file, index) => (
          <div
            key={index}
            className="relative border border-gray-200 rounded-lg p-3 bg-white shadow-sm"
          >
            {onRemove && (
              <button
                onClick={() => onRemove(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                aria-label="Remove file"
              >
                ×
              </button>
            )}
            
            <div className="flex items-start space-x-3">
              {/* File thumbnail */}
              <div className="flex-shrink-0">
                {isImageFile(file.name) && !imageErrors.has(index) ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-12 h-12 object-cover rounded"
                    onError={() => handleImageError(index)}
                  />
                ) : isPdfFile(file.name) ? (
                  <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center">
                    <span className="text-red-600 text-xs font-bold">PDF</span>
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                    <span className="text-gray-600 text-xs font-bold">FILE</span>
                  </div>
                )}
              </div>
              
              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  View file
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Example usage component
    {
      path: 'src/components/examples/uploadthing-example.tsx',
      template: `'use client';

import { useState } from 'react';
import { UploadButton } from '@/components/uploadthing/upload-button';
import { UploadDropzone } from '@/components/uploadthing/upload-dropzone';
import { FilePreview } from '@/components/uploadthing/file-preview';

interface UploadedFile {
  name: string;
  size: number;
  url: string;
  type?: string;
}

export function UploadthingExample() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadMode, setUploadMode] = useState<'button' | 'dropzone'>('button');

  const handleUploadComplete = (res: any) => {
    console.log('Files uploaded:', res);
    
    if (res && Array.isArray(res)) {
      const newFiles = res.map((file: any) => ({
        name: file.name || 'Unknown',
        size: file.size || 0,
        url: file.url,
        type: file.type,
      }));
      
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleUploadError = (error: Error) => {
    console.error('Upload error:', error);
    alert(\`Upload failed: \${error.message}\`);
  };

  const handleUploadBegin = (name: string) => {
    console.log('Upload started for:', name);
  };

  const handleUploadProgress = (progress: number) => {
    console.log('Upload progress:', progress);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold mb-6">Uploadthing File Upload</h2>
      
      {/* Upload mode toggle */}
      <div className="mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setUploadMode('button')}
            className={\`px-4 py-2 rounded-md text-sm font-medium transition-colors \${
              uploadMode === 'button'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }\`}
          >
            Upload Button
          </button>
          <button
            onClick={() => setUploadMode('dropzone')}
            className={\`px-4 py-2 rounded-md text-sm font-medium transition-colors \${
              uploadMode === 'dropzone'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }\`}
          >
            Drag & Drop
          </button>
        </div>
      </div>

      {/* Upload interface */}
      <div className="mb-6">
        {uploadMode === 'button' ? (
          <div className="text-center">
            <UploadButton
              endpoint="imageUploader"
              onClientUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              onUploadBegin={handleUploadBegin}
              {{#if options.enableProgressTracking}}
              onUploadProgress={handleUploadProgress}
              {{/if}}
            />
            <p className="text-sm text-gray-500 mt-2">
              Click to upload images (max {{options.maxFileSize}})
            </p>
          </div>
        ) : (
          <div>
            <UploadDropzone
              endpoint="multipleFileUploader"
              onClientUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              onUploadBegin={handleUploadBegin}
              {{#if options.enableProgressTracking}}
              onUploadProgress={handleUploadProgress}
              {{/if}}
            />
            <p className="text-sm text-gray-500 mt-2 text-center">
              Drag and drop files or click to browse (max {{options.maxFileSize}})
            </p>
          </div>
        )}
      </div>

      {/* Additional upload options */}
      <div className="mb-6 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">PDF Upload</h3>
          <UploadButton
            endpoint="pdfUploader"
            onClientUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            appearance={{
              button: 'bg-red-600 hover:bg-red-700',
            }}
          />
          <p className="text-xs text-gray-500 mt-1">
            Upload PDF files (max 16MB)
          </p>
        </div>
      </div>

      {/* File preview */}
      {uploadedFiles.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">
              Uploaded Files ({uploadedFiles.length})
            </h3>
            <button
              onClick={clearAllFiles}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear All
            </button>
          </div>
          
          <FilePreview
            files={uploadedFiles}
            onRemove={removeFile}
          />
        </div>
      )}

      {/* Status */}
      <div className="text-sm text-gray-500">
        <p>✅ Uploadthing is configured and ready!</p>
        <p className="mt-1">
          Supports: {{#each options.allowedFileTypes}}{{this}}{{#unless @last}}, {{/unless}}{{/each}} files
        </p>
        {{#if options.enableImageOptimization}}
        <p className="mt-1">
          🖼️ Image optimization enabled
        </p>
        {{/if}}
      </div>
    </div>
  );
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
  ],
  
  postInstall: `🚀 Uploadthing Storage has been configured successfully!

Next steps:
1. Set up your Uploadthing account:
   - Visit https://uploadthing.com
   - Create a new app
   - Get your App ID and Secret from the dashboard
   - Add them to your environment variables

2. Configure file routes:
   - Edit src/lib/uploadthing/core.ts
   - Add or modify file upload endpoints
   - Set file size limits and allowed types

3. Customize upload components:
   - Use UploadButton for simple uploads
   - Use UploadDropzone for drag & drop
   - Customize appearance and behavior

Example usage:
\`\`\`tsx
import { UploadButton, UploadDropzone } from '@/components/uploadthing';

// Simple upload button
<UploadButton
  endpoint="imageUploader"
  onClientUploadComplete={(res) => {
    console.log("Files: ", res);
  }}
  onUploadError={(error) => {
    alert(\`ERROR! \${error.message}\`);
  }}
/>

// Drag and drop zone
<UploadDropzone
  endpoint="multipleFileUploader"
  onClientUploadComplete={(res) => {
    console.log("Files: ", res);
  }}
/>
\`\`\`

Features:
- Built-in CDN and image optimization
- Type-safe file handling
- Progress tracking
- File validation
- Multiple file types support

Documentation: https://docs.uploadthing.com`,
});

export default storageUploadthingPlugin;