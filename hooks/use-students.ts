import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Student {
  id: string;
  lrn: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  fullName: string;
  gender: string;
  contactNumber: string;
  dateOfBirth: Date;
  gradeLevel: string;
  section: string | null;
  enrollmentStatus: string;
  isTransferee: boolean;
  [key: string]: any;
}

interface StudentsFilters {
  searchQuery?: string;
  gradeLevel?: string;
  status?: string;
  academicYear?: string;
  remark?: string;
  paymentStatus?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreateStudentData {
  [key: string]: any;
}

interface UpdateStudentData {
  [key: string]: any;
}

const STUDENTS_QUERY_KEY = 'students';

// Fetch students with filters
export function useStudents(filters: StudentsFilters = {}) {
  return useQuery<Student[]>({
    queryKey: [STUDENTS_QUERY_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.searchQuery) params.append('search', filters.searchQuery);
      if (filters.gradeLevel && filters.gradeLevel !== 'All Grades') {
        params.append('gradeLevel', filters.gradeLevel);
      }
      if (filters.status && filters.status !== 'All Status') {
        params.append('status', filters.status);
      }
      if (filters.remark && filters.remark !== 'All Remarks') {
        params.append('remark', filters.remark);
      }
      if (filters.paymentStatus && filters.paymentStatus !== 'All Payment Status') {
        params.append('paymentStatus', filters.paymentStatus);
      }
      if (filters.academicYear) params.append('academicYear', filters.academicYear);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/students?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      return response.json();
    },
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: 'always', // Always refetch on mount
  });
}

// Get single student
export function useStudent(id: string) {
  return useQuery<Student>({
    queryKey: [STUDENTS_QUERY_KEY, id],
    queryFn: async () => {
      const response = await fetch(`/api/students/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch student');
      }
      return response.json();
    },
    enabled: !!id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

// Search students (for enrollment form)
export function useStudentSearch(query: string) {
  return useQuery<Student[]>({
    queryKey: [STUDENTS_QUERY_KEY, 'search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const response = await fetch(`/api/students/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to search students');
      }
      return response.json();
    },
    enabled: query.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Create student mutation
export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStudentData) => {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create student');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all student queries and related data
      queryClient.invalidateQueries({ queryKey: [STUDENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      queryClient.invalidateQueries({ queryKey: ['academicYears'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Student enrolled successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Update student mutation
export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateStudentData;
    }) => {
      const response = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update student');
      }

      return response.json();
    },
    onSuccess: (updatedStudent, variables) => {
      // Update the specific student query immediately
      queryClient.setQueryData([STUDENTS_QUERY_KEY, variables.id], updatedStudent);

      // Invalidate all student list queries to refetch
      queryClient.invalidateQueries({
        queryKey: [STUDENTS_QUERY_KEY],
        refetchType: 'active',
      });

      // Invalidate related data
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      queryClient.invalidateQueries({ queryKey: ['academicYears'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      toast.success('Student updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Delete student mutation
export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete student');
      }

      return response.json();
    },
    onSuccess: (_, deletedId) => {
      // Remove from cache immediately
      queryClient.removeQueries({ queryKey: [STUDENTS_QUERY_KEY, deletedId] });

      // Invalidate all student list queries
      queryClient.invalidateQueries({
        queryKey: [STUDENTS_QUERY_KEY],
        refetchType: 'active',
      });

      // Invalidate related data
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      queryClient.invalidateQueries({ queryKey: ['academicYears'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      toast.success('Student deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Switch student to different academic year
export function useSwitchStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      targetYearId,
      gradeLevel,
      section,
    }: {
      id: string;
      targetYearId: string;
      gradeLevel: string;
      section?: string;
    }) => {
      const response = await fetch(`/api/students/${id}/switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetYearId, gradeLevel, section }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to switch student');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate specific student
      queryClient.invalidateQueries({ queryKey: [STUDENTS_QUERY_KEY, variables.id] });

      // Invalidate all student list queries
      queryClient.invalidateQueries({
        queryKey: [STUDENTS_QUERY_KEY],
        refetchType: 'active',
      });

      // Invalidate related data
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      queryClient.invalidateQueries({ queryKey: ['academicYears'] });

      toast.success('Student switched successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
