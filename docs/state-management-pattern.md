# State Management Pattern

This document outlines the pattern for implementing state management using Zustand and React Query for all API calls in the application.

## Architecture Overview

- **Zustand** - For persisting filter/sort state and UI preferences
- **React Query** - For data fetching, caching, and mutations
- **Server-side** - All filtering, sorting, and searching happens on the server

## Implementation Steps

### 1. Create Zustand Store (`/store/[feature]-store.ts`)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FiltersState {
  searchQuery: string;
  // Add other filters
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface FeatureStore {
  filters: FiltersState;
  setSearchQuery: (query: string) => void;
  // Add other setters
  toggleSort: (column: string) => void;
  resetFilters: () => void;
}

export const useFeatureStore = create<FeatureStore>()(
  persist(
    (set) => ({
      filters: {
        searchQuery: '',
        sortBy: 'id',
        sortOrder: 'asc',
      },

      setSearchQuery: (searchQuery) =>
        set((state) => ({
          filters: { ...state.filters, searchQuery },
        })),

      toggleSort: (column) =>
        set((state) => {
          if (state.filters.sortBy === column) {
            return {
              filters: {
                ...state.filters,
                sortOrder: state.filters.sortOrder === 'asc' ? 'desc' : 'asc',
              },
            };
          }
          return {
            filters: {
              ...state.filters,
              sortBy: column,
              sortOrder: 'asc',
            },
          };
        }),

      resetFilters: () => set({ filters: defaultFilters }),
    }),
    {
      name: 'feature-filters',
      partialize: (state) => ({ filters: state.filters }),
    }
  )
);
```

### 2. Create React Query Hooks (`/hooks/use-[feature].ts`)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const FEATURE_QUERY_KEY = 'feature';

// Fetch with filters
export function useFeatureData(filters: FiltersState = {}) {
  return useQuery<FeatureType[]>({
    queryKey: [FEATURE_QUERY_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.searchQuery) params.append('search', filters.searchQuery);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/feature?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Create mutation
export function useCreateFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateData) => {
      const response = await fetch('/api/feature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FEATURE_QUERY_KEY] });
      toast.success('Created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Update mutation
export function useUpdateFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateData }) => {
      const response = await fetch(`/api/feature/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FEATURE_QUERY_KEY] });
      toast.success('Updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Delete mutation
export function useDeleteFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/feature/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FEATURE_QUERY_KEY] });
      toast.success('Deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
```

### 3. Update API Route to Support Server-Side Operations

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const sortBy = searchParams.get('sortBy') || 'id';
  const sortOrder = searchParams.get('sortOrder') || 'asc';

  const where: any = {};

  // Search filter
  if (search && search.trim() !== '') {
    where.OR = [
      { field1: { contains: search, mode: 'insensitive' } },
      { field2: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Build orderBy
  const orderBy: any = {};
  orderBy[sortBy] = sortOrder;

  const data = await prisma.model.findMany({
    where,
    orderBy,
  });

  return NextResponse.json(data);
}
```

### 4. Update Component to Use Zustand + React Query

```typescript
'use client';

import { useFeatureStore } from '@/store/feature-store';
import {
  useFeatureData,
  useCreateFeature,
  useUpdateFeature,
  useDeleteFeature,
} from '@/hooks/use-feature';

export default function FeaturePage() {
  const { filters, setSearchQuery, toggleSort } = useFeatureStore();

  const { data = [], isLoading } = useFeatureData(filters);
  const createMutation = useCreateFeature();
  const updateMutation = useUpdateFeature();
  const deleteMutation = useDeleteFeature();

  return (
    <div>
      <Input
        value={filters.searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Sortable headers */}
      <button onClick={() => toggleSort('fieldName')}>
        Field Name {getSortIcon('fieldName')}
      </button>

      {/* Use mutations */}
      <button onClick={() => createMutation.mutate(data)}>
        Create
      </button>
    </div>
  );
}
```

## Benefits

1. **Persistent Filters** - User preferences saved in localStorage
2. **Smart Caching** - Data cached for 5 minutes, reducing API calls
3. **Optimistic Updates** - Instant UI feedback
4. **Automatic Refetching** - Data stays fresh after mutations
5. **Server-side Operations** - Efficient filtering/sorting for large datasets
6. **Loading States** - Built-in loading/error states

## Apply to All Features

This pattern should be applied to:
- ✅ Sections (implemented)
- ⬜ Students
- ⬜ Enrollments
- ⬜ Academic Years
- ⬜ Reports
- ⬜ Notifications
