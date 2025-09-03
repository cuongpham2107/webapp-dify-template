"use client"

import React from 'react';
import { Search } from 'lucide-react';

interface SearchButtonProps {
    variant?: 'default' | 'compact' | 'icon-only';
    className?: string;
    showKeyboardShortcut?: boolean;
    onSearchOpen?: () => void;
}

/**
 * Search Button Component
 * 
 * A reusable button component that triggers the global search modal
 * Supports different variants and styling options
 */
export function SearchButton({
    variant = 'default',
    className = '',
    showKeyboardShortcut = true,
    onSearchOpen
}: SearchButtonProps) {
    const handleClick = () => {
        onSearchOpen?.();
    };

    // Base button classes
    const baseClasses = "inline-flex items-center justify-center transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";

    if (variant === 'icon-only') {
        return (
            <button
                onClick={handleClick}
                className={`${baseClasses} p-2 rounded-lg bg-white/10 text-white/90 hover:bg-white/20 hover:text-white active:bg-white/25 active:scale-95 ${className}`}
                title="Tìm kiếm (Ctrl+K)"
            >
                <Search className="w-5 h-5" />
            </button>
        );
    }

    if (variant === 'compact') {
        return (
            <button
                onClick={handleClick}
                className={`${baseClasses} px-3 py-2 rounded-lg bg-white/10 text-white/90 hover:bg-white/20 hover:text-white active:bg-white/25 active:scale-95 text-sm ${className}`}
            >
                <Search className="w-4 h-4 mr-2" />
                <span className="text-xs">Tìm kiếm</span>
                {showKeyboardShortcut && (
                    <kbd className="ml-2 px-1 py-0.5 bg-white/20 text-xs rounded border border-white/30">
                        ⌘K
                    </kbd>
                )}
            </button>
        );
    }

    // Default variant
    return (
        <button
            onClick={handleClick}
            className={`${baseClasses} w-full px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white/90 hover:bg-white/20 hover:text-white hover:border-white/30 active:bg-white/25 active:scale-95 text-left ${className}`}
        >
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                    <Search className="w-4 h-4 mr-3 text-sky-100" />
                    <span className="text-white/70 text-sm">Tìm kiếm ...</span>
                </div>
                {showKeyboardShortcut && (
                    <div className="flex items-center space-x-1">
                        <kbd className="px-1 bg-white/20 text-xs font-semibold rounded border border-white/30 text-sky-100">
                            Ctrl
                        </kbd>
                        <span className="text-white/60 text-xs font-semibold">+</span>
                        <kbd className="px-1 bg-white/20 text-xs font-semibold rounded border border-white/30 text-sky-100">
                            K
                        </kbd>
                    </div>
                )}
            </div>
        </button>
    );
}

/**
 * Alternative Search Button for different contexts
 * (e.g., inside forms, headers, etc.)
 */
export function HeaderSearchButton({ className = '', onSearchOpen }: { className?: string; onSearchOpen?: () => void }) {
    return (
        <button
            onClick={onSearchOpen}
            className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${className}`}
        >
            <Search className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline text-sm">Tìm kiếm...</span>
            <kbd className="hidden sm:inline ml-2 px-1 py-0.5 bg-gray-100 text-xs rounded border">
                ⌘K
            </kbd>
        </button>
    );
}

/**
 * Floating Search Button for mobile or sticky positions
 */
export function FloatingSearchButton({ className = '', onSearchOpen }: { className?: string; onSearchOpen?: () => void }) {
    return (
        <button
            onClick={onSearchOpen}
            className={`fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 z-[9998] ${className}`}
            title="Tìm kiếm (Ctrl+K)"
        >
            <Search className="w-6 h-6" />
        </button>
    );
}