# Uploadthing Storage Plugin

This plugin integrates Uploadthing with your Scaforge project, providing simple and secure file uploads with built-in CDN and image optimization.

## Features

- Simple file upload API
- Built-in CDN and image optimization
- Type-safe file handling
- Progress tracking
- File validation
- Multiple file types support
- Drag and drop interface

## Installation

```bash
npx scaforge add storage-uploadthing
```

## Configuration

The plugin will prompt you for:
- Uploadthing app ID
- Uploadthing token
- File size limits
- Allowed file types

## Usage

```typescript
import { UploadButton, UploadDropzone } from '@/components/uploadthing';

// Simple upload button
<UploadButton
  endpoint="imageUploader"
  onClientUploadComplete={(res) => {
    console.log("Files: ", res);
  }}
  onUploadError={(error: Error) => {
    alert(`ERROR! ${error.message}`);
  }}
/>

// Drag and drop zone
<UploadDropzone
  endpoint="imageUploader"
  onClientUploadComplete={(res) => {
    console.log("Files: ", res);
  }}
/>
```

## Environment Variables

Add these to your `.env.local`:

```
UPLOADTHING_SECRET=sk_live_...
UPLOADTHING_APP_ID=your_app_id
```