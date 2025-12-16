/**
 * OpenAI Plugin for Scaforge
 * AI capabilities with OpenAI API
 */
import { z } from 'zod';
import { definePlugin } from '@scaforge/core';

export const aiOpenaiPlugin = definePlugin({
  name: 'ai-openai',
  displayName: 'OpenAI',
  category: 'ai',
  description: 'AI capabilities with OpenAI API including GPT, DALL-E, and Whisper',
  version: '1.0.0',
  
  supportedTemplates: ['nextjs', 'tanstack', 'nuxt', 'hydrogen'],
  
  packages: {
    dependencies: {
      'openai': '^4.20.0',
      'ai': '^3.0.0',
    },
  },
  
  configSchema: z.object({
    defaultModel: z.string().default('gpt-4-turbo-preview'),
    maxTokens: z.number().default(4096),
    temperature: z.number().default(0.7),
    enableStreaming: z.boolean().default(true),
  }),
  
  envVars: [
    {
      name: 'OPENAI_API_KEY',
      description: 'OpenAI API key',
      required: true,
      secret: true,
    },
  ],
  
  files: [
    {
      path: 'src/lib/openai/client.ts',
      template: `import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateCompletion(prompt: string, options?: {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}) {
  const response = await openai.chat.completions.create({
    model: options?.model || '{{options.defaultModel}}',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: options?.maxTokens || {{options.maxTokens}},
    temperature: options?.temperature || {{options.temperature}},
  });
  
  return response.choices[0]?.message?.content || '';
}
`,
      overwrite: false,
    },
    {
      path: 'src/lib/openai/hooks.ts',
      template: `'use client';

import { useState, useCallback } from 'react';

export function useOpenAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const generate = useCallback(async (prompt: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      
      if (!response.ok) throw new Error('Failed to generate');
      
      const data = await response.json();
      return data.content;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { generate, loading, error };
}
`,
      overwrite: false,
    },
    {
      path: 'src/app/api/ai/generate/route.ts',
      template: `import { NextRequest, NextResponse } from 'next/server';
import { generateCompletion } from '@/lib/openai/client';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }
    
    const content = await generateCompletion(prompt);
    
    return NextResponse.json({ content });
  } catch (error) {
    console.error('OpenAI error:', error);
    return NextResponse.json({ error: 'Failed to generate' }, { status: 500 });
  }
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
  ],
  
  postInstall: `🤖 OpenAI has been configured successfully!

Next steps:
1. Add your OPENAI_API_KEY to your environment variables
2. Use the generateCompletion function or useOpenAI hook in your app

Documentation: https://platform.openai.com/docs`,
});

export default aiOpenaiPlugin;
