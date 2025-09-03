"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Search,
    FileText,
    FolderKanban,
    ArrowRight,
    Clock,
    Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { globalSearch, SearchResult } from '@/lib/api/search';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

// Simple debounce implementation
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): T & { cancel: () => void } {
    let timeout: NodeJS.Timeout | null = null;

    const debounced = ((...args: any[]) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    }) as T & { cancel: () => void };

    debounced.cancel = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    };

    return debounced;
}

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('global-search-recent');
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved));
            } catch (error) {
                console.error('Failed to parse recent searches:', error);
            }
        }
    }, []);

    // Save recent searches to localStorage
    const saveRecentSearch = useCallback((searchQuery: string) => {
        if (!searchQuery.trim()) return;

        const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('global-search-recent', JSON.stringify(updated));
    }, [recentSearches]);

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce(async (searchQuery: string) => {
            if (!searchQuery.trim()) {
                setResults([]);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            try {
                const response = await globalSearch({
                    query: searchQuery,
                    limit: 10
                });
                setResults(response.results);
                setSelectedIndex(-1);
            } catch (error) {
                console.error('Search failed:', error);
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300),
        []
    );

    // Handle search input change
    useEffect(() => {
        debouncedSearch(query);
        return () => {
            debouncedSearch.cancel();
        };
    }, [query, debouncedSearch]);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            // Small delay to ensure dialog is rendered
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev =>
                        prev < results.length - 1 ? prev + 1 : prev
                    );
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
                    break;

                case 'Enter':
                    e.preventDefault();
                    if (selectedIndex >= 0 && selectedIndex < results.length) {
                        handleResultSelect(results[selectedIndex]);
                    } else if (query.trim()) {
                        saveRecentSearch(query.trim());
                    }
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex, results, query]);

    // Handle result selection
    const handleResultSelect = (result: SearchResult) => {
        saveRecentSearch(query);
        onClose();

        if (result.type === 'dataset') {
            router.push(`/dataset/${result.id}`);
        } else if (result.type === 'document' && result.datasetId) {
            router.push(`/dataset/${result.datasetId}?document=${result.id}`);
        }
    };

    // Handle recent search selection
    const handleRecentSearchSelect = (recentQuery: string) => {
        setQuery(recentQuery);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    // Clear recent searches
    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem('global-search-recent');
    };

    // Reset state when dialog closes
    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setResults([]);
            setSelectedIndex(-1);
            setIsSearching(false);
        }
    }, [isOpen]);

    const showRecentSearches = !query.trim() && recentSearches.length > 0;
    const showNoResults = query.trim() && !isSearching && results.length === 0;

    // Handle dialog state change
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] p-0 gap-0 overflow-hidden">
                <DialogHeader className="sr-only">
                    <DialogTitle>Tìm kiếm toàn cục</DialogTitle>
                </DialogHeader>

                {/* Search Header */}
                <div className="flex items-center px-4 py-3 border-b border-gray-200">
                    <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Tìm kiếm datasets và documents..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 text-lg bg-transparent border-none outline-none placeholder-gray-400"
                        autoFocus
                    />
                    {isSearching && (
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
                    )}
                </div>

                {/* Search Results */}
                <div className="max-h-96 overflow-y-auto">
                    {/* Recent Searches */}
                    {showRecentSearches && (
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                                    <Clock className="w-4 h-4 mr-2" />
                                    Tìm kiếm gần đây
                                </h3>
                                <button
                                    onClick={clearRecentSearches}
                                    className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    Xóa tất cả
                                </button>
                            </div>
                            <div className="space-y-1">
                                {recentSearches.map((recentQuery, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleRecentSearchSelect(recentQuery)}
                                        className="w-full text-left px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        {recentQuery}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Search Results */}
                    {query.trim() && results.length > 0 && (
                        <div className="p-2">
                            {results.map((result, index) => (
                                <button
                                    key={`${result.type}-${result.id}`}
                                    onClick={() => handleResultSelect(result)}
                                    className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${selectedIndex === index
                                        ? 'bg-blue-50 border-l-2 border-blue-500'
                                        : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center mr-3">
                                        {result.type === 'dataset' ? (
                                            <FolderKanban className="w-5 h-5 text-blue-500" />
                                        ) : (
                                            <FileText className="w-5 h-5 text-green-500" />
                                        )}
                                    </div>

                                    <div className="flex-1 text-left min-w-0">
                                        <div className="font-medium text-gray-900 truncate">
                                            {result.name}
                                        </div>
                                        {result.type === 'document' && result.datasetName && (
                                            <div className="text-sm text-gray-500 truncate">
                                                trong {result.datasetName}
                                            </div>
                                        )}
                                        {result.description && (
                                            <div className="text-sm text-gray-600 mt-1 line-clamp-1">
                                                {result.description}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center text-gray-400 flex-shrink-0">
                                        <span className="text-xs mr-2">
                                            {result.type === 'dataset' ? 'Dataset' : 'Document'}
                                        </span>
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* No Results */}
                    {showNoResults && (
                        <div className="p-8 text-center">
                            <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 mb-2">Không tìm thấy kết quả nào</p>
                            <p className="text-sm text-gray-400">
                                Thử tìm kiếm với từ khóa khác
                            </p>
                        </div>
                    )}

                    {/* Empty State */}
                    {!query.trim() && recentSearches.length === 0 && (
                        <div className="p-8 text-center">
                            <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 mb-2">Tìm kiếm datasets và documents</p>
                            <p className="text-sm text-gray-400">
                                Nhập tên dataset hoặc document để bắt đầu tìm kiếm
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                    <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                            <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">↑↓</kbd>
                            <span className="ml-1">để di chuyển</span>
                        </span>
                        <span className="flex items-center">
                            <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">↵</kbd>
                            <span className="ml-1">để chọn</span>
                        </span>
                        <span className="flex items-center">
                            <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">esc</kbd>
                            <span className="ml-1">để đóng</span>
                        </span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}