/**
 * Pusher Real-time Plugin for Scaforge
 * Real-time WebSocket functionality with Pusher for collaborative features
 */
import { z } from 'zod';
import { definePlugin } from '@scaforge/core';

export const realtimePusherPlugin = definePlugin({
  name: 'realtime-pusher',
  displayName: 'Pusher Real-time',
  category: 'realtime',
  description: 'Real-time WebSocket functionality with Pusher for collaborative features',
  version: '1.0.0',
  
  supportedTemplates: ['nextjs', 'tanstack', 'nuxt', 'hydrogen'],
  
  packages: {
    dependencies: {
      'pusher': '^5.2.0',
      'pusher-js': '^8.4.0-beta',
    },
  },
  
  configSchema: z.object({
    cluster: z.string().default('us2'),
    enableEncryption: z.boolean().default(false),
    enablePresence: z.boolean().default(true),
    enablePrivateChannels: z.boolean().default(true),
    debugMode: z.boolean().default(false),
    maxReconnectionAttempts: z.number().min(1).max(10).default(6),
    activityTimeout: z.number().min(1000).max(120000).default(120000),
    pongTimeout: z.number().min(1000).max(30000).default(30000),
  }),
  
  envVars: [
    {
      name: 'NEXT_PUBLIC_PUSHER_APP_KEY',
      description: 'Pusher application key (public)',
      required: true,
    },
    {
      name: 'NEXT_PUBLIC_PUSHER_CLUSTER',
      description: 'Pusher cluster (e.g., us2, eu, ap1)',
      required: true,
      default: 'us2',
    },
    {
      name: 'PUSHER_APP_ID',
      description: 'Pusher application ID (server-side)',
      required: true,
      secret: true,
    },
    {
      name: 'PUSHER_SECRET',
      description: 'Pusher secret key (server-side)',
      required: true,
      secret: true,
    },
  ],
  
  files: [
    // Pusher client configuration
    {
      path: 'src/lib/pusher/client.ts',
      template: `'use client';

import Pusher from 'pusher-js';

if (!process.env.NEXT_PUBLIC_PUSHER_APP_KEY) {
  throw new Error('NEXT_PUBLIC_PUSHER_APP_KEY environment variable is required');
}

if (!process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
  throw new Error('NEXT_PUBLIC_PUSHER_CLUSTER environment variable is required');
}

// Enable pusher logging in development
{{#if options.debugMode}}
if (process.env.NODE_ENV === 'development') {
  Pusher.logToConsole = true;
}
{{/if}}

export const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  {{#if options.enableEncryption}}
  encrypted: true,
  {{/if}}
  {{#if options.enablePrivateChannels}}
  authEndpoint: '/api/pusher/auth',
  {{/if}}
  activityTimeout: {{options.activityTimeout}},
  pongTimeout: {{options.pongTimeout}},
  maxReconnectionAttempts: {{options.maxReconnectionAttempts}},
});

export type PusherChannel = ReturnType<typeof pusherClient.subscribe>;
export type PusherPresenceChannel = ReturnType<typeof pusherClient.subscribe>;

export interface PresenceMember {
  id: string;
  info: Record<string, any>;
}

export interface ConnectionState {
  current: string;
  previous: string;
}
`,
      overwrite: false,
    },
    
    // Pusher server configuration
    {
      path: 'src/lib/pusher/server.ts',
      template: `import Pusher from 'pusher';

if (!process.env.PUSHER_APP_ID) {
  throw new Error('PUSHER_APP_ID environment variable is required');
}

if (!process.env.PUSHER_SECRET) {
  throw new Error('PUSHER_SECRET environment variable is required');
}

if (!process.env.NEXT_PUBLIC_PUSHER_APP_KEY) {
  throw new Error('NEXT_PUBLIC_PUSHER_APP_KEY environment variable is required');
}

if (!process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
  throw new Error('NEXT_PUBLIC_PUSHER_CLUSTER environment variable is required');
}

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
});

export async function broadcastToChannel(
  channel: string,
  event: string,
  data: any,
  socketId?: string
) {
  try {
    await pusherServer.trigger(channel, event, data, {
      socket_id: socketId, // Exclude the sender
    });
    return { success: true };
  } catch (error) {
    console.error('Pusher broadcast error:', error);
    throw error;
  }
}

export async function broadcastToUser(
  userId: string,
  event: string,
  data: any
) {
  try {
    await pusherServer.sendToUser(userId, event, data);
    return { success: true };
  } catch (error) {
    console.error('Pusher user broadcast error:', error);
    throw error;
  }
}

export async function authenticateUser(
  socketId: string,
  channel: string,
  userData?: {
    user_id: string;
    user_info?: Record<string, any>;
  }
) {
  try {
    if (channel.startsWith('private-')) {
      // Private channel authentication
      const auth = pusherServer.authorizeChannel(socketId, channel);
      return auth;
    } else if (channel.startsWith('presence-')) {
      // Presence channel authentication
      if (!userData) {
        throw new Error('User data required for presence channels');
      }
      
      const auth = pusherServer.authorizeChannel(socketId, channel, userData);
      return auth;
    } else {
      throw new Error('Authentication only required for private and presence channels');
    }
  } catch (error) {
    console.error('Pusher authentication error:', error);
    throw error;
  }
}

export async function getChannelInfo(channel: string) {
  try {
    const info = await pusherServer.get({
      path: \`/channels/\${channel}\`,
    });
    return info;
  } catch (error) {
    console.error('Pusher channel info error:', error);
    throw error;
  }
}

export async function getUserChannels(userId: string) {
  try {
    const channels = await pusherServer.get({
      path: \`/users/\${userId}\`,
    });
    return channels;
  } catch (error) {
    console.error('Pusher user channels error:', error);
    throw error;
  }
}
`,
      overwrite: false,
    },
    
    // Pusher React hooks
    {
      path: 'src/lib/pusher/hooks.ts',
      template: `'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { pusherClient, type PusherChannel, type PresenceMember, type ConnectionState } from './client';

export function usePusher() {
  return pusherClient;
}

export function usePusherConnection() {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    current: pusherClient.connection.state,
    previous: pusherClient.connection.state,
  });

  useEffect(() => {
    const handleStateChange = (states: { current: string; previous: string }) => {
      setConnectionState(states);
    };

    pusherClient.connection.bind('state_change', handleStateChange);

    return () => {
      pusherClient.connection.unbind('state_change', handleStateChange);
    };
  }, []);

  return {
    state: connectionState.current,
    previousState: connectionState.previous,
    isConnected: connectionState.current === 'connected',
    isConnecting: connectionState.current === 'connecting',
    isDisconnected: connectionState.current === 'disconnected',
  };
}

export function useChannel(channelName: string) {
  const [channel, setChannel] = useState<PusherChannel | null>(null);

  useEffect(() => {
    if (!channelName) return;

    const pusherChannel = pusherClient.subscribe(channelName);
    setChannel(pusherChannel);

    return () => {
      pusherClient.unsubscribe(channelName);
      setChannel(null);
    };
  }, [channelName]);

  return channel;
}

{{#if options.enablePrivateChannels}}
export function usePrivateChannel(channelName: string) {
  const [channel, setChannel] = useState<PusherChannel | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!channelName) return;

    const privateChannelName = channelName.startsWith('private-') 
      ? channelName 
      : \`private-\${channelName}\`;

    try {
      const pusherChannel = pusherClient.subscribe(privateChannelName);
      
      pusherChannel.bind('pusher:subscription_error', (error: any) => {
        setError(error.error || 'Subscription failed');
      });

      pusherChannel.bind('pusher:subscription_succeeded', () => {
        setError(null);
      });

      setChannel(pusherChannel);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }

    return () => {
      pusherClient.unsubscribe(privateChannelName);
      setChannel(null);
      setError(null);
    };
  }, [channelName]);

  return { channel, error };
}
{{/if}}

{{#if options.enablePresence}}
export function usePresenceChannel(
  channelName: string,
  userData?: {
    user_id: string;
    user_info?: Record<string, any>;
  }
) {
  const [channel, setChannel] = useState<PusherChannel | null>(null);
  const [members, setMembers] = useState<PresenceMember[]>([]);
  const [me, setMe] = useState<PresenceMember | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!channelName || !userData) return;

    const presenceChannelName = channelName.startsWith('presence-') 
      ? channelName 
      : \`presence-\${channelName}\`;

    try {
      const pusherChannel = pusherClient.subscribe(presenceChannelName);
      
      pusherChannel.bind('pusher:subscription_error', (error: any) => {
        setError(error.error || 'Subscription failed');
      });

      pusherChannel.bind('pusher:subscription_succeeded', (data: any) => {
        setError(null);
        setMembers(Object.values(data.members || {}));
        setMe(data.me);
      });

      pusherChannel.bind('pusher:member_added', (member: PresenceMember) => {
        setMembers(prev => [...prev, member]);
      });

      pusherChannel.bind('pusher:member_removed', (member: PresenceMember) => {
        setMembers(prev => prev.filter(m => m.id !== member.id));
      });

      setChannel(pusherChannel);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }

    return () => {
      pusherClient.unsubscribe(presenceChannelName);
      setChannel(null);
      setMembers([]);
      setMe(null);
      setError(null);
    };
  }, [channelName, userData]);

  return { channel, members, me, error };
}
{{/if}}

export function useChannelEvent<T = any>(
  channel: PusherChannel | null,
  eventName: string,
  callback: (data: T) => void
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!channel || !eventName) return;

    const handler = (data: T) => {
      callbackRef.current(data);
    };

    channel.bind(eventName, handler);

    return () => {
      channel.unbind(eventName, handler);
    };
  }, [channel, eventName]);
}

export function useBroadcast() {
  const broadcast = useCallback(async (
    channel: string,
    event: string,
    data: any,
    options?: {
      excludeSelf?: boolean;
    }
  ) => {
    try {
      const response = await fetch('/api/pusher/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel,
          event,
          data,
          socketId: options?.excludeSelf ? pusherClient.connection.socket_id : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Broadcast failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Broadcast error:', error);
      throw error;
    }
  }, []);

  return { broadcast };
}
`,
      overwrite: false,
    },
    
    // Pusher provider component
    {
      path: 'src/lib/pusher/provider.tsx',
      template: `'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { pusherClient } from './client';
import { usePusherConnection } from './hooks';

interface PusherContextType {
  pusher: typeof pusherClient;
  connectionState: string;
  isConnected: boolean;
}

const PusherContext = createContext<PusherContextType | null>(null);

interface PusherProviderProps {
  children: ReactNode;
}

export function PusherProvider({ children }: PusherProviderProps) {
  const { state, isConnected } = usePusherConnection();

  useEffect(() => {
    // Connect to Pusher when provider mounts
    pusherClient.connect();

    return () => {
      // Disconnect when provider unmounts
      pusherClient.disconnect();
    };
  }, []);

  const value: PusherContextType = {
    pusher: pusherClient,
    connectionState: state,
    isConnected,
  };

  return (
    <PusherContext.Provider value={value}>
      {children}
    </PusherContext.Provider>
  );
}

export function usePusherContext() {
  const context = useContext(PusherContext);
  if (!context) {
    throw new Error('usePusherContext must be used within a PusherProvider');
  }
  return context;
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // API route for authentication
    {
      path: 'src/pages/api/pusher/auth.ts',
      template: `import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser } from '@/lib/pusher/server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { socket_id, channel_name } = req.body;

    if (!socket_id || !channel_name) {
      return res.status(400).json({ error: 'Missing socket_id or channel_name' });
    }

    // TODO: Add your authentication logic here
    // For example, check if user is logged in and has permission to access the channel
    
    // Example user data (replace with your auth logic)
    const userData = {
      user_id: 'user-123', // Get from session/JWT
      user_info: {
        name: 'John Doe', // Get from user profile
        avatar: 'https://example.com/avatar.jpg',
      },
    };

    const auth = await authenticateUser(socket_id, channel_name, userData);
    
    res.json(auth);
  } catch (error) {
    console.error('Pusher auth error:', error);
    res.status(403).json({ error: 'Authentication failed' });
  }
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // API route for broadcasting
    {
      path: 'src/pages/api/pusher/broadcast.ts',
      template: `import { NextApiRequest, NextApiResponse } from 'next';
import { broadcastToChannel } from '@/lib/pusher/server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { channel, event, data, socketId } = req.body;

    if (!channel || !event || !data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // TODO: Add authorization logic here
    // Check if the user has permission to broadcast to this channel

    await broadcastToChannel(channel, event, data, socketId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Pusher broadcast error:', error);
    res.status(500).json({ error: 'Broadcast failed' });
  }
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Connection status component
    {
      path: 'src/components/pusher/connection-status.tsx',
      template: `'use client';

import { usePusherConnection } from '@/lib/pusher/hooks';

interface ConnectionStatusProps {
  className?: string;
  showText?: boolean;
}

export function ConnectionStatus({ className = '', showText = true }: ConnectionStatusProps) {
  const { state, isConnected, isConnecting } = usePusherConnection();

  const getStatusColor = () => {
    if (isConnected) return 'bg-green-500';
    if (isConnecting) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (isConnected) return 'Connected';
    if (isConnecting) return 'Connecting...';
    return 'Disconnected';
  };

  return (
    <div className={\`flex items-center space-x-2 \${className}\`}>
      <div className={\`w-3 h-3 rounded-full \${getStatusColor()}\`} />
      {showText && (
        <span className="text-sm text-gray-600">
          {getStatusText()}
        </span>
      )}
    </div>
  );
}
`,
      overwrite: false,
    },
    
    // Presence indicator component
    {
      path: 'src/components/pusher/presence-indicator.tsx',
      template: `'use client';

import { usePresenceChannel } from '@/lib/pusher/hooks';
import type { PresenceMember } from '@/lib/pusher/client';

interface PresenceIndicatorProps {
  channelName: string;
  userData: {
    user_id: string;
    user_info?: Record<string, any>;
  };
  className?: string;
  maxVisible?: number;
}

export function PresenceIndicator({
  channelName,
  userData,
  className = '',
  maxVisible = 5,
}: PresenceIndicatorProps) {
  const { members, me, error } = usePresenceChannel(channelName, userData);

  if (error) {
    return (
      <div className={\`text-red-600 text-sm \${className}\`}>
        Error: {error}
      </div>
    );
  }

  const visibleMembers = members.slice(0, maxVisible);
  const hiddenCount = Math.max(0, members.length - maxVisible);

  return (
    <div className={\`flex items-center space-x-2 \${className}\`}>
      <div className="flex -space-x-2">
        {visibleMembers.map((member) => (
          <div
            key={member.id}
            className={\`w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white text-xs font-medium \${
              member.id === me?.id ? 'ring-2 ring-blue-300' : ''
            }\`}
            title={member.info?.name || member.id}
          >
            {member.info?.avatar ? (
              <img
                src={member.info.avatar}
                alt={member.info.name || member.id}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span>
                {(member.info?.name || member.id).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        ))}
        {hiddenCount > 0 && (
          <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-white text-xs font-medium">
            +{hiddenCount}
          </div>
        )}
      </div>
      <span className="text-sm text-gray-600">
        {members.length} online
      </span>
    </div>
  );
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Real-time chat component
    {
      path: 'src/components/pusher/realtime-chat.tsx',
      template: `'use client';

import { useState, useEffect, useRef } from 'react';
import { useChannel, useChannelEvent, useBroadcast } from '@/lib/pusher/hooks';
import { ConnectionStatus } from './connection-status';

interface Message {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: number;
}

interface RealtimeChatProps {
  channelName: string;
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
  };
  className?: string;
}

export function RealtimeChat({
  channelName,
  currentUser,
  className = '',
}: RealtimeChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  const channel = useChannel(channelName);
  const { broadcast } = useBroadcast();

  // Listen for new messages
  useChannelEvent<Message>(channel, 'new-message', (message) => {
    setMessages(prev => [...prev, message]);
  });

  // Listen for typing indicators
  useChannelEvent<{ userId: string; userName: string; isTyping: boolean }>(
    channel,
    'user-typing',
    ({ userId, userName, isTyping: typing }) => {
      if (userId === currentUser.id) return; // Ignore own typing
      
      setIsTyping(prev => {
        if (typing) {
          return prev.includes(userName) ? prev : [...prev, userName];
        } else {
          return prev.filter(name => name !== userName);
        }
      });
    }
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      user: currentUser,
      content: input.trim(),
      timestamp: Date.now(),
    };

    try {
      await broadcast(channelName, 'new-message', message, { excludeSelf: false });
      setInput('');
      
      // Stop typing indicator
      await broadcast(channelName, 'user-typing', {
        userId: currentUser.id,
        userName: currentUser.name,
        isTyping: false,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    // Send typing indicator
    try {
      await broadcast(channelName, 'user-typing', {
        userId: currentUser.id,
        userName: currentUser.name,
        isTyping: true,
      });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(async () => {
        await broadcast(channelName, 'user-typing', {
          userId: currentUser.id,
          userName: currentUser.name,
          isTyping: false,
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={\`flex flex-col h-full bg-white border rounded-lg \${className}\`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-gray-900">
          Chat: {channelName}
        </h3>
        <ConnectionStatus />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={\`flex \${
              message.user.id === currentUser.id ? 'justify-end' : 'justify-start'
            }\`}
          >
            <div
              className={\`max-w-xs lg:max-w-md px-4 py-2 rounded-lg \${
                message.user.id === currentUser.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900'
              }\`}
            >
              {message.user.id !== currentUser.id && (
                <p className="text-xs font-medium mb-1 opacity-75">
                  {message.user.name}
                </p>
              )}
              <p className="text-sm">{message.content}</p>
              <p className={\`text-xs mt-1 \${
                message.user.id === currentUser.id ? 'text-blue-100' : 'text-gray-500'
              }\`}>
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {/* Typing indicators */}
        {isTyping.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm">
              {isTyping.length === 1
                ? \`\${isTyping[0]} is typing...\`
                : \`\${isTyping.slice(0, -1).join(', ')} and \${isTyping[isTyping.length - 1]} are typing...\`
              }
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!input.trim()}
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
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Example usage component
    {
      path: 'src/components/examples/pusher-example.tsx',
      template: `'use client';

import { useState } from 'react';
import { RealtimeChat } from '@/components/pusher/realtime-chat';
import { PresenceIndicator } from '@/components/pusher/presence-indicator';
import { ConnectionStatus } from '@/components/pusher/connection-status';
import { useChannel, useChannelEvent, useBroadcast } from '@/lib/pusher/hooks';

export function PusherExample() {
  const [activeTab, setActiveTab] = useState<'chat' | 'presence' | 'events'>('chat');
  const [eventData, setEventData] = useState<any[]>([]);
  const [customEvent, setCustomEvent] = useState('');
  const [customData, setCustomData] = useState('');
  
  const { broadcast } = useBroadcast();
  const channel = useChannel('demo-channel');

  // Listen for custom events
  useChannelEvent(channel, 'custom-event', (data) => {
    setEventData(prev => [...prev, { type: 'custom-event', data, timestamp: Date.now() }]);
  });

  // Mock current user (replace with your auth system)
  const currentUser = {
    id: 'user-' + Math.random().toString(36).substr(2, 9),
    name: 'Demo User',
    avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=3b82f6&color=fff',
  };

  const sendCustomEvent = async () => {
    if (!customEvent.trim() || !customData.trim()) return;

    try {
      await broadcast('demo-channel', customEvent, {
        message: customData,
        sender: currentUser.name,
        timestamp: Date.now(),
      });
      
      setCustomEvent('');
      setCustomData('');
    } catch (error) {
      console.error('Failed to send custom event:', error);
    }
  };

  const tabs = [
    { id: 'chat', label: 'Real-time Chat' },
    { id: 'presence', label: 'Presence' },
    { id: 'events', label: 'Custom Events' },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pusher Real-time</h1>
        <p className="text-gray-600">
          Explore real-time features with WebSocket communication, presence tracking, and custom events.
        </p>
        <div className="mt-4">
          <ConnectionStatus showText={true} />
        </div>
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
            <RealtimeChat
              channelName="demo-chat"
              currentUser={currentUser}
              className="h-full"
            />
          </div>
        )}

        {activeTab === 'presence' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Online Users
              </h3>
              <PresenceIndicator
                channelName="demo-presence"
                userData={{
                  user_id: currentUser.id,
                  user_info: {
                    name: currentUser.name,
                    avatar: currentUser.avatar,
                  },
                }}
                maxVisible={10}
              />
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-sm">
                💡 <strong>Tip:</strong> Open this page in multiple tabs or browsers to see presence in action!
              </p>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="p-6 space-y-6">
            {/* Send Custom Event */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Send Custom Event
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="event-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Name
                  </label>
                  <input
                    id="event-name"
                    type="text"
                    value={customEvent}
                    onChange={(e) => setCustomEvent(e.target.value)}
                    placeholder="e.g., user-action, notification"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="event-data" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Data
                  </label>
                  <input
                    id="event-data"
                    type="text"
                    value={customData}
                    onChange={(e) => setCustomData(e.target.value)}
                    placeholder="e.g., Hello from Pusher!"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <button
                onClick={sendCustomEvent}
                disabled={!customEvent.trim() || !customData.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Send Event
              </button>
            </div>

            {/* Event Log */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Event Log
              </h3>
              
              <div className="bg-gray-50 border rounded-lg p-4 h-64 overflow-y-auto">
                {eventData.length === 0 ? (
                  <p className="text-gray-500 text-center">
                    No events received yet. Send a custom event above!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {eventData.map((event, index) => (
                      <div key={index} className="bg-white p-3 rounded border text-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-blue-600">
                            {event.type}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <pre className="text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <p className="text-green-800 font-medium">✅ Pusher is configured and ready!</p>
        <p className="text-green-600 text-sm mt-1">
          Cluster: {{options.cluster}} | Encryption: {{options.enableEncryption}} | 
          Presence: {{options.enablePresence}} | Private Channels: {{options.enablePrivateChannels}}
        </p>
      </div>
    </div>
  );
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
  ],
  
  integrations: [
    {
      plugin: 'auth-*',
      type: 'middleware',
      files: [
        {
          path: 'src/lib/pusher/auth-integration.ts',
          template: `import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser } from './server';

export async function authenticateWithAuth(
  req: NextApiRequest,
  res: NextApiResponse,
  getUserFromRequest: (req: NextApiRequest) => Promise<any>
) {
  try {
    const { socket_id, channel_name } = req.body;

    if (!socket_id || !channel_name) {
      return res.status(400).json({ error: 'Missing socket_id or channel_name' });
    }

    // Get user from your auth system
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check channel permissions
    if (channel_name.startsWith('private-user-') && !channel_name.includes(user.id)) {
      return res.status(403).json({ error: 'Access denied to this channel' });
    }

    const userData = {
      user_id: user.id,
      user_info: {
        name: user.name || user.email,
        avatar: user.image || user.avatar,
        email: user.email,
      },
    };

    const auth = await authenticateUser(socket_id, channel_name, userData);
    
    res.json(auth);
  } catch (error) {
    console.error('Pusher auth integration error:', error);
    res.status(403).json({ error: 'Authentication failed' });
  }
}
`,
        },
      ],
    },
  ],
  
  postInstall: `🔄 Pusher Real-time has been configured successfully!

Next steps:
1. Set up your Pusher account:
   - Visit https://pusher.com and create an account
   - Create a new app and get your credentials
   - Add them to your environment variables:
   
   \`\`\`env
   NEXT_PUBLIC_PUSHER_APP_KEY=your_app_key
   NEXT_PUBLIC_PUSHER_CLUSTER={{options.cluster}}
   PUSHER_APP_ID=your_app_id
   PUSHER_SECRET=your_secret_key
   \`\`\`

2. Add the PusherProvider to your app:
   {{#if (eq template 'nextjs')}}
   \`\`\`tsx
   // app/layout.tsx
   import { PusherProvider } from '@/lib/pusher/provider';
   
   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           <PusherProvider>
             {children}
           </PusherProvider>
         </body>
       </html>
     );
   }
   \`\`\`
   {{/if}}

3. Start using real-time features:
   \`\`\`tsx
   import { useChannel, useChannelEvent } from '@/lib/pusher/hooks';
   
   const channel = useChannel('my-channel');
   useChannelEvent(channel, 'my-event', (data) => {
     console.log('Received:', data);
   });
   \`\`\`

4. Try the example component:
   \`\`\`tsx
   import { PusherExample } from '@/components/examples/pusher-example';
   
   <PusherExample />
   \`\`\`

Configuration:
- Cluster: {{options.cluster}}
- Encryption: {{options.enableEncryption}}
- Presence Channels: {{options.enablePresence}}
- Private Channels: {{options.enablePrivateChannels}}
- Debug Mode: {{options.debugMode}}

{{#if options.enablePrivateChannels}}
⚠️  **Important:** Update the authentication logic in \`/api/pusher/auth\` to integrate with your auth system.
{{/if}}

Documentation: https://pusher.com/docs`,
});

export default realtimePusherPlugin;