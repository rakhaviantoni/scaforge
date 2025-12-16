# Pusher Real-time Plugin for Scaforge

This plugin integrates Pusher into your Scaforge project, providing real-time WebSocket functionality for building collaborative features, live updates, and interactive applications.

## Features

- 🔄 **Real-time Messaging** - Send and receive messages instantly
- 👥 **Presence Channels** - Track who's online and active
- 🔒 **Private Channels** - Secure real-time communication
- 📡 **Channel Events** - Custom event broadcasting
- 🎯 **Targeted Messaging** - Send messages to specific users
- 🛡️ **Authentication** - Secure channel access with auth
- 📊 **Connection Status** - Monitor connection state
- 🎛️ **Configurable** - Customize cluster, encryption, and more

## Installation

```bash
npx scaforge add realtime-pusher
```

## Configuration

The plugin will prompt you for configuration options during installation:

- **Cluster**: Choose your Pusher cluster (us2, eu, ap1, etc.)
- **Enable Encryption**: Encrypt messages for security
- **Enable Presence**: Track user presence in channels
- **Enable Private Channels**: Support authenticated channels
- **Debug Mode**: Enable debug logging for development

## Environment Variables

Add these to your `.env.local`:

```env
# Client-side (public)
NEXT_PUBLIC_PUSHER_APP_KEY=your_pusher_app_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster

# Server-side (private)
PUSHER_APP_ID=your_app_id
PUSHER_SECRET=your_secret_key
```

## Usage

### Basic Real-time Messaging

```tsx
import { usePusher, useChannel } from '@/lib/pusher/hooks';

function ChatComponent() {
  const pusher = usePusher();
  const channel = useChannel('chat-room');
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    if (channel) {
      channel.bind('new-message', (data) => {
        setMessages(prev => [...prev, data]);
      });
    }
  }, [channel]);
  
  const sendMessage = (message) => {
    // Trigger from client or use server endpoint
    fetch('/api/pusher/send-message', {
      method: 'POST',
      body: JSON.stringify({ message, channel: 'chat-room' })
    });
  };
  
  return (
    <div>
      {/* Your chat UI */}
    </div>
  );
}
```

### Presence Channels

```tsx
import { usePresenceChannel } from '@/lib/pusher/hooks';

function OnlineUsers() {
  const { channel, members, me } = usePresenceChannel('presence-room', {
    user_id: userId,
    user_info: { name: userName }
  });
  
  return (
    <div>
      <h3>Online Users ({members.length})</h3>
      {members.map(member => (
        <div key={member.id}>
          {member.info.name} {member.id === me?.id && '(You)'}
        </div>
      ))}
    </div>
  );
}
```

### Private Channels

```tsx
import { usePrivateChannel } from '@/lib/pusher/hooks';

function PrivateChat() {
  const channel = usePrivateChannel('private-user-123');
  
  useEffect(() => {
    if (channel) {
      channel.bind('private-message', (data) => {
        console.log('Private message:', data);
      });
    }
  }, [channel]);
  
  return <div>Private chat interface</div>;
}
```

### Server-side Broadcasting

```tsx
// pages/api/pusher/broadcast.ts
import { pusherServer } from '@/lib/pusher/server';

export default async function handler(req, res) {
  const { channel, event, data } = req.body;
  
  await pusherServer.trigger(channel, event, data);
  
  res.json({ success: true });
}
```

## API Reference

### Hooks

- `usePusher()` - Get Pusher client instance
- `useChannel(channelName)` - Subscribe to public channel
- `usePrivateChannel(channelName)` - Subscribe to private channel
- `usePresenceChannel(channelName, userInfo)` - Subscribe to presence channel
- `usePusherConnection()` - Monitor connection status

### Components

- `<PusherProvider />` - Pusher context provider
- `<ConnectionStatus />` - Connection indicator
- `<PresenceIndicator />` - Show online users
- `<RealtimeChat />` - Complete chat component

### Server Utilities

- `pusherServer` - Server-side Pusher instance
- `authenticateUser()` - Authenticate private/presence channels
- `broadcastToChannel()` - Send messages to channels
- `getUserChannels()` - Get user's active channels

## Examples

Check out the example components in `src/components/examples/pusher-example.tsx` for complete implementation examples.

## Documentation

- [Pusher Documentation](https://pusher.com/docs)
- [Pusher JavaScript SDK](https://github.com/pusher/pusher-js)
- [Scaforge Documentation](https://scaforge.dev)