import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotificationsFilters {
  type: string; // 'all', 'ENROLLMENT', 'SYSTEM', 'ALERT'
  read: string; // 'all', 'read', 'unread'
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface NotificationsStore {
  filters: NotificationsFilters;
  setType: (type: string) => void;
  setRead: (read: string) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
  toggleSort: (column: string) => void;
  resetFilters: () => void;
}

const defaultFilters: NotificationsFilters = {
  type: 'all',
  read: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export const useNotificationsStore = create<NotificationsStore>()(
  persist(
    (set) => ({
      filters: defaultFilters,

      setType: (type) =>
        set((state) => ({
          filters: { ...state.filters, type },
        })),

      setRead: (read) =>
        set((state) => ({
          filters: { ...state.filters, read },
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
      name: 'notifications-filters',
      partialize: (state) => ({ filters: state.filters }),
    }
  )
);
