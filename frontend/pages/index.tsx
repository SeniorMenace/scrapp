import React, { useState, useCallback, useRef, KeyboardEvent } from 'react';
import Head from 'next/head';
import axios from 'axios';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Product {
  market: string;
  title: string;
  price: string;
  priceRaw: number;
  link: string;
  image?: string;
  shop?: string;
  inStock?: boolean;
}

interface ApiResponse {
  success: boolean;
  count: number;
  markets: string[];
  data: Product[];
  executionTime?: number;
  error?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MARKETS = [
  { id: 'OLX', label: 'OLX', color: '#3db3e3', className: 'market-olx' },
  { id: 'Uzum', label: 'Uzum', color: '#f4623a', className: 'market-uzum' },
  { id: 'Wildberries', label: 'WB', color: '#a52b9a', className: 'market-wildberries' },
  { id: 'Yandex Market', label: 'Yandex', color: '#fc3f1d', className: 'market-yandex' },
];

const SKELETON_COUNT = 8;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMarketClass(market: string): string {
  const m = market.toLowerCase();
  if (m.includes('olx')) return 'market-olx';
  if (m.includes('uzum')) return 'market-uzum';
  if (m.includes('wildberries') || m === 'wb') return 'market-wildberries';
  if (m.includes('yandex')) return 'market-yandex';
  return '';
}

function getMarketLabel(market: string): string {
  const m = market.toLowerCase();
  if (m.includes('wildberries')) return 'WB';
  if (m.includes('yandex')) return 'Yandex';
  return market;
}

function formatExecTime(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-img" />
      <div className="skeleton-body">
        <div className="skeleton-line" style={{ height: 14, width: '90%' }} />
        <div className="skeleton-line" style={{ height: 14, width: '70%' }} />
        <div className="skeleton-line" style={{ height: 22, width: '50%', marginTop: 4 }} />
        <div className="skeleton-line" style={{ height: 36, width: '100%', marginTop: 8, borderRadius: 8 }} />
      </div>
    </div>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const [imgError, setImgError] = useState(false);
  const marketClass = getMarketClass(product.market);
  const hasPrice = product.priceRaw > 0;
  const delay = Math.min(index * 40, 400);

  return (
    <div className="card" style={{ animationDelay: `${delay}ms` }}>
      <div className="card-image">
        {product.image && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.title}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="card-image-placeholder">
            <span>🛒</span>
            <span>No image</span>
          </div>
        )}
        <span className={`card-market-badge ${marketClass}`}>
          {getMarketLabel(product.market)}
        </span>
      </div>

      <div className="card-body">
        <p className="card-title" title={product.title}>{product.title}</p>
        <p className={`card-price${!hasPrice ? ' no-price' : ''}`}>
          {product.price}
        </p>
        {product.shop && (
          <p className="card-shop">
            <span>🏪</span> {product.shop}
          </p>
        )}
        <div className="card-footer">
          <a
            href={product.link}
            target="_blank"
            rel="noopener noreferrer"
            className="buy-btn"
          >
            <span>Buy</span>
            <span>→</span>
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [markets, setMarkets] = useState<string[]>([]);
  const [execTime, setExecTime] = useState<number | null>(null);
  const [sort, setSort] = useState<'asc' | 'desc'>('asc');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (!q || q.length < 2) return;

    setLoading(true);
    setError('');
    setHasSearched(true);
    setActiveFilters([]);

