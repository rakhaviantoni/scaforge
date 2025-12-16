/**
 * Sanity CMS Plugin for Scaforge
 * Headless CMS with real-time collaboration and structured content
 */
import { z } from 'zod';
import { definePlugin } from '@scaforge/core';

export const cmsSanityPlugin = definePlugin({
  name: 'cms-sanity',
  displayName: 'Sanity CMS',
  category: 'cms',
  description: 'Headless CMS with real-time collaboration and structured content',
  version: '1.0.0',
  
  supportedTemplates: ['nextjs', 'tanstack', 'nuxt', 'hydrogen'],
  
  packages: {
    dependencies: {
      '@sanity/client': '^6.10.0',
      '@sanity/image-url': '^1.0.2',
      'next-sanity': '^7.1.0',
    },
    devDependencies: {
      '@sanity/cli': '^3.25.0',
      'sanity': '^3.25.0',
      '@sanity/vision': '^3.25.0',
    },
  },
  
  configSchema: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
    dataset: z.string().default('production'),
    apiVersion: z.string().default('2024-01-01'),
    useCdn: z.boolean().default(true),
    studioPath: z.string().default('/studio'),
    enablePreview: z.boolean().default(true),
  }),
  
  envVars: [
    {
      name: 'NEXT_PUBLIC_SANITY_PROJECT_ID',
      description: 'Sanity project ID',
      required: true,
    },
    {
      name: 'NEXT_PUBLIC_SANITY_DATASET',
      description: 'Sanity dataset name',
      required: true,
      default: 'production',
    },
    {
      name: 'NEXT_PUBLIC_SANITY_API_VERSION',
      description: 'Sanity API version',
      required: false,
      default: '2024-01-01',
    },
    {
      name: 'SANITY_API_TOKEN',
      description: 'Sanity API token for write operations',
      required: false,
      secret: true,
    },
  ],
  
  files: [
    // Sanity client configuration
    {
      path: 'src/lib/sanity/client.ts',
      template: `import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '{{options.apiVersion}}',
  useCdn: {{options.useCdn}},
  token: process.env.SANITY_API_TOKEN,
});

// Image URL builder
const builder = imageUrlBuilder(sanityClient);

export function urlFor(source: any) {
  return builder.image(source);
}

// Typed client for better DX
export type SanityImageSource = Parameters<typeof urlFor>[0];
`,
      overwrite: false,
    },
    
    // CMS adapter implementation
    {
      path: 'src/lib/sanity/adapter.ts',
      template: `import { sanityClient } from './client';
import type { CMSAdapter, CMSDocument, CMSQuery } from '@/lib/cms/types';

export class SanityAdapter implements CMSAdapter {
  async getDocument(type: string, slug: string): Promise<CMSDocument | null> {
    const query = \`*[_type == "\${type}" && slug.current == "\${slug}"][0]\`;
    const document = await sanityClient.fetch(query);
    
    if (!document) return null;
    
    return {
      id: document._id,
      type: document._type,
      slug: document.slug?.current,
      title: document.title,
      content: document.content,
      publishedAt: document.publishedAt ? new Date(document.publishedAt) : null,
      updatedAt: document._updatedAt ? new Date(document._updatedAt) : null,
      metadata: {
        ...document,
        _id: undefined,
        _type: undefined,
        _createdAt: undefined,
        _updatedAt: undefined,
        _rev: undefined,
      },
    };
  }

  async getDocuments(type: string, options?: CMSQuery): Promise<CMSDocument[]> {
    let query = \`*[_type == "\${type}"]\`;
    
    if (options?.where) {
      const conditions = Object.entries(options.where)
        .map(([key, value]) => \`\${key} == "\${value}"\`)
        .join(' && ');
      query = \`*[_type == "\${type}" && \${conditions}]\`;
    }
    
    if (options?.orderBy) {
      query += \` | order(\${options.orderBy.field} \${options.orderBy.direction || 'asc'})\`;
    }
    
    if (options?.limit) {
      query += \`[0...\${options.limit - 1}]\`;
    }
    
    const documents = await sanityClient.fetch(query);
    
    return documents.map((doc: any) => ({
      id: doc._id,
      type: doc._type,
      slug: doc.slug?.current,
      title: doc.title,
      content: doc.content,
      publishedAt: doc.publishedAt ? new Date(doc.publishedAt) : null,
      updatedAt: doc._updatedAt ? new Date(doc._updatedAt) : null,
      metadata: {
        ...doc,
        _id: undefined,
        _type: undefined,
        _createdAt: undefined,
        _updatedAt: undefined,
        _rev: undefined,
      },
    }));
  }

  async createDocument(type: string, data: Partial<CMSDocument>): Promise<CMSDocument> {
    const document = await sanityClient.create({
      _type: type,
      title: data.title,
      slug: data.slug ? { current: data.slug } : undefined,
      content: data.content,
      publishedAt: data.publishedAt?.toISOString(),
      ...data.metadata,
    });
    
    return {
      id: document._id,
      type: document._type,
      slug: document.slug?.current,
      title: document.title,
      content: document.content,
      publishedAt: document.publishedAt ? new Date(document.publishedAt) : null,
      updatedAt: document._updatedAt ? new Date(document._updatedAt) : null,
      metadata: document,
    };
  }

  async updateDocument(id: string, data: Partial<CMSDocument>): Promise<CMSDocument> {
    const document = await sanityClient
      .patch(id)
      .set({
        title: data.title,
        slug: data.slug ? { current: data.slug } : undefined,
        content: data.content,
        publishedAt: data.publishedAt?.toISOString(),
        ...data.metadata,
      })
      .commit();
    
    return {
      id: document._id,
      type: document._type,
      slug: document.slug?.current,
      title: document.title,
      content: document.content,
      publishedAt: document.publishedAt ? new Date(document.publishedAt) : null,
      updatedAt: document._updatedAt ? new Date(document._updatedAt) : null,
      metadata: document,
    };
  }

  async deleteDocument(id: string): Promise<void> {
    await sanityClient.delete(id);
  }
}

export const sanityAdapter = new SanityAdapter();
`,
      overwrite: false,
    },
    
    // Sanity Studio configuration
    {
      path: 'sanity.config.ts',
      template: `import { defineConfig } from 'sanity';
import { deskTool } from 'sanity/desk';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './sanity/schemas';

export default defineConfig({
  name: 'default',
  title: '{{config.name}}',
  
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  
  plugins: [
    deskTool(),
    visionTool(),
  ],
  
  schema: {
    types: schemaTypes,
  },
  
  basePath: '{{options.studioPath}}',
});
`,
      overwrite: false,
    },
    
    // Schema definitions
    {
      path: 'sanity/schemas/index.ts',
      template: `import { post } from './post';
import { page } from './page';
import { author } from './author';

export const schemaTypes = [
  // Document types
  post,
  page,
  author,
];
`,
      overwrite: false,
    },
    
    {
      path: 'sanity/schemas/post.ts',
      template: `import { defineField, defineType } from 'sanity';

export const post = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: { type: 'author' },
    }),
    defineField({
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
        },
      ],
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        {
          type: 'block',
        },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternative Text',
            },
          ],
        },
      ],
    }),
  ],
  
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'mainImage',
    },
    prepare(selection) {
      const { author } = selection;
      return { ...selection, subtitle: author && \`by \${author}\` };
    },
  },
});
`,
      overwrite: false,
    },
    
    {
      path: 'sanity/schemas/page.ts',
      template: `import { defineField, defineType } from 'sanity';

export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        {
          type: 'block',
        },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternative Text',
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        {
          name: 'title',
          title: 'SEO Title',
          type: 'string',
        },
        {
          name: 'description',
          title: 'SEO Description',
          type: 'text',
          rows: 3,
        },
      ],
    }),
  ],
  
  preview: {
    select: {
      title: 'title',
      slug: 'slug',
    },
    prepare(selection) {
      const { slug } = selection;
      return { ...selection, subtitle: slug?.current };
    },
  },
});
`,
      overwrite: false,
    },
    
    {
      path: 'sanity/schemas/author.ts',
      template: `import { defineField, defineType } from 'sanity';

export const author = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'array',
      of: [
        {
          title: 'Block',
          type: 'block',
          styles: [{ title: 'Normal', value: 'normal' }],
          lists: [],
        },
      ],
    }),
  ],
  
  preview: {
    select: {
      title: 'name',
      media: 'image',
    },
  },
});
`,
      overwrite: false,
    },
    
    // Next.js Studio route
    {
      path: 'src/app{{options.studioPath}}/[[...index]]/page.tsx',
      template: `'use client';

import { NextStudio } from 'next-sanity/studio';
import config from '../../../../sanity.config';

export default function StudioPage() {
  return <NextStudio config={config} />;
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Sanity utilities
    {
      path: 'src/lib/sanity/queries.ts',
      template: `import { groq } from 'next-sanity';

// Post queries
export const postsQuery = groq\`
  *[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    mainImage,
    publishedAt,
    author->{
      name,
      slug,
      image
    }
  }
\`;

export const postQuery = groq\`
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    content,
    mainImage,
    publishedAt,
    author->{
      name,
      slug,
      image,
      bio
    }
  }
\`;

// Page queries
export const pagesQuery = groq\`
  *[_type == "page"] | order(title asc) {
    _id,
    title,
    slug
  }
\`;

export const pageQuery = groq\`
  *[_type == "page" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    content,
    seo
  }
\`;

// Author queries
export const authorsQuery = groq\`
  *[_type == "author"] | order(name asc) {
    _id,
    name,
    slug,
    image,
    bio
  }
\`;

export const authorQuery = groq\`
  *[_type == "author" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    image,
    bio
  }
\`;
`,
      overwrite: false,
    },
    
    // Portable Text component
    {
      path: 'src/components/sanity/portable-text.tsx',
      template: `import { PortableText as BasePortableText } from '@portabletext/react';
import { urlFor } from '@/lib/sanity/client';
import Image from 'next/image';

const components = {
  types: {
    image: ({ value }: any) => {
      if (!value?.asset?._ref) {
        return null;
      }
      
      return (
        <div className="my-8">
          <Image
            src={urlFor(value).width(800).height(600).url()}
            alt={value.alt || 'Image'}
            width={800}
            height={600}
            className="rounded-lg"
          />
          {value.alt && (
            <p className="text-sm text-gray-600 mt-2 text-center">
              {value.alt}
            </p>
          )}
        </div>
      );
    },
  },
  
  block: {
    h1: ({ children }: any) => (
      <h1 className="text-4xl font-bold mb-6">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-3xl font-semibold mb-4">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-2xl font-medium mb-3">{children}</h3>
    ),
    normal: ({ children }: any) => (
      <p className="mb-4 leading-relaxed">{children}</p>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-gray-300 pl-4 italic my-6">
        {children}
      </blockquote>
    ),
  },
  
  marks: {
    link: ({ children, value }: any) => (
      <a
        href={value.href}
        className="text-blue-600 hover:text-blue-800 underline"
        target={value.blank ? '_blank' : undefined}
        rel={value.blank ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),
    strong: ({ children }: any) => (
      <strong className="font-semibold">{children}</strong>
    ),
    em: ({ children }: any) => (
      <em className="italic">{children}</em>
    ),
  },
};

interface PortableTextProps {
  value: any;
  className?: string;
}

export function PortableText({ value, className }: PortableTextProps) {
  return (
    <div className={className}>
      <BasePortableText value={value} components={components} />
    </div>
  );
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Example usage component
    {
      path: 'src/components/examples/sanity-example.tsx',
      template: `'use client';

import { useEffect, useState } from 'react';
import { sanityClient } from '@/lib/sanity/client';
import { postsQuery } from '@/lib/sanity/queries';

interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt?: string;
  publishedAt: string;
  author?: {
    name: string;
  };
}

export function SanityExample() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const data = await sanityClient.fetch(postsQuery);
        setPosts(data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Sanity CMS Content</h2>
      
      {posts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No posts found.</p>
          <p className="text-sm text-gray-500">
            Create some content in your Sanity Studio at{' '}
            <a 
              href="{{options.studioPath}}" 
              className="text-blue-600 hover:underline"
            >
              {{options.studioPath}}
            </a>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <article key={post._id} className="border-b pb-4 last:border-b-0">
              <h3 className="font-medium text-lg mb-2">{post.title}</h3>
              {post.excerpt && (
                <p className="text-gray-600 text-sm mb-2">{post.excerpt}</p>
              )}
              <div className="flex items-center text-xs text-gray-500">
                {post.author && <span>By {post.author.name}</span>}
                {post.publishedAt && (
                  <span className={post.author ? 'ml-2' : ''}>
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      
      <div className="mt-6 pt-4 border-t">
        <p className="text-sm text-gray-500">
          ✅ Sanity CMS is configured and ready to use!
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
  
  postInstall: `🚀 Sanity CMS has been configured successfully!

Next steps:
1. Set up your Sanity project:
   - Visit https://sanity.io/manage
   - Create a new project or use existing one
   - Add the project ID to your environment variables

2. Configure your environment:
   - Copy .env.example to .env.local
   - Add your Sanity project ID and dataset

3. Start creating content:
   - Visit {{options.studioPath}} to access Sanity Studio
   - Create your first post or page

4. Deploy your studio:
   - Run: npx sanity deploy

Example usage:
\`\`\`tsx
import { sanityClient } from '@/lib/sanity/client';

const posts = await sanityClient.fetch('*[_type == "post"]');
\`\`\`

Documentation: https://www.sanity.io/docs`,
});

export default cmsSanityPlugin;