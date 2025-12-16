/**
 * Meilisearch Search Engine Plugin for Scaforge
 * Fast and typo-tolerant search with Meilisearch
 */
import { z } from 'zod';
import { definePlugin } from '@scaforge/core';

export const searchMeilisearchPlugin = definePlugin({
  name: 'search-meilisearch',
  displayName: 'Meilisearch Search',
  category: 'search',
  description: 'Fast and typo-tolerant search with Meilisearch',
  version: '1.0.0',
  
  supportedTemplates: ['nextjs', 'tanstack', 'nuxt', 'hydrogen'],
  
  packages: {
    dependencies: {
      'meilisearch': '^0.37.0',
    },
  },
  
  configSchema: z.object({
    enableTypoTolerance: z.boolean().default(true),
    maxTypos: z.number().default(2),
    enableFacetedSearch: z.boolean().default(true),
    enableGeoSearch: z.boolean().default(false),
    defaultLimit: z.number().default(20),
    enableHighlighting: z.boolean().default(true),
    enableSynonyms: z.boolean().default(false),
    rankingRules: z.array(z.string()).default([
      'words',
      'typo',
      'proximity',
      'attribute',
      'sort',
      'exactness',
    ]),
  }),
  
  envVars: [
    {
      name: 'MEILISEARCH_HOST',
      description: 'Meilisearch server host URL',
      required: true,
      default: 'http://localhost:7700',
    },
    {
      name: 'MEILISEARCH_MASTER_KEY',
      description: 'Meilisearch master key for authentication',
      required: false,
      secret: true,
    },
  ],
  
  files: [
    // Meilisearch client
    {
      path: 'src/lib/meilisearch/client.ts',
      template: `import { MeiliSearch } from 'meilisearch';

export const meiliClient = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_MASTER_KEY,
});

export interface SearchOptions {
  limit?: number;
  offset?: number;
  filter?: string | string[];
  facets?: string[];
  attributesToRetrieve?: string[];
  attributesToHighlight?: string[];
  attributesToCrop?: string[];
  cropLength?: number;
  cropMarker?: string;
  highlightPreTag?: string;
  highlightPostTag?: string;
  sort?: string[];
  matchingStrategy?: 'last' | 'all';
  showMatchesPosition?: boolean;
}

export interface SearchResult<T = any> {
  hits: T[];
  query: string;
  processingTimeMs: number;
  limit: number;
  offset: number;
  estimatedTotalHits: number;
  facetDistribution?: Record<string, Record<string, number>>;
}

export class MeilisearchClient {
  private client = meiliClient;

  async search<T = any>(
    indexName: string,
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult<T>> {
    const index = this.client.index(indexName);
    
    const searchOptions = {
      limit: options.limit || {{options.defaultLimit}},
      offset: options.offset || 0,
      filter: options.filter,
      facets: options.facets,
      attributesToRetrieve: options.attributesToRetrieve,
      {{#if options.enableHighlighting}}
      attributesToHighlight: options.attributesToHighlight || ['*'],
      highlightPreTag: options.highlightPreTag || '<mark>',
      highlightPostTag: options.highlightPostTag || '</mark>',
      {{/if}}
      attributesToCrop: options.attributesToCrop,
      cropLength: options.cropLength || 200,
      cropMarker: options.cropMarker || '...',
      sort: options.sort,
      matchingStrategy: options.matchingStrategy || 'last',
      showMatchesPosition: options.showMatchesPosition || false,
    };

    return await index.search(query, searchOptions);
  }

  async multiSearch(queries: Array<{
    indexUid: string;
    q: string;
    options?: SearchOptions;
  }>) {
    const searchQueries = queries.map(({ indexUid, q, options = {} }) => ({
      indexUid,
      q,
      limit: options.limit || {{options.defaultLimit}},
      offset: options.offset || 0,
      filter: options.filter,
      facets: options.facets,
      attributesToRetrieve: options.attributesToRetrieve,
      {{#if options.enableHighlighting}}
      attributesToHighlight: options.attributesToHighlight || ['*'],
      {{/if}}
      sort: options.sort,
    }));

    return await this.client.multiSearch({ queries: searchQueries });
  }

  async getIndex(indexName: string) {
    return this.client.index(indexName);
  }

  async createIndex(indexName: string, primaryKey?: string) {
    return await this.client.createIndex(indexName, { primaryKey });
  }

  async deleteIndex(indexName: string) {
    return await this.client.deleteIndex(indexName);
  }

  async getIndexes() {
    return await this.client.getIndexes();
  }

  async getStats() {
    return await this.client.getStats();
  }

  async isHealthy() {
    try {
      await this.client.health();
      return true;
    } catch {
      return false;
    }
  }
}

export const searchClient = new MeilisearchClient();
`,
      overwrite: false,
    },
    
    // Index management utilities
    {
      path: 'src/lib/meilisearch/index-manager.ts',
      template: `import { meiliClient } from './client';

export interface IndexSettings {
  searchableAttributes?: string[];
  filterableAttributes?: string[];
  sortableAttributes?: string[];
  rankingRules?: string[];
  stopWords?: string[];
  synonyms?: Record<string, string[]>;
  distinctAttribute?: string;
  typoTolerance?: {
    enabled?: boolean;
    minWordSizeForTypos?: {
      oneTypo?: number;
      twoTypos?: number;
    };
    disableOnWords?: string[];
    disableOnAttributes?: string[];
  };
  faceting?: {
    maxValuesPerFacet?: number;
  };
  pagination?: {
    maxTotalHits?: number;
  };
}

export class IndexManager {
  private client = meiliClient;

  async createIndex(indexName: string, primaryKey?: string) {
    try {
      const task = await this.client.createIndex(indexName, { primaryKey });
      await this.client.waitForTask(task.taskUid);
      
      // Apply default settings
      await this.updateSettings(indexName, this.getDefaultSettings());
      
      return { success: true, indexName, primaryKey };
    } catch (error) {
      console.error(\`Failed to create index \${indexName}:\`, error);
      throw error;
    }
  }

  async deleteIndex(indexName: string) {
    try {
      const task = await this.client.deleteIndex(indexName);
      await this.client.waitForTask(task.taskUid);
      return { success: true, indexName };
    } catch (error) {
      console.error(\`Failed to delete index \${indexName}:\`, error);
      throw error;
    }
  }

  async updateSettings(indexName: string, settings: IndexSettings) {
    try {
      const index = this.client.index(indexName);
      const task = await index.updateSettings(settings);
      await this.client.waitForTask(task.taskUid);
      return { success: true, indexName, settings };
    } catch (error) {
      console.error(\`Failed to update settings for \${indexName}:\`, error);
      throw error;
    }
  }

  async getSettings(indexName: string) {
    try {
      const index = this.client.index(indexName);
      return await index.getSettings();
    } catch (error) {
      console.error(\`Failed to get settings for \${indexName}:\`, error);
      throw error;
    }
  }

  async addDocuments(indexName: string, documents: any[], primaryKey?: string) {
    try {
      const index = this.client.index(indexName);
      const task = await index.addDocuments(documents, { primaryKey });
      await this.client.waitForTask(task.taskUid);
      return { success: true, indexName, documentsAdded: documents.length };
    } catch (error) {
      console.error(\`Failed to add documents to \${indexName}:\`, error);
      throw error;
    }
  }

  async updateDocuments(indexName: string, documents: any[], primaryKey?: string) {
    try {
      const index = this.client.index(indexName);
      const task = await index.updateDocuments(documents, { primaryKey });
      await this.client.waitForTask(task.taskUid);
      return { success: true, indexName, documentsUpdated: documents.length };
    } catch (error) {
      console.error(\`Failed to update documents in \${indexName}:\`, error);
      throw error;
    }
  }

  async deleteDocument(indexName: string, documentId: string | number) {
    try {
      const index = this.client.index(indexName);
      const task = await index.deleteDocument(documentId);
      await this.client.waitForTask(task.taskUid);
      return { success: true, indexName, documentId };
    } catch (error) {
      console.error(\`Failed to delete document \${documentId} from \${indexName}:\`, error);
      throw error;
    }
  }

  async deleteDocuments(indexName: string, documentIds: (string | number)[]) {
    try {
      const index = this.client.index(indexName);
      const task = await index.deleteDocuments(documentIds);
      await this.client.waitForTask(task.taskUid);
      return { success: true, indexName, documentsDeleted: documentIds.length };
    } catch (error) {
      console.error(\`Failed to delete documents from \${indexName}:\`, error);
      throw error;
    }
  }

  async clearIndex(indexName: string) {
    try {
      const index = this.client.index(indexName);
      const task = await index.deleteAllDocuments();
      await this.client.waitForTask(task.taskUid);
      return { success: true, indexName };
    } catch (error) {
      console.error(\`Failed to clear index \${indexName}:\`, error);
      throw error;
    }
  }

  async getIndexStats(indexName: string) {
    try {
      const index = this.client.index(indexName);
      return await index.getStats();
    } catch (error) {
      console.error(\`Failed to get stats for \${indexName}:\`, error);
      throw error;
    }
  }

  async getDocument(indexName: string, documentId: string | number) {
    try {
      const index = this.client.index(indexName);
      return await index.getDocument(documentId);
    } catch (error) {
      console.error(\`Failed to get document \${documentId} from \${indexName}:\`, error);
      throw error;
    }
  }

  async getDocuments(indexName: string, options?: {
    offset?: number;
    limit?: number;
    fields?: string[];
  }) {
    try {
      const index = this.client.index(indexName);
      return await index.getDocuments(options);
    } catch (error) {
      console.error(\`Failed to get documents from \${indexName}:\`, error);
      throw error;
    }
  }

  private getDefaultSettings(): IndexSettings {
    return {
      rankingRules: {{JSON.stringify options.rankingRules}},
      {{#if options.enableTypoTolerance}}
      typoTolerance: {
        enabled: true,
        minWordSizeForTypos: {
          oneTypo: 5,
          twoTypos: 9,
        },
      },
      {{/if}}
      {{#if options.enableFacetedSearch}}
      faceting: {
        maxValuesPerFacet: 100,
      },
      {{/if}}
      pagination: {
        maxTotalHits: 1000,
      },
    };
  }
}

export const indexManager = new IndexManager();
`,
      overwrite: false,
    },
    
    // React hooks for search
    {
      path: 'src/lib/meilisearch/hooks.ts',
      template: `'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { searchClient, SearchOptions, SearchResult } from './client';

export interface UseSearchOptions extends SearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  enabled?: boolean;
}

export interface UseSearchResult<T = any> {
  results: T[];
  loading: boolean;
  error: Error | null;
  query: string;
  totalHits: number;
  processingTime: number;
  facets: Record<string, Record<string, number>> | undefined;
  search: (query: string) => void;
  clear: () => void;
  loadMore: () => void;
  hasMore: boolean;
}

export function useSearch<T = any>(
  indexName: string,
  initialQuery: string = '',
  options: UseSearchOptions = {}
): UseSearchResult<T> {
  const {
    debounceMs = 300,
    minQueryLength = 1,
    enabled = true,
    limit = {{options.defaultLimit}},
    ...searchOptions
  } = options;

  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [totalHits, setTotalHits] = useState(0);
  const [processingTime, setProcessingTime] = useState(0);
  const [facets, setFacets] = useState<Record<string, Record<string, number>>>();
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  const performSearch = useCallback(async (
    searchQuery: string,
    searchOffset: number = 0,
    append: boolean = false
  ) => {
    if (!enabled || searchQuery.length < minQueryLength) {
      if (!append) {
        setResults([]);
        setTotalHits(0);
        setHasMore(false);
      }
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      setError(null);

      const searchResult: SearchResult<T> = await searchClient.search(
        indexName,
        searchQuery,
        {
          ...searchOptions,
          limit,
          offset: searchOffset,
        }
      );

      if (append) {
        setResults(prev => [...prev, ...searchResult.hits]);
      } else {
        setResults(searchResult.hits);
      }

      setTotalHits(searchResult.estimatedTotalHits);
      setProcessingTime(searchResult.processingTimeMs);
      setFacets(searchResult.facetDistribution);
      setHasMore(searchResult.hits.length === limit);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [indexName, enabled, minQueryLength, limit, searchOptions]);

  const search = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setOffset(0);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(newQuery, 0, false);
    }, debounceMs);
  }, [performSearch, debounceMs]);

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setTotalHits(0);
    setProcessingTime(0);
    setFacets(undefined);
    setOffset(0);
    setHasMore(false);
    setError(null);
  }, []);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      const newOffset = offset + limit;
      setOffset(newOffset);
      performSearch(query, newOffset, true);
    }
  }, [hasMore, loading, offset, limit, query, performSearch]);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, 0, false);
    }
  }, [initialQuery, performSearch]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    results,
    loading,
    error,
    query,
    totalHits,
    processingTime,
    facets,
    search,
    clear,
    loadMore,
    hasMore,
  };
}

export interface UseInstantSearchOptions extends SearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
}

export function useInstantSearch<T = any>(
  indexName: string,
  options: UseInstantSearchOptions = {}
) {
  const {
    debounceMs = 100, // Faster for instant search
    minQueryLength = 1,
    ...searchOptions
  } = options;

  return useSearch<T>(indexName, '', {
    debounceMs,
    minQueryLength,
    ...searchOptions,
  });
}

export interface UseFacetedSearchOptions extends SearchOptions {
  facets: string[];
}

export function useFacetedSearch<T = any>(
  indexName: string,
  options: UseFacetedSearchOptions
) {
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  
  const filterString = Object.entries(filters)
    .filter(([, values]) => values.length > 0)
    .map(([facet, values]) => 
      values.map(value => \`\${facet} = "\${value}"\`).join(' OR ')
    )
    .join(' AND ');

  const searchResult = useSearch<T>(indexName, '', {
    ...options,
    filter: filterString || undefined,
  });

  const updateFilter = useCallback((facet: string, values: string[]) => {
    setFilters(prev => ({
      ...prev,
      [facet]: values,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    ...searchResult,
    filters,
    updateFilter,
    clearFilters,
  };
}
`,
      overwrite: false,
    },
    
    // Search API routes
    {
      path: 'src/app/api/search/[index]/route.ts',
      template: `import { NextRequest, NextResponse } from 'next/server';
import { searchClient } from '@/lib/meilisearch/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { index: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '{{options.defaultLimit}}');
    const offset = parseInt(searchParams.get('offset') || '0');
    const filter = searchParams.get('filter');
    const facets = searchParams.get('facets')?.split(',');
    const sort = searchParams.get('sort')?.split(',');
    const attributesToRetrieve = searchParams.get('attributesToRetrieve')?.split(',');
    const attributesToHighlight = searchParams.get('attributesToHighlight')?.split(',');

    const results = await searchClient.search(params.index, query, {
      limit,
      offset,
      filter: filter ? [filter] : undefined,
      facets,
      sort,
      attributesToRetrieve,
      attributesToHighlight,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { index: string } }
) {
  try {
    const body = await request.json();
    const { query, options = {} } = body;

    const results = await searchClient.search(params.index, query, options);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Multi-search API route
    {
      path: 'src/app/api/search/multi/route.ts',
      template: `import { NextRequest, NextResponse } from 'next/server';
import { searchClient } from '@/lib/meilisearch/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { queries } = body;

    if (!Array.isArray(queries)) {
      return NextResponse.json(
        { error: 'Queries must be an array' },
        { status: 400 }
      );
    }

    const results = await searchClient.multiSearch(queries);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Multi-search API error:', error);
    return NextResponse.json(
      { error: 'Multi-search failed' },
      { status: 500 }
    );
  }
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Search components
    {
      path: 'src/components/meilisearch/search-box.tsx',
      template: `'use client';

import { useState, useRef, useEffect } from 'react';

interface SearchBoxProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
  loading?: boolean;
  className?: string;
  debounceMs?: number;
}

export function SearchBox({
  placeholder = 'Search...',
  onSearch,
  onClear,
  loading = false,
  className = '',
  debounceMs = 300,
}: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onSearch(query);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, onSearch, debounceMs]);

  const handleClear = () => {
    setQuery('');
    onClear?.();
  };

  return (
    <div className={\`relative \${className}\`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        {/* Search icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Loading spinner or clear button */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {loading ? (
            <svg
              className="animate-spin h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : query ? (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
`,
      overwrite: false,
    },
    
    {
      path: 'src/components/meilisearch/search-results.tsx',
      template: `'use client';

import { ReactNode } from 'react';

interface SearchResultsProps<T = any> {
  results: T[];
  loading: boolean;
  error: Error | null;
  query: string;
  totalHits: number;
  processingTime: number;
  renderResult: (result: T, index: number) => ReactNode;
  renderEmpty?: () => ReactNode;
  renderError?: (error: Error) => ReactNode;
  renderLoading?: () => ReactNode;
  className?: string;
}

export function SearchResults<T = any>({
  results,
  loading,
  error,
  query,
  totalHits,
  processingTime,
  renderResult,
  renderEmpty,
  renderError,
  renderLoading,
  className = '',
}: SearchResultsProps<T>) {
  if (loading) {
    return (
      <div className={\`\${className}\`}>
        {renderLoading ? renderLoading() : (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Searching...</span>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className={\`\${className}\`}>
        {renderError ? renderError(error) : (
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">Search Error</div>
            <div className="text-gray-600 text-sm">{error.message}</div>
          </div>
        )}
      </div>
    );
  }

  if (results.length === 0 && query) {
    return (
      <div className={\`\${className}\`}>
        {renderEmpty ? renderEmpty() : (
          <div className="text-center py-8">
            <div className="text-gray-600 mb-2">No results found</div>
            <div className="text-gray-500 text-sm">
              Try adjusting your search terms
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={\`\${className}\`}>
      {query && (
        <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
          <div>
            {totalHits.toLocaleString()} results for "{query}"
          </div>
          <div>
            {processingTime}ms
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={index}>
            {renderResult(result, index)}
          </div>
        ))}
      </div>
    </div>
  );
}
`,
      overwrite: false,
    },
    
    {
      path: 'src/components/meilisearch/faceted-search.tsx',
      template: `'use client';

interface FacetProps {
  title: string;
  facetKey: string;
  facetData: Record<string, number>;
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  maxItems?: number;
}

export function Facet({
  title,
  facetKey,
  facetData,
  selectedValues,
  onSelectionChange,
  maxItems = 10,
}: FacetProps) {
  const sortedFacets = Object.entries(facetData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxItems);

  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter(v => v !== value));
    } else {
      onSelectionChange([...selectedValues, value]);
    }
  };

  if (sortedFacets.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h3 className="font-medium text-gray-900 mb-3">{title}</h3>
      <div className="space-y-2">
        {sortedFacets.map(([value, count]) => (
          <label key={value} className="flex items-center">
            <input
              type="checkbox"
              checked={selectedValues.includes(value)}
              onChange={() => handleToggle(value)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              {value} ({count})
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

interface FacetedSearchProps {
  facets: Record<string, Record<string, number>>;
  filters: Record<string, string[]>;
  onFilterChange: (facet: string, values: string[]) => void;
  facetConfig: Array<{
    key: string;
    title: string;
    maxItems?: number;
  }>;
  className?: string;
}

export function FacetedSearch({
  facets,
  filters,
  onFilterChange,
  facetConfig,
  className = '',
}: FacetedSearchProps) {
  return (
    <div className={\`\${className}\`}>
      <h2 className="font-semibold text-gray-900 mb-4">Filters</h2>
      
      {facetConfig.map(({ key, title, maxItems }) => (
        <Facet
          key={key}
          title={title}
          facetKey={key}
          facetData={facets[key] || {}}
          selectedValues={filters[key] || []}
          onSelectionChange={(values) => onFilterChange(key, values)}
          maxItems={maxItems}
        />
      ))}
    </div>
  );
}
`,
      overwrite: false,
    },
    
    // Example usage component
    {
      path: 'src/components/examples/meilisearch-example.tsx',
      template: `'use client';

import { useState, useEffect } from 'react';
import { useSearch, useFacetedSearch } from '@/lib/meilisearch/hooks';
import { indexManager } from '@/lib/meilisearch/index-manager';
import { SearchBox } from '@/components/meilisearch/search-box';
import { SearchResults } from '@/components/meilisearch/search-results';
import { FacetedSearch } from '@/components/meilisearch/faceted-search';

// Sample data for demonstration
const sampleProducts = [
  {
    id: 1,
    title: 'MacBook Pro 16"',
    description: 'Powerful laptop for professionals',
    category: 'Electronics',
    brand: 'Apple',
    price: 2499,
    rating: 4.8,
  },
  {
    id: 2,
    title: 'iPhone 15 Pro',
    description: 'Latest smartphone with advanced features',
    category: 'Electronics',
    brand: 'Apple',
    price: 999,
    rating: 4.7,
  },
  {
    id: 3,
    title: 'Samsung Galaxy S24',
    description: 'Android flagship smartphone',
    category: 'Electronics',
    brand: 'Samsung',
    price: 899,
    rating: 4.6,
  },
  {
    id: 4,
    title: 'Dell XPS 13',
    description: 'Compact and powerful ultrabook',
    category: 'Electronics',
    brand: 'Dell',
    price: 1299,
    rating: 4.5,
  },
  {
    id: 5,
    title: 'AirPods Pro',
    description: 'Wireless earbuds with noise cancellation',
    category: 'Audio',
    brand: 'Apple',
    price: 249,
    rating: 4.4,
  },
];

export function MeilisearchExample() {
  const [indexReady, setIndexReady] = useState(false);
  const [setupStatus, setSetupStatus] = useState<string>('');

  // Basic search
  const {
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    query,
    totalHits,
    processingTime,
    search,
    clear,
  } = useSearch('products', '', {
    attributesToHighlight: ['title', 'description'],
    attributesToRetrieve: ['id', 'title', 'description', 'category', 'brand', 'price', 'rating'],
  });

  // Faceted search
  const {
    results: facetedResults,
    loading: facetedLoading,
    error: facetedError,
    facets,
    filters,
    updateFilter,
    clearFilters,
    search: facetedSearch,
  } = useFacetedSearch('products', {
    facets: ['category', 'brand'],
    attributesToHighlight: ['title', 'description'],
  });

  const setupIndex = async () => {
    try {
      setSetupStatus('Setting up search index...');
      
      // Create index
      await indexManager.createIndex('products', 'id');
      
      // Configure search settings
      await indexManager.updateSettings('products', {
        searchableAttributes: ['title', 'description', 'brand'],
        filterableAttributes: ['category', 'brand', 'price', 'rating'],
        sortableAttributes: ['price', 'rating'],
        {{#if options.enableFacetedSearch}}
        faceting: {
          maxValuesPerFacet: 100,
        },
        {{/if}}
        {{#if options.enableTypoTolerance}}
        typoTolerance: {
          enabled: true,
          minWordSizeForTypos: {
            oneTypo: 5,
            twoTypos: 9,
          },
        },
        {{/if}}
      });
      
      // Add sample documents
      await indexManager.addDocuments('products', sampleProducts);
      
      setSetupStatus('Index setup complete!');
      setIndexReady(true);
    } catch (error) {
      setSetupStatus(\`Setup failed: \${error instanceof Error ? error.message : 'Unknown error'}\`);
    }
  };

  const renderProduct = (product: any) => (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 
          className="font-semibold text-lg"
          dangerouslySetInnerHTML={{ __html: product._formatted?.title || product.title }}
        />
        <span className="text-lg font-bold text-green-600">
          \${product.price}
        </span>
      </div>
      
      <p 
        className="text-gray-600 mb-2"
        dangerouslySetInnerHTML={{ __html: product._formatted?.description || product.description }}
      />
      
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {product.category}
          </span>
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
            {product.brand}
          </span>
        </div>
        <div className="flex items-center">
          <span className="text-yellow-500">★</span>
          <span className="ml-1">{product.rating}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">Meilisearch Search Engine</h2>
      
      {/* Setup Section */}
      {!indexReady && (
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="font-medium mb-3">Setup Search Index</h3>
          <button
            onClick={setupIndex}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mb-2"
          >
            Initialize Search Index
          </button>
          {setupStatus && (
            <div className="text-sm text-gray-600">{setupStatus}</div>
          )}
        </div>
      )}

      {indexReady && (
        <>
          {/* Basic Search */}
          <div className="mb-8">
            <h3 className="font-medium mb-3">Basic Search</h3>
            <SearchBox
              placeholder="Search products..."
              onSearch={search}
              onClear={clear}
              loading={searchLoading}
              className="mb-4"
            />
            
            <SearchResults
              results={searchResults}
              loading={searchLoading}
              error={searchError}
              query={query}
              totalHits={totalHits}
              processingTime={processingTime}
              renderResult={renderProduct}
            />
          </div>

          {/* Faceted Search */}
          <div className="border-t pt-8">
            <h3 className="font-medium mb-3">Faceted Search</h3>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <FacetedSearch
                  facets={facets || {}}
                  filters={filters}
                  onFilterChange={updateFilter}
                  facetConfig={[
                    { key: 'category', title: 'Category' },
                    { key: 'brand', title: 'Brand' },
                  ]}
                />
                
                {Object.keys(filters).some(key => filters[key].length > 0) && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
              
              <div className="lg:col-span-3">
                <SearchBox
                  placeholder="Search with filters..."
                  onSearch={facetedSearch}
                  loading={facetedLoading}
                  className="mb-4"
                />
                
                <SearchResults
                  results={facetedResults}
                  loading={facetedLoading}
                  error={facetedError}
                  query=""
                  totalHits={facetedResults.length}
                  processingTime={0}
                  renderResult={renderProduct}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Status */}
      <div className="mt-8 p-4 bg-green-50 rounded-lg">
        <p className="text-green-800">
          ✅ Meilisearch is configured and ready for search!
        </p>
        <p className="text-sm text-green-600 mt-1">
          Features: Typo tolerance: {{options.enableTypoTolerance}} | Faceted search: {{options.enableFacetedSearch}} | Highlighting: {{options.enableHighlighting}}
        </p>
      </div>
    </div>
  );
}
`,
      overwrite: false,
    },
  ],
  
  postInstall: `🚀 Meilisearch Search Engine has been configured successfully!

Next steps:
1. Set up Meilisearch server (install and run locally or use Meilisearch Cloud)
2. Create your first search index using the indexManager
3. Use the useSearch hook in your components
4. Configure search settings for your indexes

Documentation: https://docs.meilisearch.com/`,
});

export default searchMeilisearchPlugin;