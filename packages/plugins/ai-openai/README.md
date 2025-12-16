# OpenAI Plugin for Scaforge

This plugin integrates OpenAI's GPT models into your Scaforge project, providing AI-powered chat, text completion, and other AI capabilities.

## Features

- 🤖 **Chat Completions** - Build conversational AI interfaces
- ✍️ **Text Completions** - Generate and complete text content
- 🎨 **Image Generation** - Create images with DALL-E
- 🔊 **Speech & Audio** - Text-to-speech and speech-to-text
- 🛠️ **Function Calling** - Let AI call your functions
- 📝 **Embeddings** - Generate text embeddings for semantic search
- ⚡ **Streaming** - Real-time streaming responses
- 🎛️ **Configurable** - Customize models, temperature, and more

## Installation

```bash
npx scaforge add ai-openai
```

## Configuration

The plugin will prompt you for configuration options during installation:

- **Default Model**: Choose your preferred GPT model (gpt-4, gpt-3.5-turbo, etc.)
- **Temperature**: Control randomness in responses (0.0 - 2.0)
- **Max Tokens**: Set default maximum response length
- **Enable Streaming**: Enable real-time response streaming
- **Enable Function Calling**: Allow AI to call your functions
- **Enable Image Generation**: Include DALL-E image generation
- **Enable Audio Features**: Include speech and transcription

## Environment Variables

Add these to your `.env.local`:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_ORGANIZATION=your_org_id_here # Optional
```

## Usage

### Basic Chat Completion

```tsx
import { useOpenAI } from '@/lib/openai/hooks';

function ChatComponent() {
  const { chat, loading } = useOpenAI();
  
  const handleSend = async (message: string) => {
    const response = await chat([
      { role: 'user', content: message }
    ]);
    console.log(response.content);
  };
  
  return (
    <div>
      {/* Your chat UI */}
    </div>
  );
}
```

### Streaming Chat

```tsx
import { useOpenAIStream } from '@/lib/openai/hooks';

function StreamingChat() {
  const { streamChat, content, loading } = useOpenAIStream();
  
  const handleStream = async (message: string) => {
    await streamChat([
      { role: 'user', content: message }
    ]);
  };
  
  return (
    <div>
      <div>{content}</div>
      {loading && <div>AI is typing...</div>}
    </div>
  );
}
```

### Function Calling

```tsx
import { openai } from '@/lib/openai/client';

const functions = [
  {
    name: 'get_weather',
    description: 'Get current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string' },
        unit: { type: 'string', enum: ['celsius', 'fahrenheit'] }
      },
      required: ['location']
    }
  }
];

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'What\'s the weather in Paris?' }],
  functions,
  function_call: 'auto'
});
```

### Image Generation

```tsx
import { useOpenAIImage } from '@/lib/openai/hooks';

function ImageGenerator() {
  const { generateImage, loading } = useOpenAIImage();
  
  const handleGenerate = async () => {
    const image = await generateImage({
      prompt: 'A beautiful sunset over mountains',
      size: '1024x1024',
      quality: 'hd'
    });
    console.log(image.url);
  };
  
  return (
    <button onClick={handleGenerate} disabled={loading}>
      Generate Image
    </button>
  );
}
```

## API Reference

### Hooks

- `useOpenAI()` - Basic chat completions
- `useOpenAIStream()` - Streaming chat completions  
- `useOpenAIImage()` - Image generation with DALL-E
- `useOpenAIAudio()` - Speech and transcription
- `useOpenAIEmbeddings()` - Text embeddings

### Components

- `<ChatInterface />` - Complete chat UI component
- `<CompletionInput />` - Text completion input
- `<ImageGenerator />` - Image generation interface
- `<AudioRecorder />` - Voice input component

### Utilities

- `openai` - Configured OpenAI client
- `createChatCompletion()` - Server-side chat
- `generateEmbeddings()` - Create embeddings
- `moderateContent()` - Content moderation

## Examples

Check out the example components in `src/components/examples/openai-example.tsx` for complete implementation examples.

## Documentation

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [OpenAI Node.js SDK](https://github.com/openai/openai-node)
- [Scaforge Documentation](https://scaforge.dev)