    try {
      const { data } = await axios.get<ApiResponse>('/api/search', {
        params: { query: q },
        timeout: 30000,
      });

      if (data.success) {
        setResults(data.data || []);
        setMarkets(data.markets || []);
        setExecTime(data.executionTime ?? null);
      } else {
        setError(data.error || 'No results found');
        setResults([]);
        setMarkets([]);
        setExecTime(null);
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.error ||
        e?.message ||
        'Failed to connect to server. Is the backend running?';
      setError(msg);
      setResults([]);
      setMarkets([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const toggleFilter = (market: string) => {
    setActiveFilters((prev) =>
      prev.includes(market) ? prev.filter((f) => f !== market) : [...prev, market],
    );
  };

  // Sort + filter logic
  const displayedResults = [...results]
    .filter((r) => {
      if (activeFilters.length === 0) return true;
      return activeFilters.some((f) => r.market.toLowerCase().includes(f.toLowerCase()));
    })
    .sort((a, b) =>
      sort === 'asc' ? a.priceRaw - b.priceRaw : b.priceRaw - a.priceRaw,
    );

  const hasResults = displayedResults.length > 0;

  return (
    <>
      <Head>
        <title>PriceSpy — Multi Market Price Scraper</title>
        <meta
          name="description"
          content="Compare prices instantly across OLX, Uzum Market, Wildberries, and Yandex Market in one search."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔍</text></svg>" />
      </Head>

      <div className="page-wrapper">
        {/* Header */}
        <div className="container">
          <header className="header">
            <div className="logo">
              <div className="logo-icon">🔍</div>
              PriceSpy
            </div>
          </header>
        </div>

        {/* Hero + Search */}
        <div className="container">
          <section className="hero">
            <h1 className="hero-title">
              Find the Best Price<br />
              <span>Across Every Market</span>
            </h1>
            <p className="hero-subtitle">
              Search OLX, Uzum, Wildberries & Yandex Market simultaneously.
              Compare prices in seconds.
            </p>

            <div className="search-section">
              <div className="search-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  ref={inputRef}
                  className="search-input"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Try: iPhone 13 128GB, Xiaomi Mi 11..."
                  maxLength={100}
                  autoFocus
                />
                <button
                  className="search-btn"
                  onClick={handleSearch}
                  disabled={loading || !query.trim() || query.trim().length < 2}
                >
                  {loading ? (
                    <>
                      <span>Searching</span>
                      <span className="loading-dots">
                        <span>.</span><span>.</span><span>.</span>
                      </span>
                    </>
                  ) : (
                    'Search'
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && !loading && (
              <div className="error-box scale-in">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
          </section>
        </div>

        {/* Controls (only shown when results exist) */}
        {(hasResults || loading) && (
          <div className="controls-bar">
            <span className="controls-label">Market</span>
            <div className="filter-chips">
              {MARKETS.map((m) => {
                const isActive = activeFilters.includes(m.id);
                return (
                  <button
                    key={m.id}
                    className={`chip ${isActive ? 'active' : ''}`}
                    onClick={() => toggleFilter(m.id)}
                    style={
                      isActive
                        ? undefined
                        : { '--chip-color': m.color } as React.CSSProperties
                    }
                  >
                    <span
                      className="chip-dot"
                      style={{ background: m.color }}
                    />
                    {m.label}
                  </button>
                );
              })}
            </div>

            <div className="sort-toggle" aria-label="Sort by price">
              <span className="controls-label" style={{ padding: '0 0.25rem' }}>
                Price
              </span>
              <button
                className={`sort-btn ${sort === 'asc' ? 'active' : ''}`}
                onClick={() => setSort('asc')}
              >
                ↑ Low
              </button>
              <button
                className={`sort-btn ${sort === 'desc' ? 'active' : ''}`}
                onClick={() => setSort('desc')}
              >
                ↓ High
              </button>
            </div>
          </div>
        )}

        {/* Results meta */}
        {hasResults && !loading && (
          <div className="results-meta fade-in">
            <p className="results-count">
              <strong>{displayedResults.length}</strong>{' '}
              {displayedResults.length === 1 ? 'product' : 'products'} found
              {activeFilters.length > 0 && ` (filtered)`}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="market-badges">
                {markets.map((m) => (
                  <span
                    key={m}
                    className={`market-badge ${getMarketClass(m)}`}
                  >
                    {getMarketLabel(m)}
                  </span>
                ))}
              </div>
              {execTime != null && (
                <span className="exec-time">⚡ {formatExecTime(execTime)}</span>
              )}
            </div>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="loading-section">
            <div className="loading-header">
              <div className="spinner" />
              <span className="loading-text">
                Scanning all marketplaces
                <span className="loading-dots">
                  <span>.</span><span>.</span><span>.</span>
                </span>
              </span>
            </div>
            <div className="skeleton-grid">
              {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        )}

        {/* Results Grid */}
        {!loading && hasResults && (
          <section className="results-section">
            <div className="results-grid">
              {displayedResults.map((product, idx) => (
                <ProductCard key={`${product.market}-${idx}`} product={product} index={idx} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!loading && hasSearched && results.length === 0 && !error && (
          <div className="state-container fade-in">
            <span className="state-icon">📦</span>
            <h2 className="state-title">No products found</h2>
            <p className="state-desc">
              Try a different search term, or the marketplaces may be temporarily unavailable.
            </p>
          </div>
        )}

        {/* Filtered empty state */}
        {!loading && hasResults && displayedResults.length === 0 && (
          <div className="state-container fade-in">
            <span className="state-icon">🔎</span>
            <h2 className="state-title">No results for this filter</h2>
            <p className="state-desc">
              Try selecting a different marketplace or removing filters.
            </p>
          </div>
        )}

        {/* Initial empty state */}
        {!loading && !hasSearched && (
          <div className="state-container fade-in">
            <span className="state-icon">✨</span>
            <h2 className="state-title">Search any product</h2>
            <p className="state-desc">
              Enter a product name above and we'll compare prices across{' '}
              <strong>OLX</strong>, <strong>Uzum</strong>,{' '}
              <strong>Wildberries</strong>, and <strong>Yandex Market</strong>{' '}
              simultaneously.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
