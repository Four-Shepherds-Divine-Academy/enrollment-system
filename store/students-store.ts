import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StudentsFilters {
  searchQuery: string;
  gradeLevel: string;
  status: string;
  academicYear: string;
  remark: string;
  paymentStatus: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface StudentsStore {
  filters: StudentsFilters;
  setSearchQuery: (query: string) => void;
  setGradeLevel: (gradeLevel: string) => void;
  setStatus: (status: string) => void;
  setAcademicYear: (academicYear: string) => void;
  setRemark: (remark: string) => void;
  setPaymentStatus: (paymentStatus: string) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
  toggleSort: (column: string) => void;
  resetFilters: () => void;
}

const defaultFilters: StudentsFilters = {
  searchQuery: '',
  gradeLevel: 'All Grades',
  status: 'All Status',
  academicYear: '',
  remark: 'All Remarks',
  paymentStatus: 'All Payment Status',
  sortBy: 'fullName',
  sortOrder: 'asc',
};

export const useStudentsStore = create<StudentsStore>()(
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

      setAcademicYear: (academicYear) =>
        set((state) => ({
          filters: { ...state.filters, academicYear },
        })),

      setRemark: (remark) =>
        set((state) => ({
          filters: { ...state.filters, remark },
        })),

      setPaymentStatus: (paymentStatus) =>
        set((state) => ({
          filters: { ...state.filters, paymentStatus },
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
      name: 'students-filters',
      partialize: (state) => ({ filters: state.filters }),
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Add remark field to old state
          return {
            filters: {
              ...persistedState.filters,
              remark: 'All Remarks',
              paymentStatus: 'All Payment Status',
            },
          };
        }
        if (version === 1) {
          // Add paymentStatus field to state
          return {
            filters: {
              ...persistedState.filters,
              paymentStatus: 'All Payment Status',
            },
          };
        }
        return persistedState;
      },
    }
  )
);
