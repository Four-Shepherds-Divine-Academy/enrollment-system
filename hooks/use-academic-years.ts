import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface AcademicYear {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  _count?: {
    enrollments: number;
  };
}

interface AcademicYearsFilters {
  searchQuery?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreateAcademicYearData {
  name: string;
  startDate: Date | string;
  endDate?: Date | string | null;
  isActive?: boolean;
}

interface UpdateAcademicYearData {
  name?: string;
  startDate?: Date | string;
  endDate?: Date | string | null;
  isActive?: boolean;
}

const ACADEMIC_YEARS_QUERY_KEY = 'academicYears';

// Fetch academic years with filters
export function useAcademicYears(filters: AcademicYearsFilters = {}) {
  return useQuery<AcademicYear[]>({
    queryKey: [ACADEMIC_YEARS_QUERY_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.searchQuery) params.append('search', filters.searchQuery);
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/academic-years?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch academic years');
      }
      return response.json();
    },
    staleTime: 0, // Always refetch on mount
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get active academic year
export function useActiveAcademicYear() {
  return useQuery<AcademicYear | null>({
    queryKey: [ACADEMIC_YEARS_QUERY_KEY, 'active'],
    queryFn: async () => {
      const response = await fetch('/api/academic-years/active');
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch active academic year');
      }
      return response.json();
    },
    staleTime: 0, // Always refetch on mount
    gcTime: 5 * 60 * 1000,
  });
}

// Get single academic year
export function useAcademicYear(id: string) {
  return useQuery<AcademicYear>({
    queryKey: [ACADEMIC_YEARS_QUERY_KEY, id],
    queryFn: async () => {
      const response = await fetch(`/api/academic-years/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch academic year');
      }
      return response.json();
    },
    enabled: !!id,
    staleTime: 0, // Always refetch on mount
    gcTime: 5 * 60 * 1000,
  });
}

// Create academic year mutation
export function useCreateAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAcademicYearData) => {
      const response = await fetch('/api/academic-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create academic year');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all academic year queries
      queryClient.invalidateQueries({ queryKey: [ACADEMIC_YEARS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [ACADEMIC_YEARS_QUERY_KEY, 'active'] });
      toast.success('Academic year created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Update academic year mutation
export function useUpdateAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateAcademicYearData;
    }) => {
      const response = await fetch(`/api/academic-years/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update academic year');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate all related queries (updating academic year affects students)
      queryClient.invalidateQueries({ queryKey: [ACADEMIC_YEARS_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [ACADEMIC_YEARS_QUERY_KEY, variables.id],
      });
      queryClient.invalidateQueries({ queryKey: [ACADEMIC_YEARS_QUERY_KEY, 'active'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Academic year updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Delete academic year mutation
export function useDeleteAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/academic-years/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete academic year');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all related queries (deleting academic year affects students)
      queryClient.invalidateQueries({ queryKey: [ACADEMIC_YEARS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [ACADEMIC_YEARS_QUERY_KEY, 'active'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Academic year deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Activate academic year
export function useActivateAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/academic-years/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to activate academic year');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all related queries (activating year affects everything)
      queryClient.invalidateQueries({ queryKey: [ACADEMIC_YEARS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [ACADEMIC_YEARS_QUERY_KEY, 'active'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Academic year activated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Import students from previous year
export function useImportStudents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      targetYearId,
      sourceYearId,
    }: {
      targetYearId: string;
      sourceYearId: string;
    }) => {
      const response = await fetch(
        `/api/academic-years/${targetYearId}/import-students`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceYearId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import students');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACADEMIC_YEARS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Students imported successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
