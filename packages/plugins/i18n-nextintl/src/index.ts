/**
 * next-intl Plugin for Scaforge
 * Internationalization support with next-intl for Next.js applications
 */
import { z } from 'zod';
import { definePlugin } from '@scaforge/core';

export const i18nNextintlPlugin = definePlugin({
  name: 'i18n-nextintl',
  displayName: 'next-intl',
  category: 'i18n',
  description: 'Internationalization support with next-intl for Next.js applications',
  version: '1.0.0',
  
  supportedTemplates: ['nextjs'],
  
  packages: {
    dependencies: {
      'next-intl': '^3.4.0',
    },
  },
  
  configSchema: z.object({
    defaultLocale: z.string().default('en'),
    locales: z.array(z.string()).default(['en', 'es', 'fr', 'de']),
    localeDetection: z.boolean().default(true),
    localePrefix: z.enum(['always', 'as-needed', 'never']).default('as-needed'),
    timeZone: z.string().default('UTC'),
    domains: z.array(z.object({
      domain: z.string(),
      defaultLocale: z.string(),
      locales: z.array(z.string()).optional(),
    })).optional(),
  }),
  
  envVars: [],
  
  files: [
    // next-intl configuration
    {
      path: 'src/i18n.ts',
      template: `import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Can be imported from a shared config
const locales = {{#each options.locales}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}};

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming \`locale\` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  return {
    messages: (await import(\`../messages/\${locale}.json\`)).default,
    timeZone: '{{options.timeZone}}',
  };
});
`,
      overwrite: false,
    },
    
    // Middleware for locale routing
    {
      path: 'src/middleware.ts',
      template: `import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: [{{#each options.locales}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}],

  // Used when no locale matches
  defaultLocale: '{{options.defaultLocale}}',

  // Locale detection strategy
  localeDetection: {{options.localeDetection}},

  // Locale prefix strategy
  localePrefix: '{{options.localePrefix}}',

  {{#if options.domains}}
  // Domain-based routing
  domains: [
    {{#each options.domains}}
    {
      domain: '{{domain}}',
      defaultLocale: '{{defaultLocale}}'{{#if locales}},
      locales: [{{#each locales}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}]{{/if}}
    }{{#unless @last}},{{/unless}}
    {{/each}}
  ],
  {{/if}}
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(de|en|es|fr)/:path*']
};
`,
      overwrite: false,
    },
    
    // Next.js configuration
    {
      path: 'next.config.js',
      template: `const withNextIntl = require('next-intl/plugin')(
  // This is the default location of the \`i18n.ts\` file
  './src/i18n.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing Next.js config
};

module.exports = withNextIntl(nextConfig);
`,
      overwrite: true,
    },
    
    // Translation files
    {
      path: 'messages/en.json',
      template: `{
  "common": {
    "welcome": "Welcome",
    "description": "This is a multilingual application built with next-intl",
    "loading": "Loading...",
    "error": "An error occurred",
    "retry": "Try again",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "close": "Close",
    "back": "Back",
    "next": "Next",
    "previous": "Previous",
    "submit": "Submit"
  },
  "navigation": {
    "home": "Home",
    "about": "About",
    "contact": "Contact",
    "blog": "Blog",
    "products": "Products",
    "services": "Services"
  },
  "user": {
    "greeting": "Hello, {name}!",
    "profile": "Profile",
    "settings": "Settings",
    "logout": "Logout",
    "login": "Login",
    "register": "Register"
  },
  "items": {
    "count": "{count, plural, =0 {No items} =1 {One item} other {# items}}",
    "selected": "{count, plural, =0 {No items selected} =1 {One item selected} other {# items selected}}"
  },
  "time": {
    "now": "now",
    "today": "today",
    "yesterday": "yesterday",
    "tomorrow": "tomorrow",
    "lastWeek": "last week",
    "nextWeek": "next week"
  },
  "language": {
    "current": "English",
    "switch": "Switch language",
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "ja": "Japanese",
    "zh": "Chinese",
    "ar": "Arabic",
    "pt": "Portuguese",
    "ru": "Russian",
    "it": "Italian"
  }
}
`,
      overwrite: false,
    },
    
    {
      path: 'messages/es.json',
      template: `{
  "common": {
    "welcome": "Bienvenido",
    "description": "Esta es una aplicación multiidioma construida con next-intl",
    "loading": "Cargando...",
    "error": "Ocurrió un error",
    "retry": "Intentar de nuevo",
    "cancel": "Cancelar",
    "save": "Guardar",
    "delete": "Eliminar",
    "edit": "Editar",
    "close": "Cerrar",
    "back": "Atrás",
    "next": "Siguiente",
    "previous": "Anterior",
    "submit": "Enviar"
  },
  "navigation": {
    "home": "Inicio",
    "about": "Acerca de",
    "contact": "Contacto",
    "blog": "Blog",
    "products": "Productos",
    "services": "Servicios"
  },
  "user": {
    "greeting": "¡Hola, {name}!",
    "profile": "Perfil",
    "settings": "Configuración",
    "logout": "Cerrar sesión",
    "login": "Iniciar sesión",
    "register": "Registrarse"
  },
  "items": {
    "count": "{count, plural, =0 {Sin elementos} =1 {Un elemento} other {# elementos}}",
    "selected": "{count, plural, =0 {Sin elementos seleccionados} =1 {Un elemento seleccionado} other {# elementos seleccionados}}"
  },
  "time": {
    "now": "ahora",
    "today": "hoy",
    "yesterday": "ayer",
    "tomorrow": "mañana",
    "lastWeek": "la semana pasada",
    "nextWeek": "la próxima semana"
  },
  "language": {
    "current": "Español",
    "switch": "Cambiar idioma",
    "en": "Inglés",
    "es": "Español",
    "fr": "Francés",
    "de": "Alemán",
    "ja": "Japonés",
    "zh": "Chino",
    "ar": "Árabe",
    "pt": "Portugués",
    "ru": "Ruso",
    "it": "Italiano"
  }
}
`,
      overwrite: false,
    },
    
    {
      path: 'messages/fr.json',
      template: `{
  "common": {
    "welcome": "Bienvenue",
    "description": "Ceci est une application multilingue construite avec next-intl",
    "loading": "Chargement...",
    "error": "Une erreur s'est produite",
    "retry": "Réessayer",
    "cancel": "Annuler",
    "save": "Enregistrer",
    "delete": "Supprimer",
    "edit": "Modifier",
    "close": "Fermer",
    "back": "Retour",
    "next": "Suivant",
    "previous": "Précédent",
    "submit": "Soumettre"
  },
  "navigation": {
    "home": "Accueil",
    "about": "À propos",
    "contact": "Contact",
    "blog": "Blog",
    "products": "Produits",
    "services": "Services"
  },
  "user": {
    "greeting": "Bonjour, {name} !",
    "profile": "Profil",
    "settings": "Paramètres",
    "logout": "Se déconnecter",
    "login": "Se connecter",
    "register": "S'inscrire"
  },
  "items": {
    "count": "{count, plural, =0 {Aucun élément} =1 {Un élément} other {# éléments}}",
    "selected": "{count, plural, =0 {Aucun élément sélectionné} =1 {Un élément sélectionné} other {# éléments sélectionnés}}"
  },
  "time": {
    "now": "maintenant",
    "today": "aujourd'hui",
    "yesterday": "hier",
    "tomorrow": "demain",
    "lastWeek": "la semaine dernière",
    "nextWeek": "la semaine prochaine"
  },
  "language": {
    "current": "Français",
    "switch": "Changer de langue",
    "en": "Anglais",
    "es": "Espagnol",
    "fr": "Français",
    "de": "Allemand",
    "ja": "Japonais",
    "zh": "Chinois",
    "ar": "Arabe",
    "pt": "Portugais",
    "ru": "Russe",
    "it": "Italien"
  }
}
`,
      overwrite: false,
    },
    
    {
      path: 'messages/de.json',
      template: `{
  "common": {
    "welcome": "Willkommen",
    "description": "Dies ist eine mehrsprachige Anwendung, die mit next-intl erstellt wurde",
    "loading": "Laden...",
    "error": "Ein Fehler ist aufgetreten",
    "retry": "Erneut versuchen",
    "cancel": "Abbrechen",
    "save": "Speichern",
    "delete": "Löschen",
    "edit": "Bearbeiten",
    "close": "Schließen",
    "back": "Zurück",
    "next": "Weiter",
    "previous": "Vorherige",
    "submit": "Absenden"
  },
  "navigation": {
    "home": "Startseite",
    "about": "Über uns",
    "contact": "Kontakt",
    "blog": "Blog",
    "products": "Produkte",
    "services": "Dienstleistungen"
  },
  "user": {
    "greeting": "Hallo, {name}!",
    "profile": "Profil",
    "settings": "Einstellungen",
    "logout": "Abmelden",
    "login": "Anmelden",
    "register": "Registrieren"
  },
  "items": {
    "count": "{count, plural, =0 {Keine Elemente} =1 {Ein Element} other {# Elemente}}",
    "selected": "{count, plural, =0 {Keine Elemente ausgewählt} =1 {Ein Element ausgewählt} other {# Elemente ausgewählt}}"
  },
  "time": {
    "now": "jetzt",
    "today": "heute",
    "yesterday": "gestern",
    "tomorrow": "morgen",
    "lastWeek": "letzte Woche",
    "nextWeek": "nächste Woche"
  },
  "language": {
    "current": "Deutsch",
    "switch": "Sprache wechseln",
    "en": "Englisch",
    "es": "Spanisch",
    "fr": "Französisch",
    "de": "Deutsch",
    "ja": "Japanisch",
    "zh": "Chinesisch",
    "ar": "Arabisch",
    "pt": "Portugiesisch",
    "ru": "Russisch",
    "it": "Italienisch"
  }
}
`,
      overwrite: false,
    },
    
    // Language switcher component
    {
      path: 'src/components/i18n/language-switcher.tsx',
      template: `'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';

interface LanguageSwitcherProps {
  className?: string;
}

const locales = [{{#each options.locales}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}];

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const t = useTranslations('language');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const handleLocaleChange = (newLocale: string) => {
    startTransition(() => {
      // Replace the locale in the pathname
      const segments = pathname.split('/');
      if (locales.includes(segments[1])) {
        segments[1] = newLocale;
      } else {
        segments.unshift('', newLocale);
      }
      
      const newPathname = segments.join('/') || '/';
      router.replace(newPathname);
      setIsOpen(false);
    });
  };

  return (
    <div className={\`relative \${className}\`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        aria-label={t('switch')}
      >
        <span className="text-lg">🌐</span>
        <span>{t('current')}</span>
        <svg
          className={\`w-4 h-4 transition-transform \${isOpen ? 'rotate-180' : ''}\`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 z-20 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
            <div className="py-1">
              {locales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleLocaleChange(loc)}
                  disabled={isPending}
                  className={\`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100 disabled:opacity-50 \${
                    locale === loc ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }\`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {loc === 'en' && '🇺🇸'}
                      {loc === 'es' && '🇪🇸'}
                      {loc === 'fr' && '🇫🇷'}
                      {loc === 'de' && '🇩🇪'}
                      {loc === 'ja' && '🇯🇵'}
                      {loc === 'zh' && '🇨🇳'}
                      {loc === 'ar' && '🇸🇦'}
                      {loc === 'pt' && '🇵🇹'}
                      {loc === 'ru' && '🇷🇺'}
                      {loc === 'it' && '🇮🇹'}
                    </span>
                    <span>{t(loc)}</span>
                    {locale === loc && (
                      <span className="ml-auto text-blue-600">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
`,
      overwrite: false,
    },
    
    // Locale-aware Link component
    {
      path: 'src/components/i18n/locale-link.tsx',
      template: `'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { ComponentProps } from 'react';

type LocaleLinkProps = ComponentProps<typeof Link> & {
  locale?: string;
};

export function LocaleLink({ href, locale, ...props }: LocaleLinkProps) {
  const currentLocale = useLocale();
  const targetLocale = locale || currentLocale;
  
  // Ensure href starts with locale
  const localizedHref = typeof href === 'string' 
    ? href.startsWith('/') 
      ? \`/\${targetLocale}\${href}\`
      : href
    : href;

  return <Link {...props} href={localizedHref} />;
}
`,
      overwrite: false,
    },
    
    // Formatting utilities
    {
      path: 'src/lib/i18n/formatters.ts',
      template: `import { useFormatter, useLocale } from 'next-intl';

export function useI18nFormatters() {
  const format = useFormatter();
  const locale = useLocale();

  return {
    // Date and time formatting
    formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => {
      return format.dateTime(date, options || { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    },

    formatTime: (date: Date, options?: Intl.DateTimeFormatOptions) => {
      return format.dateTime(date, options || { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    },

    formatDateTime: (date: Date, options?: Intl.DateTimeFormatOptions) => {
      return format.dateTime(date, options || { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    },

    formatRelativeTime: (date: Date) => {
      return format.relativeTime(date);
    },

    // Number formatting
    formatNumber: (number: number, options?: Intl.NumberFormatOptions) => {
      return format.number(number, options);
    },

    formatCurrency: (amount: number, currency: string, options?: Intl.NumberFormatOptions) => {
      return format.number(amount, { 
        style: 'currency', 
        currency,
        ...options 
      });
    },

    formatPercent: (value: number, options?: Intl.NumberFormatOptions) => {
      return format.number(value, { 
        style: 'percent',
        ...options 
      });
    },

    // List formatting
    formatList: (items: string[], options?: Intl.ListFormatOptions) => {
      return format.list(items, options || { style: 'long', type: 'conjunction' });
    },

    // Utility functions
    getCurrentLocale: () => locale,
    
    isRTL: () => {
      const rtlLocales = ['ar', 'he', 'fa', 'ur'];
      return rtlLocales.includes(locale);
    },

    getDirection: () => {
      const rtlLocales = ['ar', 'he', 'fa', 'ur'];
      return rtlLocales.includes(locale) ? 'rtl' : 'ltr';
    },
  };
}
`,
      overwrite: false,
    },
    
    // Translation utilities
    {
      path: 'src/lib/i18n/utils.ts',
      template: `import { useTranslations } from 'next-intl';

export function useCommonTranslations() {
  const t = useTranslations('common');
  
  return {
    welcome: t('welcome'),
    loading: t('loading'),
    error: t('error'),
    retry: t('retry'),
    cancel: t('cancel'),
    save: t('save'),
    delete: t('delete'),
    edit: t('edit'),
    close: t('close'),
    back: t('back'),
    next: t('next'),
    previous: t('previous'),
    submit: t('submit'),
  };
}

export function useNavigationTranslations() {
  const t = useTranslations('navigation');
  
  return {
    home: t('home'),
    about: t('about'),
    contact: t('contact'),
    blog: t('blog'),
    products: t('products'),
    services: t('services'),
  };
}

export function useUserTranslations() {
  const t = useTranslations('user');
  
  return {
    greeting: (name: string) => t('greeting', { name }),
    profile: t('profile'),
    settings: t('settings'),
    logout: t('logout'),
    login: t('login'),
    register: t('register'),
  };
}

export function useItemTranslations() {
  const t = useTranslations('items');
  
  return {
    count: (count: number) => t('count', { count }),
    selected: (count: number) => t('selected', { count }),
  };
}

// Type-safe translation keys
export type TranslationKey = 
  | \`common.\${keyof typeof import('../../../messages/en.json')['common']}\`
  | \`navigation.\${keyof typeof import('../../../messages/en.json')['navigation']}\`
  | \`user.\${keyof typeof import('../../../messages/en.json')['user']}\`
  | \`items.\${keyof typeof import('../../../messages/en.json')['items']}\`
  | \`time.\${keyof typeof import('../../../messages/en.json')['time']}\`
  | \`language.\${keyof typeof import('../../../messages/en.json')['language']}\`;
`,
      overwrite: false,
    },
    
    // Example usage component
    {
      path: 'src/components/examples/nextintl-example.tsx',
      template: `'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { LocaleLink } from '@/components/i18n/locale-link';
import { useI18nFormatters } from '@/lib/i18n/formatters';
import { 
  useCommonTranslations, 
  useNavigationTranslations, 
  useUserTranslations, 
  useItemTranslations 
} from '@/lib/i18n/utils';

export function NextIntlExample() {
  const [activeTab, setActiveTab] = useState<'basic' | 'formatting' | 'pluralization' | 'navigation'>('basic');
  const [itemCount, setItemCount] = useState(0);
  const [userName, setUserName] = useState('John Doe');
  
  const locale = useLocale();
  const t = useTranslations();
  const common = useCommonTranslations();
  const nav = useNavigationTranslations();
  const user = useUserTranslations();
  const items = useItemTranslations();
  const formatters = useI18nFormatters();

  const currentDate = new Date();
  const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
  const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

  const tabs = [
    { id: 'basic', label: 'Basic Translations' },
    { id: 'formatting', label: 'Formatting' },
    { id: 'pluralization', label: 'Pluralization' },
    { id: 'navigation', label: 'Navigation' },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{common.welcome}</h1>
            <p className="text-gray-600 mt-2">
              {t('common.description')}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Current locale: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{locale}</span>
            </p>
          </div>
          <LanguageSwitcher />
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
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Basic Translation Examples
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Common Translations</h4>
                  <ul className="space-y-1 text-sm">
                    <li>Welcome: <span className="font-medium">{common.welcome}</span></li>
                    <li>Loading: <span className="font-medium">{common.loading}</span></li>
                    <li>Error: <span className="font-medium">{common.error}</span></li>
                    <li>Save: <span className="font-medium">{common.save}</span></li>
                    <li>Cancel: <span className="font-medium">{common.cancel}</span></li>
                  </ul>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Navigation</h4>
                  <ul className="space-y-1 text-sm">
                    <li>Home: <span className="font-medium">{nav.home}</span></li>
                    <li>About: <span className="font-medium">{nav.about}</span></li>
                    <li>Contact: <span className="font-medium">{nav.contact}</span></li>
                    <li>Blog: <span className="font-medium">{nav.blog}</span></li>
                    <li>Products: <span className="font-medium">{nav.products}</span></li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">User Greeting with Parameters</h4>
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter name"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="text-lg font-medium text-blue-600">
                  {user.greeting(userName)}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'formatting' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Date & Time Formatting
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Current Date & Time</h4>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <span className="text-gray-600">Full date:</span>
                      <div className="font-medium">{formatters.formatDate(currentDate)}</div>
                    </li>
                    <li>
                      <span className="text-gray-600">Time:</span>
                      <div className="font-medium">{formatters.formatTime(currentDate)}</div>
                    </li>
                    <li>
                      <span className="text-gray-600">Date & Time:</span>
                      <div className="font-medium">{formatters.formatDateTime(currentDate)}</div>
                    </li>
                  </ul>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Relative Time</h4>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <span className="text-gray-600">2 days ago:</span>
                      <div className="font-medium">{formatters.formatRelativeTime(pastDate)}</div>
                    </li>
                    <li>
                      <span className="text-gray-600">Now:</span>
                      <div className="font-medium">{formatters.formatRelativeTime(currentDate)}</div>
                    </li>
                    <li>
                      <span className="text-gray-600">In 3 days:</span>
                      <div className="font-medium">{formatters.formatRelativeTime(futureDate)}</div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Number & Currency Formatting
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Numbers</h4>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <span className="text-gray-600">Large number:</span>
                      <div className="font-medium">{formatters.formatNumber(1234567.89)}</div>
                    </li>
                    <li>
                      <span className="text-gray-600">Percentage:</span>
                      <div className="font-medium">{formatters.formatPercent(0.1234)}</div>
                    </li>
                  </ul>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Currency</h4>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <span className="text-gray-600">USD:</span>
                      <div className="font-medium">{formatters.formatCurrency(1234.56, 'USD')}</div>
                    </li>
                    <li>
                      <span className="text-gray-600">EUR:</span>
                      <div className="font-medium">{formatters.formatCurrency(1234.56, 'EUR')}</div>
                    </li>
                    <li>
                      <span className="text-gray-600">JPY:</span>
                      <div className="font-medium">{formatters.formatCurrency(1234, 'JPY')}</div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pluralization' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Pluralization Examples
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Count
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      value={itemCount}
                      onChange={(e) => setItemCount(parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex space-x-2">
                      {[0, 1, 2, 5, 10].map(count => (
                        <button
                          key={count}
                          onClick={() => setItemCount(count)}
                          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="space-y-2">
                    <div className="text-lg font-medium text-blue-800">
                      {items.count(itemCount)}
                    </div>
                    <div className="text-sm text-blue-600">
                      {items.selected(itemCount)}
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>
                    Try different numbers to see how pluralization works in {t('language.current')}.
                    The rules automatically handle zero, one, and multiple items correctly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'navigation' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Locale-aware Navigation
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Navigation Links</h4>
                  <div className="flex flex-wrap gap-2">
                    <LocaleLink 
                      href="/" 
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {nav.home}
                    </LocaleLink>
                    <LocaleLink 
                      href="/about" 
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {nav.about}
                    </LocaleLink>
                    <LocaleLink 
                      href="/contact" 
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {nav.contact}
                    </LocaleLink>
                    <LocaleLink 
                      href="/blog" 
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {nav.blog}
                    </LocaleLink>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Cross-locale Links</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Links to the same page in different languages:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[{{#each options.locales}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}].map(loc => (
                      <LocaleLink
                        key={loc}
                        href="/about"
                        locale={loc}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                      >
                        {t(\`language.\${loc}\`)} About
                      </LocaleLink>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Locale Information</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>Current locale: <span className="font-mono">{locale}</span></li>
                    <li>Text direction: <span className="font-mono">{formatters.getDirection()}</span></li>
                    <li>Is RTL: <span className="font-mono">{formatters.isRTL().toString()}</span></li>
                    <li>Supported locales: <span className="font-mono">[{{#each options.locales}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}]</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <p className="text-green-800 font-medium">✅ next-intl is configured and ready!</p>
        <p className="text-green-600 text-sm mt-1">
          Default locale: {{options.defaultLocale}} | 
          Supported: {{#each options.locales}}{{this}}{{#unless @last}}, {{/unless}}{{/each}} | 
          Detection: {{options.localeDetection}} | 
          Prefix: {{options.localePrefix}}
        </p>
      </div>
    </div>
  );
}
`,
      overwrite: false,
    },
  ],
  
  integrations: [],
  
  postInstall: `🌍 next-intl has been configured successfully!

Next steps:
1. Update your app layout to support internationalization:
   \`\`\`tsx
   // app/[locale]/layout.tsx
   import { NextIntlClientProvider } from 'next-intl';
   import { getMessages } from 'next-intl/server';
   
   export default async function LocaleLayout({
     children,
     params: { locale }
   }: {
     children: React.ReactNode;
     params: { locale: string };
   }) {
     const messages = await getMessages();
   
     return (
       <html lang={locale}>
         <body>
           <NextIntlClientProvider messages={messages}>
             {children}
           </NextIntlClientProvider>
         </body>
       </html>
     );
   }
   \`\`\`

2. Start using translations in your components:
   \`\`\`tsx
   import { useTranslations } from 'next-intl';
   
   function MyComponent() {
     const t = useTranslations('common');
     return <h1>{t('welcome')}</h1>;
   }
   \`\`\`

3. Add the language switcher to your navigation:
   \`\`\`tsx
   import { LanguageSwitcher } from '@/components/i18n/language-switcher';
   
   <LanguageSwitcher />
   \`\`\`

4. Try the example component:
   \`\`\`tsx
   import { NextIntlExample } from '@/components/examples/nextintl-example';
   
   <NextIntlExample />
   \`\`\`

Configuration:
- Default Locale: {{options.defaultLocale}}
- Supported Locales: {{#each options.locales}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
- Locale Detection: {{options.localeDetection}}
- Locale Prefix: {{options.localePrefix}}
- Time Zone: {{options.timeZone}}

Translation files have been created in the \`messages/\` directory. 
You can add more languages by creating additional JSON files.

Documentation: https://next-intl-docs.vercel.app/`,
});

export default i18nNextintlPlugin;