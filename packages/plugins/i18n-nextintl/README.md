# next-intl Plugin for Scaforge

This plugin integrates next-intl into your Scaforge project, providing comprehensive internationalization (i18n) support for Next.js applications with type-safe translations, locale routing, and advanced formatting.

## Features

- 🌍 **Multi-language Support** - Support for unlimited languages
- 🔒 **Type-safe Translations** - Full TypeScript support with autocomplete
- 🛣️ **Locale Routing** - Automatic locale-based routing
- 📅 **Date & Time Formatting** - Locale-aware date/time formatting
- 💰 **Number & Currency Formatting** - Proper number and currency display
- 🔄 **Pluralization** - Smart plural rules for all languages
- 📱 **Client & Server** - Works in both client and server components
- 🎛️ **Configurable** - Flexible configuration options

## Installation

```bash
npx scaforge add i18n-nextintl
```

## Configuration

The plugin will prompt you for configuration options during installation:

- **Default Locale**: Your primary language (e.g., 'en', 'es', 'fr')
- **Supported Locales**: List of all supported languages
- **Locale Detection**: Auto-detect user's preferred language
- **Locale Prefix**: URL prefix strategy (always, as-needed, never)
- **Time Zone**: Default time zone for date formatting

## Supported Locales

Add these to your configuration during installation or modify later:

```typescript
const locales = ['en', 'es', 'fr', 'de', 'ja', 'zh', 'ar', 'pt', 'ru', 'it'];
```

## Usage

### Basic Translation

```tsx
import { useTranslations } from 'next-intl';

function WelcomeMessage() {
  const t = useTranslations('common');
  
  return (
    <div>
      <h1>{t('welcome')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
```

### With Parameters

```tsx
import { useTranslations } from 'next-intl';

function UserGreeting({ userName }: { userName: string }) {
  const t = useTranslations('user');
  
  return (
    <h2>{t('greeting', { name: userName })}</h2>
  );
}
```

### Pluralization

```tsx
import { useTranslations } from 'next-intl';

function ItemCount({ count }: { count: number }) {
  const t = useTranslations('items');
  
  return (
    <p>{t('count', { count })}</p>
  );
}
```

### Date & Time Formatting

```tsx
import { useFormatter } from 'next-intl';

function EventDate({ date }: { date: Date }) {
  const format = useFormatter();
  
  return (
    <div>
      <p>{format.dateTime(date, 'full')}</p>
      <p>{format.relativeTime(date)}</p>
    </div>
  );
}
```

### Number & Currency Formatting

```tsx
import { useFormatter } from 'next-intl';

function Price({ amount, currency }: { amount: number; currency: string }) {
  const format = useFormatter();
  
  return (
    <div>
      <p>{format.number(amount, { style: 'currency', currency })}</p>
      <p>{format.number(amount / 100, { style: 'percent' })}</p>
    </div>
  );
}
```

### Server Components

```tsx
import { getTranslations } from 'next-intl/server';

async function ServerWelcome() {
  const t = await getTranslations('common');
  
  return (
    <h1>{t('welcome')}</h1>
  );
}
```

### Language Switcher

```tsx
import { LanguageSwitcher } from '@/components/i18n/language-switcher';

function Header() {
  return (
    <header>
      <nav>
        {/* Your navigation */}
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
```

## Translation Files

Translation files are stored in `messages/` directory:

```
messages/
├── en.json
├── es.json
├── fr.json
└── de.json
```

Example `messages/en.json`:
```json
{
  "common": {
    "welcome": "Welcome",
    "description": "This is a multilingual application"
  },
  "user": {
    "greeting": "Hello, {name}!"
  },
  "items": {
    "count": "{count, plural, =0 {No items} =1 {One item} other {# items}}"
  }
}
```

## API Reference

### Hooks

- `useTranslations(namespace?)` - Get translation function
- `useFormatter()` - Get formatting utilities
- `useLocale()` - Get current locale
- `useMessages()` - Get all messages
- `useTimeZone()` - Get current time zone

### Components

- `<LanguageSwitcher />` - Language selection dropdown
- `<LocaleLink />` - Locale-aware Link component
- `<TranslationProvider />` - Translation context provider

### Server Functions

- `getTranslations(namespace?)` - Server-side translations
- `getFormatter()` - Server-side formatting
- `getLocale()` - Get server-side locale

## Examples

Check out the example components in `src/components/examples/nextintl-example.tsx` for complete implementation examples.

## Documentation

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Next.js i18n](https://nextjs.org/docs/advanced-features/i18n)
- [Scaforge Documentation](https://scaforge.dev)