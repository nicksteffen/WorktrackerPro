import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
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
import { Edit, Trash2, Search, Plus } from "lucide-react";
import { Experience, Tag, Column } from "@shared/schema";
import { useExperiences } from "@/hooks/use-experiences";
import { getTagColor } from "@/lib/config";
import { format } from "date-fns";
import ExperienceForm from "./experience-form";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";

interface ExperienceTableProps {
  columns: Column[];
  experiences: Experience[];
  isLoading: boolean;
}

export default function ExperienceTable({ 
  columns, 
  experiences,
  isLoading 
}: ExperienceTableProps) {
  const { deleteExperience } = useExperiences();

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentExperience, setCurrentExperience] = useState<Experience | null>(null);
  const itemsPerPage = 5;

  // Filter experiences by search term
  const filteredExperiences = experiences.filter(exp => {
    if (!searchTerm) return true;

    const term = searchTerm.toLowerCase();

    // Search in custom fields
    const customFieldsMatch = Object.entries(exp.customFields || {}).some(([_, value]) => 
      value && typeof value === 'string' && value.toLowerCase().includes(term)
    );

    // Search in tags
    const tagsMatch = exp.tags?.some(tag => 
      tag.name.toLowerCase().includes(term)
    );

    return customFieldsMatch || tagsMatch;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredExperiences.length / itemsPerPage));
  const paginatedExperiences = filteredExperiences.slice(
    (page - 1) * itemsPerPage, 
    page * itemsPerPage
  );

  // Format date for display
  const formatDate = (dateStr: string | Date | null | undefined): string => {
    if (!dateStr) return "";
    return format(new Date(dateStr), "MMM yyyy");
  };

  // Handle opening the edit modal
  const handleEdit = (experience: Experience) => {
    setCurrentExperience(experience);
    setIsExperienceModalOpen(true);
  };

  // Handle opening the add modal
  const handleAdd = () => {
    setCurrentExperience(null);
    setIsExperienceModalOpen(true);
  };

  // Handle opening the delete dialog
  const handleDeleteClick = (experience: Experience) => {
    setCurrentExperience(experience);
    setIsDeleteDialogOpen(true);
  };

  // Execute delete
  const confirmDelete = () => {
    if (currentExperience) {
      deleteExperience(currentExperience.id);
      setIsDeleteDialogOpen(false);
    }
  };

  // Render cell content based on column type
  const renderCellContent = (experience: Experience, column: Column) => {
    const value = column.key === 'startDate' 
      ? experience.startDate 
      : column.key === 'endDate' 
        ? experience.endDate 
        : experience.customFields && typeof experience.customFields === 'object'
          ? (experience.customFields as Record<string, any>)[column.key]
          : undefined;

    if (column.key === 'startDate' || column.key === 'endDate') {
      return formatDate(value as string | Date | null | undefined);
    }

    // If this is a date column in custom fields
    if (column.type === 'date' && value) {
      return formatDate(value as string);
    }

    // If this is a dropdown column with allowMultiple and the value is an array
    if (column.type === 'dropdown' && column.allowMultiple && Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, idx) => {
            const color = getTagColor(item);
            return (
              <span
                key={idx}
                className={`tag-pill inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color.bg} ${color.text}`}
              >
                {item}
              </span>
            );
          })}
        </div>
      );
    }

    // For skills column with tags
    if (column.key === 'skills' && experience.tags && experience.tags.length > 0) {
      return (
        <div className="flex flex-wrap gap-1">
          {experience.tags.map((tag: Tag) => {
            const color = getTagColor(tag.name);
            return (
              <span
                key={tag.id}
                className={`tag-pill inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color.bg} ${color.text}`}
              >
                {tag.name}
              </span>
            );
          })}
        </div>
      );
    }

    // Default for text content with truncation for long text
    if (column.type === 'long-text' && typeof value === 'string') {
      return <div className="max-w-xs truncate">{value}</div>;
    }

    return value || "";
  };

  const exportToCsv = () => {
    // Convert experiences to CSV format
    const headers = columns.map(col => col.name).join(',') + '\n';
    const rows = experiences.map(exp => {
      return columns.map(col => {
        if (col.key === 'startDate' || col.key === 'endDate') {
          return exp[col.key] ? new Date(exp[col.key]).toLocaleDateString() : '';
        }
        const value = exp.customFields[col.key] || '';
        return Array.isArray(value) ? `"${value.join(', ')}"` : `"${value}"`;
      }).join(',');
    }).join('\n');

    const csv = headers + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'experiences.csv';
    a.click();
  };

  return (
    <div>
      <div className="mb-4">
        <Button variant="outline" onClick={exportToCsv}>
          Export to CSV
        </Button>
      </div>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="flex justify-between items-center px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Work Experiences</h2>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                placeholder="Search experiences..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Experience
            </Button>
          </div>
        </div>

        {/* Experience Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.filter(col => col.isVisible).map((column) => (
                  <TableHead key={column.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {column.name}
                  </TableHead>
                ))}
                <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.filter(col => col.isVisible).length + 1} className="text-center py-10">
                    Loading experiences...
                  </TableCell>
                </TableRow>
              ) : paginatedExperiences.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.filter(col => col.isVisible).length + 1} className="text-center py-10">
                    No experiences found. Add your first experience to get started.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedExperiences.map((experience) => (
                  <TableRow key={experience.id} className="hover:bg-gray-50">
                    {columns.filter(col => col.isVisible).map((column) => (
                      <TableCell key={`${experience.id}-${column.id}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {renderCellContent(experience, column)}
                      </TableCell>
                    ))}
                    <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        onClick={() => handleEdit(experience)}
                        className="text-primary hover:text-primary-dark mr-2"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleDeleteClick(experience)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!isLoading && filteredExperiences.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(page - 1) * itemsPerPage + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(page * itemsPerPage, filteredExperiences.length)}
                  </span>{" "}
                  of <span className="font-medium">{filteredExperiences.length}</span> results
                </p>
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className={page === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {/* Generate pagination links */}
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    // Logic for which page numbers to show
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <PaginationItem key={i}>
                        <PaginationLink 
                          onClick={() => setPage(pageNum)}
                          isActive={page === pageNum}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </div>

      {/* Experience Form Dialog */}
      <Dialog open={isExperienceModalOpen} onOpenChange={setIsExperienceModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentExperience ? "Edit Experience" : "Add New Experience"}</DialogTitle>
          </DialogHeader>
          <ExperienceForm 
            columns={columns}
            experience={currentExperience}
            onClose={() => setIsExperienceModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this experience and all associated data.
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