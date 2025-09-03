"use client"

import { useState, useEffect, useCallback } from 'react';

/**
 * Global Search Hook
 * 
 * Manages global search state and keyboard shortcuts (Ctrl+K / Cmd+K)
 * Provides functionality to open/close search modal with proper cleanup
 */

export interface UseGlobalSearchReturn {
    isSearchOpen: boolean;
    openSearch: () => void;
    closeSearch: () => void;
    toggleSearch: () => void;
}

export function useGlobalSearch(): UseGlobalSearchReturn {
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Open search modal
    const openSearch = useCallback(() => {
        setIsSearchOpen(true);
    }, []);

    // Close search modal
    const closeSearch = useCallback(() => {
        setIsSearchOpen(false);
    }, []);

    // Toggle search modal
    const toggleSearch = useCallback(() => {
        setIsSearchOpen(prev => !prev);
    }, []);

    // Handle global keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Check for Ctrl+K (Windows/Linux) or Cmd+K (Mac)
            if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
                event.preventDefault();
                event.stopPropagation();
                toggleSearch();
            }
        };

        // Add event listener to document
        document.addEventListener('keydown', handleKeyDown, true);

        // Cleanup function
        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [toggleSearch]);

    // Prevent body scroll when search is open
    useEffect(() => {
        if (isSearchOpen) {
            // Save current scroll position
            const scrollY = window.scrollY;

            // Prevent body scroll
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';

            // Cleanup function
            return () => {
                // Restore body scroll
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';

                // Restore scroll position
                window.scrollTo(0, scrollY);
            };
        }
    }, [isSearchOpen]);

    // Close search on route change (for Next.js navigation)
    useEffect(() => {
        const handleRouteChange = () => {
            if (isSearchOpen) {
                closeSearch();
            }
        };

        // Listen for navigation events
        window.addEventListener('beforeunload', handleRouteChange);
        window.addEventListener('popstate', handleRouteChange);

        return () => {
            window.removeEventListener('beforeunload', handleRouteChange);
            window.removeEventListener('popstate', handleRouteChange);
        };
    }, [isSearchOpen, closeSearch]);

    // Close search when clicking on internal links
    useEffect(() => {
        if (!isSearchOpen) return;

        const handleLinkClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            const link = target.closest('a');

            if (link && link.href && link.href.startsWith(window.location.origin)) {
                // This is an internal link, close search
                closeSearch();
            }
        };

        document.addEventListener('click', handleLinkClick);

        return () => {
            document.removeEventListener('click', handleLinkClick);
        };
    }, [isSearchOpen, closeSearch]);

    return {
        isSearchOpen,
        openSearch,
        closeSearch,
        toggleSearch
    };
}