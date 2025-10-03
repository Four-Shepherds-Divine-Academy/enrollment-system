import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AcademicYearsFilters {
  searchQuery: string;
  status: string; // 'all', 'active', 'inactive'
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface AcademicYearsStore {
  filters: AcademicYearsFilters;
  setSearchQuery: (query: string) => void;
  setStatus: (status: string) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
  toggleSort: (column: string) => void;
  resetFilters: () => void;
}

const defaultFilters: AcademicYearsFilters = {
  searchQuery: '',
  status: 'all',
  sortBy: 'startDate',
  sortOrder: 'desc',
};

export const useAcademicYearsStore = create<AcademicYearsStore>()(
  persist(
    (set) => ({
      filters: defaultFilters,

      setSearchQuery: (searchQuery) =>
        set((state) => ({
          filters: { ...state.filters, searchQuery },
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
      name: 'academic-years-filters',
      partialize: (state) => ({ filters: state.filters }),
    }
  )
);
