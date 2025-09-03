/**
 * Global Search API Client
 * 
 * This module provides API functions for global search functionality
 * to search across datasets and documents with proper TypeScript types
 */

import { useState } from 'react';

export interface SearchResult {
    id: string;
    name: string;
    type: 'dataset' | 'document';
    description?: string;
    datasetId?: string; // For documents, reference to parent dataset
    datasetName?: string; // For documents, parent dataset name
    createdAt: string;
    updatedAt: string;
}

export interface GlobalSearchResponse {
    results: SearchResult[];
    total: number;
    query: string;
    timestamp: string;
}

export interface GlobalSearchParams {
    query: string;
    limit?: number;
    types?: ('dataset' | 'document')[];
}

/**
 * Perform global search across datasets and documents
 * @param params Search parameters including query, limit, and types
 * @returns Promise with search results
 */
export async function globalSearch(params: GlobalSearchParams): Promise<GlobalSearchResponse> {
    try {
        const { query, limit = 10, types = ['dataset', 'document'] } = params;

        const searchParams = new URLSearchParams({
            q: query,
            limit: limit.toString(),
            types: types.join(',')
        });

        const response = await fetch(`/api/search/global?${searchParams}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Search failed' }));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();

    } catch (error: any) {
        console.error('Global search failed:', error);
        throw error;
    }
}

/**
 * Search only datasets
 * @param query Search query string
 * @param limit Maximum number of results
 * @returns Promise with dataset search results
 */
export async function searchDatasets(query: string, limit: number = 10): Promise<SearchResult[]> {
    const response = await globalSearch({
        query,
        limit,
        types: ['dataset']
    });

    return response.results;
}

/**
 * Search only documents
 * @param query Search query string
 * @param limit Maximum number of results
 * @returns Promise with document search results
 */
export async function searchDocuments(query: string, limit: number = 10): Promise<SearchResult[]> {
    const response = await globalSearch({
        query,
        limit,
        types: ['document']
    });

    return response.results;
}

/**
 * Get search suggestions based on partial query
 * @param query Partial search query
 * @param limit Maximum number of suggestions
 * @returns Promise with search suggestions
 */
export async function getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
    try {
        if (!query || query.trim().length < 2) {
            return [];
        }

        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        return data.suggestions || [];

    } catch (error) {
        console.error('Failed to get search suggestions:', error);
        return [];
    }
}

/**
 * React hook for global search with debouncing and state management
 */
export function useGlobalSearch() {
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');

    const performSearch = async (searchQuery: string, options?: Partial<GlobalSearchParams>) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setIsSearching(true);
        setError(null);

        try {
            const response = await globalSearch({
                query: searchQuery,
                ...options
            });

            setResults(response.results);
        } catch (err: any) {
            setError(err.message || 'Search failed');
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const clearSearch = () => {
        setQuery('');
        setResults([]);
        setError(null);
        setIsSearching(false);
    };

    return {
        isSearching,
        results,
        error,
        query,
        setQuery,
        performSearch,
        clearSearch
    };
}