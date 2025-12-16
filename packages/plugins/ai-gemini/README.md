# Google Gemini Plugin for Scaforge

This plugin integrates Google's Gemini AI models into your Scaforge project, providing advanced AI capabilities including text generation, multimodal understanding, and function calling.

## Features

- 🧠 **Gemini Pro** - Advanced text generation and understanding
- 👁️ **Multimodal** - Process text, images, and other media together
- 🔧 **Function Calling** - Let AI call your functions and tools
- ⚡ **Streaming** - Real-time streaming responses
- 🛡️ **Safety Settings** - Built-in content filtering and safety controls
- 🎛️ **Configurable** - Customize models, temperature, and safety settings
- 📊 **Token Counting** - Monitor usage and costs

## Installation

```bash
npx scaforge add ai-gemini
```

## Configuration

The plugin will prompt you for configuration options during installation:

- **Default Model**: Choose your preferred Gemini model (gemini-pro, gemini-pro-vision)
- **Temperature**: Control randomness in responses (0.0 - 1.0)
- **Max Output Tokens**: Set default maximum response length
- **Enable Streaming**: Enable real-time response streaming
- **Enable Function Calling**: Allow AI to call your functions
- **Safety Settings**: Configure content filtering levels

## Environment Variables

Add these to your `.env.local`:

```env
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
```

## Usage

### Basic Text Generation

```tsx
import { useGemini } from '@/lib/gemini/hooks';

function ChatComponent() {
  const { generateContent, loading } = useGemini();
  
  const handleGenerate = async (prompt: string) => {
    const response = await generateContent(prompt);
    console.log(response.text);
  };
  
  return (
    <div>
      {/* Your chat UI */}
    </div>
  );
}
```

### Streaming Generation

```tsx
import { useGeminiStream } from '@/lib/gemini/hooks';

function StreamingChat() {
  const { streamContent, content, loading } = useGeminiStream();
  
  const handleStream = async (prompt: string) => {
    await streamContent(prompt);
  };
  
  return (
    <div>
      <div>{content}</div>
      {loading && <div>AI is thinking...</div>}
    </div>
  );
}
```

### Multimodal (Text + Images)

```tsx
import { useGeminiMultimodal } from '@/lib/gemini/hooks';

function MultimodalChat() {
  const { generateContent, loading } = useGeminiMultimodal();
  
  const handleAnalyzeImage = async (imageFile: File, prompt: string) => {
    const response = await generateContent([
      { text: prompt },
      { 
        inlineData: {
          mimeType: imageFile.type,
          data: await fileToBase64(imageFile)
        }
      }
    ]);
    console.log(response.text);
  };
  
  return (
    <div>
      {/* Your multimodal UI */}
    </div>
  );
}
```

### Function Calling

```tsx
import { gemini } from '@/lib/gemini/client';

const functions = [
  {
    name: 'get_weather',
    description: 'Get current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name' },
        unit: { type: 'string', enum: ['celsius', 'fahrenheit'] }
      },
      required: ['location']
    }
  }
];

const model = gemini.getGenerativeModel({ 
  model: 'gemini-pro',
  tools: [{ functionDeclarations: functions }]
});

const result = await model.generateContent('What\'s the weather in Tokyo?');
```

## API Reference

### Hooks

- `useGemini()` - Basic text generation
- `useGeminiStream()` - Streaming text generation
- `useGeminiMultimodal()` - Multimodal content generation
- `useGeminiChat()` - Multi-turn conversations
- `useGeminiTokenCount()` - Token counting and usage

### Components

- `<GeminiChat />` - Complete chat interface
- `<MultimodalInput />` - Text and image input
- `<SafetyIndicator />` - Content safety status
- `<TokenCounter />` - Usage monitoring

### Utilities

- `gemini` - Configured Gemini client
- `generateContent()` - Server-side generation
- `countTokens()` - Token counting
- `checkSafety()` - Content safety checking

## Examples

Check out the example components in `src/components/examples/gemini-example.tsx` for complete implementation examples.

## Documentation

- [Google AI Studio](https://makersuite.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Scaforge Documentation](https://scaforge.dev)