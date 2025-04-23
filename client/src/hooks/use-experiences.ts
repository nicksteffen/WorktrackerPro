import { useQuery, useMutation } from "@tanstack/react-query";
import { Experience, ExperienceFormData, Tag } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useExperiences() {
  const { toast } = useToast();

  const { data: experiences = [], isLoading, isError } = useQuery<Experience[]>({
    queryKey: ['/api/experiences'],
  });

  const createExperienceMutation = useMutation({
    mutationFn: async (experienceData: ExperienceFormData) => {
      const res = await apiRequest('POST', '/api/experiences', experienceData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Experience created",
        description: "The experience has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/experiences'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create experience",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateExperienceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<ExperienceFormData> }) => {
      const res = await apiRequest('PATCH', `/api/experiences/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Experience updated",
        description: "The experience has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/experiences'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update experience",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteExperienceMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/experiences/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Experience deleted",
        description: "The experience has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/experiences'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete experience",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ['/api/tags'],
  });

  const createTagMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest('POST', '/api/tags', { name });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create tag",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filterExperiences = async (filters: {
    startDate?: string;
    endDate?: string;
    tagIds?: number[];
    searchTerm?: string;
    dropdownFilters?: Record<string, string[]>;
  }) => {
    try {
      // For dropdown filters and complex filtering, use POST request with the filter params in the body
      const res = await apiRequest('POST', '/api/experiences/search', filters);
      
      if (!res.ok) {
        throw new Error('Failed to filter experiences');
      }
      return await res.json();
    } catch (error) {
      console.error('Error filtering experiences:', error);
      throw error;
    }
  };

  return {
    experiences,
    isLoading,
    isError,
    createExperience: createExperienceMutation.mutate,
    updateExperience: updateExperienceMutation.mutate,
    deleteExperience: deleteExperienceMutation.mutate,
    isPending: createExperienceMutation.isPending || updateExperienceMutation.isPending || deleteExperienceMutation.isPending,
    tags,
    createTag: createTagMutation.mutate,
    filterExperiences,
  };
}
