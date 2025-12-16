# Meilisearch Search Engine Plugin

Fast and typo-tolerant search with Meilisearch.

## Features

- Lightning-fast full-text search
- Typo tolerance and fuzzy matching
- Faceted search and filtering
- Instant search with real-time results
- Multi-language support
- Customizable ranking rules
- Geo-search capabilities

## Installation

```bash
npx scaforge add search-meilisearch
```

## Configuration

The plugin will prompt you for:
- Meilisearch host URL
- Master key for authentication
- Default search settings
- Enable typo tolerance
- Configure ranking rules
- Set up faceted search

## Environment Variables

```env
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_MASTER_KEY=your_master_key_here
```

## Usage

### Basic Search

```tsx
import { searchClient } from '@/lib/meilisearch/client';

// Search documents
const results = await searchClient.search('products', 'laptop', {
  limit: 20,
  offset: 0,
});
```

### Search with Hooks

```tsx
import { useSearch } from '@/lib/meilisearch/hooks';

function SearchResults() {
  const { results, loading, error, search } = useSearch('products');

  return (
    <div>
      <input
        type="text"
        onChange={(e) => search(e.target.value)}
        placeholder="Search products..."
      />
      
      {loading && <div>Searching...</div>}
      {results.map(result => (
        <div key={result.id}>{result.title}</div>
      ))}
    </div>
  );
}
```

### Index Management

```tsx
import { indexManager } from '@/lib/meilisearch/index-manager';

// Add documents to index
await indexManager.addDocuments('products', [
  { id: 1, title: 'Laptop', category: 'Electronics' },
  { id: 2, title: 'Phone', category: 'Electronics' },
]);

// Update search settings
await indexManager.updateSettings('products', {
  searchableAttributes: ['title', 'description'],
  filterableAttributes: ['category', 'price'],
  sortableAttributes: ['price', 'created_at'],
});
```

## Documentation

- [Meilisearch Documentation](https://docs.meilisearch.com/)
- [JavaScript SDK](https://docs.meilisearch.com/reference/api/overview.html)
- [Search Parameters](https://docs.meilisearch.com/reference/api/search.html)