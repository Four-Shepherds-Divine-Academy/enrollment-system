import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Section {
  id: string;
  name: string;
  gradeLevel: string;
  isActive: boolean;
  _count: {
    students: number;
  };
}

interface SectionsFilters {
  searchQuery?: string;
  gradeLevel?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreateSectionData {
  name: string;
  gradeLevel: string;
  isActive?: boolean;
}

interface UpdateSectionData {
  name?: string;
  gradeLevel?: string;
  isActive?: boolean;
}

const SECTIONS_QUERY_KEY = 'sections';

// Fetch sections with filters
export function useSections(filters: SectionsFilters = {}) {
  return useQuery<Section[]>({
    queryKey: [SECTIONS_QUERY_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.searchQuery) params.append('search', filters.searchQuery);
      if (filters.gradeLevel && filters.gradeLevel !== 'all') {
        params.append('gradeLevel', filters.gradeLevel);
      }
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/sections?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sections');
      }
      return response.json();
    },
    staleTime: 0, // Always refetch on mount
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Create section mutation
export function useCreateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSectionData) => {
      const response = await fetch('/api/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create section');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all section queries
      queryClient.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      toast.success('Section created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Update section mutation
export function useUpdateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateSectionData;
    }) => {
      const response = await fetch(`/api/sections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update section');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate sections and students (section changes affect students)
      queryClient.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Section updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Delete section mutation
export function useDeleteSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/sections/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete section');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate sections and students (deleting section affects students)
      queryClient.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Section deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Toggle section active status
export function useToggleSectionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await fetch(`/api/sections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update section status');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate sections and students (section status affects students)
      queryClient.invalidateQueries({ queryKey: [SECTIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success(
        variables.isActive ? 'Section activated' : 'Section deactivated'
      );
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
