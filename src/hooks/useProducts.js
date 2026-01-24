import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Hook to fetch all products with caching
 */
export const useProducts = (page = 1, perPage = 20, category = null, sortBy = null, skin = null) => {
    return useQuery({
        queryKey: ['products_v2', page, perPage, category, sortBy, skin],
        queryFn: () => api.getProducts(page, perPage, category, { sortBy, skin }),
        keepPreviousData: true,
    });
};

/**
 * Hook for infinite scrolling products
 */
export const useInfiniteProducts = (perPage = 20, category = null, sortBy = null, skin = null) => {
    return useInfiniteQuery({
        queryKey: ['infiniteProducts_v2', category, sortBy, skin],
        queryFn: ({ pageParam = 1 }) => api.getProducts(pageParam, perPage, category, { sortBy, skin }),
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === perPage ? allPages.length + 1 : undefined;
        },
    });
};

/**
 * Hook to fetch a single product
 */
export const useProduct = (id) => {
    return useQuery({
        queryKey: ['product_v2', id],
        queryFn: () => api.getProduct(id),
        enabled: !!id,
    });
};

/**
 * Hook to search products
 */
export const useSearchProducts = (query) => {
    return useQuery({
        queryKey: ['search_v2', query],
        queryFn: () => api.searchProducts(query),
        enabled: !!query && query.length > 2,
        staleTime: 60 * 1000, // Cache searches for 1 minute
    });
};

/**
 * Hook to fetch categories
 */
export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: () => api.getCategories(),
        staleTime: 1000 * 60 * 60, // 1 hour
    });
};
