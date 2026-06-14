import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Hook to fetch all products with caching
 * Products come directly from kataraa.com via WooCommerce API
 */
export const useProducts = (page = 1, perPage = 20, category = null, sortBy = null, skin = null) => {
    return useQuery({
        queryKey: ['products_wc', page, perPage, category, sortBy, skin],
        queryFn: () => api.getProducts(page, perPage, category, { sortBy, skin }),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

/**
 * Hook for infinite scrolling products
 * Products come directly from kataraa.com via WooCommerce API
 */
export const useInfiniteProducts = (perPage = 20, category = null, sortBy = null, skin = null) => {
    return useInfiniteQuery({
        queryKey: ['infiniteProducts_wc', category, sortBy, skin],
        queryFn: ({ pageParam = 1 }) => api.getProducts(pageParam, perPage, category, { sortBy, skin }),
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === perPage ? allPages.length + 1 : undefined;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

/**
 * Hook to fetch a single product from kataraa.com
 */
export const useProduct = (id) => {
    return useQuery({
        queryKey: ['product_wc', id],
        queryFn: () => api.getProduct(id),
        enabled: !!id,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

/**
 * Hook to search products on kataraa.com
 */
export const useSearchProducts = (query) => {
    return useQuery({
        queryKey: ['search_wc', query],
        queryFn: () => api.searchProducts(query),
        enabled: !!query && query.length > 2,
        staleTime: 60 * 1000, // Cache searches for 1 minute
    });
};

/**
 * Hook to fetch categories from kataraa.com
 */
export const useCategories = () => {
    return useQuery({
        queryKey: ['categories_wc'],
        queryFn: () => api.getCategories(),
        staleTime: 1000 * 60 * 30, // 30 minutes (categories don't change often)
    });
};
