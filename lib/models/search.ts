/**
 * Search Database Models
 * 
 * This module provides database functions for searching datasets and documents
 * using Prisma ORM with optimized queries and proper filtering
 */

import prisma from '@/lib/prisma';

export interface SearchOptions {
    query: string;
    limit?: number;
    offset?: number;
    types?: ('dataset' | 'document')[];
    userId?: string; // For permission filtering
}

export interface DatabaseSearchResult {
    id: string;
    name: string;
    type: 'dataset' | 'document';
    description?: string;
    datasetId?: string;
    datasetName?: string;
    createdAt: Date;
    updatedAt: Date;
    relevanceScore?: number;
}

/**
 * Search datasets in the database
 * @param query Search query string
 * @param limit Maximum number of results
 * @param offset Pagination offset
 * @param userId User ID for permission filtering
 * @returns Promise with dataset search results
 */
export async function searchDatasetsInDB(
    query: string,
    limit: number = 10,
    offset: number = 0,
    userId?: string
): Promise<DatabaseSearchResult[]> {
    try {
        const whereClause: any = {
            OR: [
                { name: { contains: query } }
            ]
        };

        // Add user permission filtering if userId is provided
        if (userId) {
            whereClause.AND = [
                {
                    accesses: {
                        some: {
                            userId: userId,
                            canView: true
                        }
                    }
                }
            ];
        }

        const datasets = await prisma.dataset.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: [
                { updatedAt: 'desc' },
                { createdAt: 'desc' }
            ],
            take: limit,
            skip: offset
        });

        return datasets.map((dataset: any) => ({
            id: dataset.id,
            name: dataset.name,
            type: 'dataset' as const,
            createdAt: dataset.createdAt,
            updatedAt: dataset.updatedAt
        }));

    } catch (error) {
        console.error('Error searching datasets:', error);
        throw new Error('Failed to search datasets');
    }
}

/**
 * Search documents in the database
 * @param query Search query string
 * @param limit Maximum number of results
 * @param offset Pagination offset
 * @param userId User ID for permission filtering
 * @returns Promise with document search results
 */
export async function searchDocumentsInDB(
    query: string,
    limit: number = 10,
    offset: number = 0,
    userId?: string
): Promise<DatabaseSearchResult[]> {
    try {
        const whereClause: any = {
            OR: [
                { name: { contains: query } }
            ]
        };

        // Add user permission filtering through dataset if userId is provided
        if (userId) {
            whereClause.AND = [
                {
                    accesses: {
                        some: {
                            userId: userId,
                            canView: true
                        }
                    }
                }
            ];
        }

        const documents = await prisma.document.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                datasetId: true,
                createdAt: true,
                updatedAt: true,
                dataset: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: [
                { updatedAt: 'desc' },
                { createdAt: 'desc' }
            ],
            take: limit,
            skip: offset
        });

        return documents.map((document: any) => ({
            id: document.id,
            name: document.name,
            type: 'document' as const,
            datasetId: document.datasetId,
            datasetName: document.dataset?.name,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt
        }));

    } catch (error) {
        console.error('Error searching documents:', error);
        throw new Error('Failed to search documents');
    }
}

/**
 * Perform global search across both datasets and documents
 * @param options Search options including query, limit, types, etc.
 * @returns Promise with combined search results
 */
export async function globalSearchInDB(options: SearchOptions): Promise<{
    results: DatabaseSearchResult[];
    total: number;
}> {
    try {
        const { query, limit = 10, offset = 0, types = ['dataset', 'document'], userId } = options;

        if (!query.trim()) {
            return { results: [], total: 0 };
        }

        const promises: Promise<DatabaseSearchResult[]>[] = [];
        let totalPromises: Promise<number>[] = [];

        // Search datasets if included in types
        if (types.includes('dataset')) {
            promises.push(searchDatasetsInDB(query, Math.ceil(limit / types.length), offset, userId));
            totalPromises.push(countDatasetsInDB(query, userId));
        }

        // Search documents if included in types
        if (types.includes('document')) {
            promises.push(searchDocumentsInDB(query, Math.ceil(limit / types.length), offset, userId));
            totalPromises.push(countDocumentsInDB(query, userId));
        }

        const [resultsArrays, totalCounts] = await Promise.all([
            Promise.all(promises),
            Promise.all(totalPromises)
        ]);

        // Combine and sort results
        const allResults = resultsArrays.flat();
        const sortedResults = allResults
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, limit);

        const total = totalCounts.reduce((sum, count) => sum + count, 0);

        return {
            results: sortedResults,
            total
        };

    } catch (error) {
        console.error('Error in global search:', error);
        throw new Error('Failed to perform global search');
    }
}

/**
 * Count datasets matching search query
 * @param query Search query string
 * @param userId User ID for permission filtering
 * @returns Promise with dataset count
 */
export async function countDatasetsInDB(query: string, userId?: string): Promise<number> {
    try {
        const whereClause: any = {
            OR: [
                { name: { contains: query } }
            ]
        };

        if (userId) {
            whereClause.AND = [
                {
                    accesses: {
                        some: {
                            userId: userId,
                            canView: true
                        }
                    }
                }
            ];
        }

        return await prisma.dataset.count({ where: whereClause });
    } catch (error) {
        console.error('Error counting datasets:', error);
        return 0;
    }
}

/**
 * Count documents matching search query
 * @param query Search query string
 * @param userId User ID for permission filtering
 * @returns Promise with document count
 */
export async function countDocumentsInDB(query: string, userId?: string): Promise<number> {
    try {
        const whereClause: any = {
            OR: [
                { name: { contains: query } }
            ]
        };

        if (userId) {
            whereClause.AND = [
                {
                    accesses: {
                        some: {
                            userId: userId,
                            canView: true
                        }
                    }
                }
            ];
        }

        return await prisma.document.count({ where: whereClause });
    } catch (error) {
        console.error('Error counting documents:', error);
        return 0;
    }
}

/**
 * Get search suggestions based on existing dataset and document names
 * @param query Partial search query
 * @param limit Maximum number of suggestions
 * @param userId User ID for permission filtering
 * @returns Promise with search suggestions
 */
export async function getSearchSuggestionsFromDB(
    query: string,
    limit: number = 5,
    userId?: string
): Promise<string[]> {
    try {
        if (!query.trim() || query.length < 2) {
            return [];
        }

        const suggestions = new Set<string>();

        // Get dataset name suggestions
        const datasetSuggestions = await prisma.dataset.findMany({
            where: {
                name: { contains: query },
                ...(userId && {
                    accesses: {
                        some: {
                            userId: userId,
                            canView: true
                        }
                    }
                })
            },
            select: { name: true },
            take: limit
        });

        datasetSuggestions.forEach((dataset: any) => suggestions.add(dataset.name));

        // Get document name suggestions if we need more
        if (suggestions.size < limit) {
            const documentSuggestions = await prisma.document.findMany({
                where: {
                    name: { contains: query },
                    ...(userId && {
                        accesses: {
                            some: {
                                userId: userId,
                                canView: true
                            }
                        }
                    })
                },
                select: { name: true },
                take: limit - suggestions.size
            });

            documentSuggestions.forEach((document: any) => suggestions.add(document.name));
        }

        return Array.from(suggestions).slice(0, limit);

    } catch (error) {
        console.error('Error getting search suggestions:', error);
        return [];
    }
}

/**
 * Cleanup function to close Prisma connection
 */
export async function closeDatabaseConnection(): Promise<void> {
    await prisma.$disconnect();
}