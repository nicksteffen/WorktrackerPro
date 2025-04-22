import { useState } from "react";
import { useColumns } from "@/hooks/use-columns";
import { Column } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { getColumnLabel } from "@/lib/config";
import ColumnForm from "@/components/column-form";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ColumnConfig() {
  const { columns, createColumn, updateColumn, deleteColumn, isPending } = useColumns();
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentColumn, setCurrentColumn] = useState<Column | undefined>(undefined);
  
  // Handle opening the add/edit modal
  const handleAddColumn = () => {
    setCurrentColumn(undefined);
    setIsColumnModalOpen(true);
  };
  
  const handleEditColumn = (column: Column) => {
    setCurrentColumn(column);
    setIsColumnModalOpen(true);
  };
  
  // Handle opening the delete dialog
  const handleDeleteClick = (column: Column) => {
    setCurrentColumn(column);
    setIsDeleteDialogOpen(true);
  };
  
  // Execute delete
  const confirmDelete = () => {
    if (currentColumn) {
      deleteColumn(currentColumn.id);
      setIsDeleteDialogOpen(false);
    }
  };
  
  // Handle form submission
  const handleColumnSubmit = (data: any) => {
    if (currentColumn) {
      updateColumn({ id: currentColumn.id, data });
    } else {
      createColumn(data);
    }
    setIsColumnModalOpen(false);
  };
  
  // Toggle column visibility
  const toggleColumnVisibility = (column: Column) => {
    updateColumn({
      id: column.id,
      data: { isVisible: !column.isVisible }
    });
  };
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-lg">Column Configuration</CardTitle>
            <CardDescription>
              Customize which columns appear in your experience list.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {columns.map(column => (
                <div key={column.id} className="relative flex items-start p-4 border rounded-lg">
                  <div className="flex items-center h-5 mt-1">
                    <Checkbox
                      id={`column-${column.id}`}
                      checked={column.isVisible ? true : false}
                      onCheckedChange={() => toggleColumnVisibility(column)}
                      disabled={isPending}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <Label 
                      htmlFor={`column-${column.id}`} 
                      className="font-medium text-gray-700"
                    >
                      {column.name}
                    </Label>
                    <p className="text-gray-500">Type: {getColumnLabel(column.type)}</p>
                    {column.type === 'dropdown' && (
                      <p className="text-gray-500 text-xs mt-1">
                        Options: {column.dropdownOptions?.join(', ')}
                      </p>
                    )}
                    <div className="mt-2 flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditColumn(column)}
                        disabled={isPending}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteClick(column)}
                        disabled={isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6">
              <Button onClick={handleAddColumn} disabled={isPending}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Column
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Column Form Dialog */}
      <Dialog open={isColumnModalOpen} onOpenChange={setIsColumnModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentColumn ? "Edit Column" : "Add New Column"}</DialogTitle>
          </DialogHeader>
          <ColumnForm 
            column={currentColumn}
            onSubmit={handleColumnSubmit}
            onCancel={() => setIsColumnModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the "{currentColumn?.name}" column from all experiences.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
