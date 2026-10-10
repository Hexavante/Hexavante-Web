"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  enrollWebCourseAction,
  getWebCourseAction,
  listWebCoursesAction,
  type WebCourseDetail,
  type WebCourseQuery,
  type WebCourseSummary,
  type WebPaginatedResponse,
} from "@/app/actions/web-course";

// Types
export type Course = WebCourseSummary;
export type CourseDetail = WebCourseDetail;
export type PaginatedResponse<T> = WebPaginatedResponse<T>;
export type CourseQueryParams = WebCourseQuery;

// Query Keys
export const courseKeys = {
  all: ["courses"] as const,
  lists: () => [...courseKeys.all, "list"] as const,
  list: (params: CourseQueryParams) => [...courseKeys.lists(), params] as const,
  details: () => [...courseKeys.all, "detail"] as const,
  detail: (id: string) => [...courseKeys.details(), id] as const,
};

// Hooks
export function useCourses(params: CourseQueryParams = {}) {
  return useQuery({
    queryKey: courseKeys.list(params),
    queryFn: () => listWebCoursesAction(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCourse(slug: string) {
  return useQuery({
    queryKey: courseKeys.detail(slug),
    queryFn: async (): Promise<CourseDetail> => {
      const course = await getWebCourseAction(slug);
      if (!course) throw new Error("Curso não encontrado");
      return course;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useEnrollCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const result = await enrollWebCourseAction(courseId);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      // Invalidate and refetch course details
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
    },
  });
}
