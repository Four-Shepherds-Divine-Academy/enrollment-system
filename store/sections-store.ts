import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SectionsFilters {
  searchQuery: string;
  gradeLevel: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SectionsStore {
  filters: SectionsFilters;
  setSearchQuery: (query: string) => void;
  setGradeLevel: (gradeLevel: string) => void;
  setStatus: (status: string) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
  toggleSort: (column: string) => void;
  resetFilters: () => void;
}

const defaultFilters: SectionsFilters = {
  searchQuery: '',
  gradeLevel: 'all',
  status: 'all',
  sortBy: 'gradeLevel',
  sortOrder: 'asc',
};

export const useSectionsStore = create<SectionsStore>()(
  persist(
    (set) => ({
      filters: defaultFilters,

      setSearchQuery: (searchQuery) =>
        set((state) => ({
          filters: { ...state.filters, searchQuery },
        })),

      setGradeLevel: (gradeLevel) =>
        set((state) => ({
          filters: { ...state.filters, gradeLevel },
        })),

      setStatus: (status) =>
        set((state) => ({
          filters: { ...state.filters, status },
        })),

      setSortBy: (sortBy) =>
        set((state) => ({
          filters: { ...state.filters, sortBy },
        })),

      setSortOrder: (sortOrder) =>
        set((state) => ({
          filters: { ...state.filters, sortOrder },
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

      resetFilters: () =>
        set({
          filters: defaultFilters,
        }),
    }),
    {
      name: 'sections-filters',
      partialize: (state) => ({ filters: state.filters }),
    }
  )
);
