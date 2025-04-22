import { useQuery, useMutation } from "@tanstack/react-query";
import { Column, ColumnFormData } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useColumns() {
  const { toast } = useToast();

  const { data: columns = [], isLoading, isError } = useQuery<Column[]>({
    queryKey: ['/api/columns'],
  });

  const createColumnMutation = useMutation({
    mutationFn: async (columnData: ColumnFormData) => {
      const res = await apiRequest('POST', '/api/columns', columnData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Column created",
        description: "The column has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/columns'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create column",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateColumnMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<ColumnFormData> }) => {
      const res = await apiRequest('PATCH', `/api/columns/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Column updated",
        description: "The column has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/columns'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update column",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteColumnMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/columns/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Column deleted",
        description: "The column has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/columns'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete column",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);
  const visibleColumns = sortedColumns.filter(column => column.isVisible);

  return {
    columns: sortedColumns,
    visibleColumns,
    isLoading,
    isError,
    createColumn: createColumnMutation.mutate,
    updateColumn: updateColumnMutation.mutate,
    deleteColumn: deleteColumnMutation.mutate,
    isPending: createColumnMutation.isPending || updateColumnMutation.isPending || deleteColumnMutation.isPending,
  };
}
