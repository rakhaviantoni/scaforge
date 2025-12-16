/**
 * Google Gemini Plugin for Scaforge
 * AI capabilities with Google's Gemini models including multimodal understanding
 */
import { z } from 'zod';
import { definePlugin } from '@scaforge/core';

export const aiGeminiPlugin = definePlugin({
  name: 'ai-gemini',
  displayName: 'Google Gemini',
  category: 'ai',
  description: 'AI capabilities with Google Gemini models and multimodal understanding',
  version: '1.0.0',
  
  supportedTemplates: ['nextjs', 'tanstack', 'nuxt', 'hydrogen'],
  
  packages: {
    dependencies: {
      '@google/generative-ai': '^0.2.1',
    },
  },
  
  configSchema: z.object({
    defaultModel: z.enum(['gemini-pro', 'gemini-pro-vision']).default('gemini-pro'),
    temperature: z.number().min(0).max(1).default(0.7),
    maxOutputTokens: z.number().min(1).max(2048).default(1000),
    enableStreaming: z.boolean().default(true),
    enableFunctionCalling: z.boolean().default(true),
    safetySettings: z.object({
      harassment: z.enum(['BLOCK_NONE', 'BLOCK_ONLY_HIGH', 'BLOCK_MEDIUM_AND_ABOVE', 'BLOCK_LOW_AND_ABOVE']).default('BLOCK_MEDIUM_AND_ABOVE'),
      hateSpeech: z.enum(['BLOCK_NONE', 'BLOCK_ONLY_HIGH', 'BLOCK_MEDIUM_AND_ABOVE', 'BLOCK_LOW_AND_ABOVE']).default('BLOCK_MEDIUM_AND_ABOVE'),
      sexuallyExplicit: z.enum(['BLOCK_NONE', 'BLOCK_ONLY_HIGH', 'BLOCK_MEDIUM_AND_ABOVE', 'BLOCK_LOW_AND_ABOVE']).default('BLOCK_MEDIUM_AND_ABOVE'),
      dangerousContent: z.enum(['BLOCK_NONE', 'BLOCK_ONLY_HIGH', 'BLOCK_MEDIUM_AND_ABOVE', 'BLOCK_LOW_AND_ABOVE']).default('BLOCK_MEDIUM_AND_ABOVE'),
    }).default({}),
  }),
  
  envVars: [
    {
      name: 'GOOGLE_AI_API_KEY',
      description: 'Google AI API key for Gemini',
      required: true,
      secret: true,
    },
  ],
  
  files: [
    // Gemini client configuration
    {
      path: 'src/lib/gemini/client.ts',
      template: `import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

if (!process.env.GOOGLE_AI_API_KEY) {
  throw new Error('GOOGLE_AI_API_KEY environment variable is required');
}

export const gemini = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

export const DEFAULT_CONFIG = {
  model: '{{options.defaultModel}}' as const,
  generationConfig: {
    temperature: {{options.temperature}},
    maxOutputTokens: {{options.maxOutputTokens}},
  },
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.{{options.safetySettings.harassment}},
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.{{options.safetySettings.hateSpeech}},
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.{{options.safetySettings.sexuallyExplicit}},
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.{{options.safetySettings.dangerousContent}},
    },
  ],
};

export type GeminiPart = {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
  fileData?: {
    mimeType: string;
    fileUri: string;
  };
};

export type GeminiMessage = {
  role: 'user' | 'model';
  parts: GeminiPart[];
};

export type GenerationOptions = {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  topK?: number;
  topP?: number;
  stopSequences?: string[];
};
`,
      overwrite: false,
    },
    
    // Gemini hooks for React
    {
      path: 'src/lib/gemini/hooks.ts',
      template: `'use client';

import { useState, useCallback } from 'react';
import { gemini, DEFAULT_CONFIG, type GeminiPart, type GeminiMessage, type GenerationOptions } from './client';

export function useGemini() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateContent = useCallback(async (
    prompt: string | GeminiPart[],
    options: GenerationOptions = {}
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const model = gemini.getGenerativeModel({
        model: options.model || DEFAULT_CONFIG.model,
        generationConfig: {
          ...DEFAULT_CONFIG.generationConfig,
          temperature: options.temperature,
          maxOutputTokens: options.maxOutputTokens,
          topK: options.topK,
          topP: options.topP,
          stopSequences: options.stopSequences,
        },
        safetySettings: DEFAULT_CONFIG.safetySettings,
      });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return {
        text: response.text(),
        candidates: response.candidates,
        promptFeedback: response.promptFeedback,
        safetyRatings: response.candidates?.[0]?.safetyRatings,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    generateContent,
    loading,
    error,
  };
}

export function useGeminiStream() {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const streamContent = useCallback(async (
    prompt: string | GeminiPart[],
    options: GenerationOptions = {}
  ) => {
    setLoading(true);
    setError(null);
    setContent('');
    
    try {
      const model = gemini.getGenerativeModel({
        model: options.model || DEFAULT_CONFIG.model,
        generationConfig: {
          ...DEFAULT_CONFIG.generationConfig,
          temperature: options.temperature,
          maxOutputTokens: options.maxOutputTokens,
        },
        safetySettings: DEFAULT_CONFIG.safetySettings,
      });

      const result = await model.generateContentStream(prompt);
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        setContent(prev => prev + chunkText);
      }
      
      return await result.response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setContent('');
    setError(null);
  }, []);

  return {
    streamContent,
    content,
    loading,
    error,
    reset,
  };
}

export function useGeminiMultimodal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateContent = useCallback(async (
    parts: GeminiPart[],
    options: GenerationOptions = {}
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const model = gemini.getGenerativeModel({
        model: 'gemini-pro-vision', // Always use vision model for multimodal
        generationConfig: {
          ...DEFAULT_CONFIG.generationConfig,
          temperature: options.temperature,
          maxOutputTokens: options.maxOutputTokens,
        },
        safetySettings: DEFAULT_CONFIG.safetySettings,
      });
      
      const result = await model.generateContent(parts);
      const response = await result.response;
      
      return {
        text: response.text(),
        candidates: response.candidates,
        promptFeedback: response.promptFeedback,
        safetyRatings: response.candidates?.[0]?.safetyRatings,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    generateContent,
    loading,
    error,
  };
}

export function useGeminiChat() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<GeminiMessage[]>([]);

  const startChat = useCallback(async (
    initialHistory: GeminiMessage[] = [],
    options: GenerationOptions = {}
  ) => {
    setHistory(initialHistory);
    
    const model = gemini.getGenerativeModel({
      model: options.model || DEFAULT_CONFIG.model,
      generationConfig: {
        ...DEFAULT_CONFIG.generationConfig,
        temperature: options.temperature,
        maxOutputTokens: options.maxOutputTokens,
      },
      safetySettings: DEFAULT_CONFIG.safetySettings,
    });

    return model.startChat({
      history: initialHistory,
    });
  }, []);

  const sendMessage = useCallback(async (
    chat: any,
    message: string | GeminiPart[]
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await chat.sendMessage(message);
      const response = await result.response;
      
      // Update history
      const userMessage: GeminiMessage = {
        role: 'user',
        parts: typeof message === 'string' ? [{ text: message }] : message,
      };
      const modelMessage: GeminiMessage = {
        role: 'model',
        parts: [{ text: response.text() }],
      };
      
      setHistory(prev => [...prev, userMessage, modelMessage]);
      
      return {
        text: response.text(),
        candidates: response.candidates,
        safetyRatings: response.candidates?.[0]?.safetyRatings,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setHistory([]);
    setError(null);
  }, []);

  return {
    startChat,
    sendMessage,
    history,
    loading,
    error,
    reset,
  };
}

export function useGeminiTokenCount() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const countTokens = useCallback(async (
    content: string | GeminiPart[],
    options: GenerationOptions = {}
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const model = gemini.getGenerativeModel({
        model: options.model || DEFAULT_CONFIG.model,
      });
      
      const result = await model.countTokens(content);
      
      return result.totalTokens;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    countTokens,
    loading,
    error,
  };
}
`,
      overwrite: false,
    },
    
    // Server-side utilities
    {
      path: 'src/lib/gemini/server.ts',
      template: `import { gemini, DEFAULT_CONFIG, type GeminiPart, type GenerationOptions } from './client';

export async function generateContent(
  prompt: string | GeminiPart[],
  options: GenerationOptions = {}
) {
  try {
    const model = gemini.getGenerativeModel({
      model: options.model || DEFAULT_CONFIG.model,
      generationConfig: {
        ...DEFAULT_CONFIG.generationConfig,
        temperature: options.temperature,
        maxOutputTokens: options.maxOutputTokens,
      },
      safetySettings: DEFAULT_CONFIG.safetySettings,
    });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return {
      text: response.text(),
      candidates: response.candidates,
      promptFeedback: response.promptFeedback,
      safetyRatings: response.candidates?.[0]?.safetyRatings,
    };
  } catch (error) {
    console.error('Gemini generation error:', error);
    throw error;
  }
}

export async function generateContentStream(
  prompt: string | GeminiPart[],
  options: GenerationOptions = {}
) {
  try {
    const model = gemini.getGenerativeModel({
      model: options.model || DEFAULT_CONFIG.model,
      generationConfig: {
        ...DEFAULT_CONFIG.generationConfig,
        temperature: options.temperature,
        maxOutputTokens: options.maxOutputTokens,
      },
      safetySettings: DEFAULT_CONFIG.safetySettings,
    });

    const result = await model.generateContentStream(prompt);
    return result.stream;
  } catch (error) {
    console.error('Gemini streaming error:', error);
    throw error;
  }
}

export async function countTokens(
  content: string | GeminiPart[],
  options: GenerationOptions = {}
) {
  try {
    const model = gemini.getGenerativeModel({
      model: options.model || DEFAULT_CONFIG.model,
    });
    
    const result = await model.countTokens(content);
    return result.totalTokens;
  } catch (error) {
    console.error('Gemini token counting error:', error);
    throw error;
  }
}

{{#if options.enableFunctionCalling}}
export type FunctionDeclaration = {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
};

export async function generateWithFunctions(
  prompt: string | GeminiPart[],
  functions: FunctionDeclaration[],
  options: GenerationOptions = {}
) {
  try {
    const model = gemini.getGenerativeModel({
      model: options.model || DEFAULT_CONFIG.model,
      generationConfig: {
        ...DEFAULT_CONFIG.generationConfig,
        temperature: options.temperature,
        maxOutputTokens: options.maxOutputTokens,
      },
      safetySettings: DEFAULT_CONFIG.safetySettings,
      tools: [{ functionDeclarations: functions }],
    });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return {
      text: response.text(),
      functionCalls: response.functionCalls(),
      candidates: response.candidates,
      safetyRatings: response.candidates?.[0]?.safetyRatings,
    };
  } catch (error) {
    console.error('Gemini function calling error:', error);
    throw error;
  }
}
{{/if}}

// Utility functions
export function fileToGenerativePart(file: File): Promise<GeminiPart> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          mimeType: file.type,
          data: base64Data,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function textToGenerativePart(text: string): GeminiPart {
  return { text };
}
`,
      overwrite: false,
    },
    
    // Gemini chat interface component
    {
      path: 'src/components/gemini/chat-interface.tsx',
      template: `'use client';

import { useState, useRef, useEffect } from 'react';
import { useGeminiChat } from '@/lib/gemini/hooks';
import type { GeminiMessage, GeminiPart } from '@/lib/gemini/client';

interface GeminiChatInterfaceProps {
  initialHistory?: GeminiMessage[];
  systemPrompt?: string;
  streaming?: boolean;
  placeholder?: string;
  className?: string;
  onMessageSent?: (message: string) => void;
  onResponseReceived?: (response: string) => void;
}

export function GeminiChatInterface({
  initialHistory = [],
  systemPrompt,
  streaming = {{options.enableStreaming}},
  placeholder = 'Type your message...',
  className = '',
  onMessageSent,
  onResponseReceived,
}: GeminiChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [chat, setChat] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { startChat, sendMessage, history, loading, error } = useGeminiChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  useEffect(() => {
    const initChat = async () => {
      let initialMessages = [...initialHistory];
      
      if (systemPrompt) {
        initialMessages.unshift({
          role: 'user',
          parts: [{ text: systemPrompt }],
        });
        initialMessages.push({
          role: 'model',
          parts: [{ text: 'I understand. How can I help you?' }],
        });
      }
      
      const chatSession = await startChat(initialMessages);
      setChat(chatSession);
    };
    
    initChat();
  }, [startChat, initialHistory, systemPrompt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !chat) return;

    const message = input.trim();
    setInput('');
    onMessageSent?.(message);

    try {
      const response = await sendMessage(chat, message);
      if (response) {
        onResponseReceived?.(response.text);
      }
    } catch (error) {
      console.error('Chat error:', error);
    }
  };

  return (
    <div className={\`flex flex-col h-full \${className}\`}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {history
          .filter((msg, index) => {
            // Skip system prompt messages
            if (systemPrompt && index < 2) return false;
            return true;
          })
          .map((message, index) => (
            <div
              key={index}
              className={\`flex \${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }\`}
            >
              <div
                className={\`max-w-xs lg:max-w-md px-4 py-2 rounded-lg \${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }\`}
              >
                <p className="text-sm whitespace-pre-wrap">
                  {message.parts.map(part => part.text).join('')}
                </p>
              </div>
            </div>
          ))}
        
        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-200 text-gray-900">
              <div className="animate-pulse flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="flex justify-center">
            <div className="px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm">
              Error: {error}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={loading || !chat}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || !chat}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
`,
      overwrite: false,
    },
    
    // Multimodal input component
    {
      path: 'src/components/gemini/multimodal-input.tsx',
      template: `'use client';

import { useState, useRef } from 'react';
import { useGeminiMultimodal } from '@/lib/gemini/hooks';
import { fileToGenerativePart, textToGenerativePart } from '@/lib/gemini/server';
import type { GeminiPart } from '@/lib/gemini/client';

interface MultimodalInputProps {
  className?: string;
  onResponse?: (response: string) => void;
  placeholder?: string;
}

export function MultimodalInput({
  className = '',
  onResponse,
  placeholder = 'Describe what you want to know about the image...',
}: MultimodalInputProps) {
  const [text, setText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [response, setResponse] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { generateContent, loading, error } = useGeminiMultimodal();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setSelectedFiles(imageFiles);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && selectedFiles.length === 0) || loading) return;

    try {
      const parts: GeminiPart[] = [];
      
      // Add text if provided
      if (text.trim()) {
        parts.push(textToGenerativePart(text.trim()));
      }
      
      // Add images
      for (const file of selectedFiles) {
        const imagePart = await fileToGenerativePart(file);
        parts.push(imagePart);
      }
      
      const result = await generateContent(parts);
      setResponse(result.text);
      onResponse?.(result.text);
      
      // Clear inputs
      setText('');
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Multimodal generation error:', error);
    }
  };

  return (
    <div className={\`space-y-4 \${className}\`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Text Input */}
        <div>
          <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 mb-2">
            Text Prompt
          </label>
          <textarea
            id="text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        {/* File Input */}
        <div>
          <label htmlFor="file-input" className="block text-sm font-medium text-gray-700 mb-2">
            Images (optional)
          </label>
          <input
            ref={fileInputRef}
            id="file-input"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Selected Images:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={\`Selected \${index + 1}\`}
                    className="w-full h-20 object-cover rounded-md border"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                    disabled={loading}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={(!text.trim() && selectedFiles.length === 0) || loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Response */}
      {response && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            AI Response:
          </label>
          <div className="p-4 bg-gray-50 border rounded-md">
            <p className="text-gray-900 whitespace-pre-wrap">{response}</p>
          </div>
        </div>
      )}
    </div>
  );
}
`,
      overwrite: false,
    },
    
    // Example usage component
    {
      path: 'src/components/examples/gemini-example.tsx',
      template: `'use client';

import { useState } from 'react';
import { GeminiChatInterface } from '@/components/gemini/chat-interface';
import { MultimodalInput } from '@/components/gemini/multimodal-input';
import { useGemini, useGeminiTokenCount } from '@/lib/gemini/hooks';

export function GeminiExample() {
  const [activeTab, setActiveTab] = useState<'chat' | 'completion' | 'multimodal' | 'tokens'>('chat');
  const [completionInput, setCompletionInput] = useState('');
  const [completionResult, setCompletionResult] = useState('');
  const [tokenCount, setTokenCount] = useState<number | null>(null);
  
  const { generateContent, loading: completionLoading } = useGemini();
  const { countTokens, loading: tokenLoading } = useGeminiTokenCount();

  const handleCompletion = async () => {
    if (!completionInput.trim() || completionLoading) return;
    
    try {
      const result = await generateContent(completionInput);
      setCompletionResult(result.text);
    } catch (error) {
      console.error('Completion error:', error);
      setCompletionResult('Error generating completion');
    }
  };

  const handleTokenCount = async () => {
    if (!completionInput.trim() || tokenLoading) return;
    
    try {
      const count = await countTokens(completionInput);
      setTokenCount(count);
    } catch (error) {
      console.error('Token counting error:', error);
      setTokenCount(null);
    }
  };

  const tabs = [
    { id: 'chat', label: 'Chat' },
    { id: 'completion', label: 'Text Generation' },
    { id: 'multimodal', label: 'Multimodal' },
    { id: 'tokens', label: 'Token Counter' },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Google Gemini Integration</h1>
        <p className="text-gray-600">
          Explore AI capabilities with Google's Gemini models including multimodal understanding.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={\`py-2 px-1 border-b-2 font-medium text-sm \${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }\`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border">
        {activeTab === 'chat' && (
          <div className="h-96">
            <GeminiChatInterface
              systemPrompt="You are a helpful AI assistant powered by Google Gemini. Be concise and friendly."
              placeholder="Ask me anything..."
              className="h-full"
            />
          </div>
        )}

        {activeTab === 'completion' && (
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="completion-input" className="block text-sm font-medium text-gray-700 mb-2">
                Text Prompt
              </label>
              <textarea
                id="completion-input"
                value={completionInput}
                onChange={(e) => setCompletionInput(e.target.value)}
                placeholder="Enter a prompt for text generation..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              onClick={handleCompletion}
              disabled={!completionInput.trim() || completionLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {completionLoading ? 'Generating...' : 'Generate Text'}
            </button>

            {completionResult && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generated Text:
                </label>
                <div className="p-3 bg-gray-50 border rounded-md">
                  <p className="text-gray-900 whitespace-pre-wrap">{completionResult}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'multimodal' && (
          <div className="p-6">
            <MultimodalInput />
          </div>
        )}

        {activeTab === 'tokens' && (
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="token-input" className="block text-sm font-medium text-gray-700 mb-2">
                Text to Count Tokens
              </label>
              <textarea
                id="token-input"
                value={completionInput}
                onChange={(e) => setCompletionInput(e.target.value)}
                placeholder="Enter text to count tokens..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              onClick={handleTokenCount}
              disabled={!completionInput.trim() || tokenLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            >
              {tokenLoading ? 'Counting...' : 'Count Tokens'}
            </button>

            {tokenCount !== null && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-blue-800">
                  <strong>Token Count:</strong> {tokenCount} tokens
                </p>
                <p className="text-blue-600 text-sm mt-1">
                  This helps you estimate API costs and stay within model limits.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <p className="text-green-800 font-medium">✅ Google Gemini is configured and ready!</p>
        <p className="text-green-600 text-sm mt-1">
          Model: {{options.defaultModel}} | Temperature: {{options.temperature}} | Max Tokens: {{options.maxOutputTokens}}
        </p>
      </div>
    </div>
  );
}
`,
      overwrite: false,
    },
  ],
  
  integrations: [
    {
      plugin: 'auth-*',
      type: 'hook',
      files: [
        {
          path: 'src/lib/gemini/auth-integration.ts',
          template: `import { useEffect } from 'react';
import type { GeminiPart } from './client';

export function useGeminiAuth(user: any) {
  // Add user context to prompts
  const addUserContext = (prompt: string | GeminiPart[]): GeminiPart[] => {
    if (!user) {
      return typeof prompt === 'string' ? [{ text: prompt }] : prompt;
    }
    
    const userContextText = \`User context: ID=\${user.id}, Email=\${user.email}, Name=\${user.name || 'Unknown'}\`;
    const userContextPart: GeminiPart = { text: userContextText };
    
    if (typeof prompt === 'string') {
      return [userContextPart, { text: prompt }];
    }
    
    // Check if user context already exists
    const hasUserContext = prompt.some(
      part => part.text?.includes('User context:')
    );
    
    if (!hasUserContext) {
      return [userContextPart, ...prompt];
    }
    
    return prompt;
  };

  return { addUserContext };
}
`,
        },
      ],
    },
  ],
  
  postInstall: `🧠 Google Gemini has been configured successfully!

Next steps:
1. Get your Google AI API key:
   - Visit https://makersuite.google.com/app/apikey
   - Create a new API key
   - Add it to your environment variables:
   
   \`\`\`env
   GOOGLE_AI_API_KEY=your_google_ai_api_key_here
   \`\`\`

2. Start using Gemini in your components:
   \`\`\`tsx
   import { useGemini } from '@/lib/gemini/hooks';
   
   const { generateContent, loading } = useGemini();
   const response = await generateContent('Hello, Gemini!');
   \`\`\`

3. Try multimodal capabilities:
   \`\`\`tsx
   import { useGeminiMultimodal } from '@/lib/gemini/hooks';
   
   const { generateContent } = useGeminiMultimodal();
   const response = await generateContent([
     { text: 'What do you see in this image?' },
     { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
   ]);
   \`\`\`

4. Try the example component:
   \`\`\`tsx
   import { GeminiExample } from '@/components/examples/gemini-example';
   
   <GeminiExample />
   \`\`\`

Configuration:
- Default Model: {{options.defaultModel}}
- Temperature: {{options.temperature}}
- Max Output Tokens: {{options.maxOutputTokens}}
- Streaming: {{options.enableStreaming}}
{{#if options.enableFunctionCalling}}
- Function Calling: Enabled
{{/if}}

Safety Settings:
- Harassment: {{options.safetySettings.harassment}}
- Hate Speech: {{options.safetySettings.hateSpeech}}
- Sexually Explicit: {{options.safetySettings.sexuallyExplicit}}
- Dangerous Content: {{options.safetySettings.dangerousContent}}

Documentation: https://ai.google.dev/docs`,
});

export default aiGeminiPlugin;