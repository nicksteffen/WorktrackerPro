import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatISO } from "date-fns";
import { useExperiences } from "@/hooks/use-experiences";
import { useColumns } from "@/hooks/use-columns";
import { Tag, Column } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface FilterSidebarProps {
  onFilter: (filteredExperiences: any[]) => void;
}

export default function FilterSidebar({ onFilter }: FilterSidebarProps) {
  const { tags, filterExperiences } = useExperiences();
  const { columns } = useColumns();
  const { toast } = useToast();
  
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isFiltering, setIsFiltering] = useState(false);
  const [dropdownFilters, setDropdownFilters] = useState<Record<string, string[]>>({});

  // Get dropdown columns
  const dropdownColumns = columns.filter(col => 
    col.type === "dropdown" && col.isVisible && col.dropdownOptions && col.dropdownOptions.length > 0
  );

  // Apply filters
  const applyFilters = async () => {
    setIsFiltering(true);
    
    try {
      // Filter out empty dropdown filters
      const nonEmptyDropdownFilters: Record<string, string[]> = {};
      Object.entries(dropdownFilters).forEach(([key, values]) => {
        if (values.length > 0) {
          nonEmptyDropdownFilters[key] = values;
        }
      });

      const filteredExperiences = await filterExperiences({
        startDate: startDate ? formatISO(new Date(startDate), { representation: 'date' }) : undefined,
        endDate: endDate ? formatISO(new Date(endDate), { representation: 'date' }) : undefined,
        tagIds: selectedTags.length > 0 ? selectedTags : undefined,
        searchTerm: searchTerm || undefined,
        dropdownFilters: Object.keys(nonEmptyDropdownFilters).length > 0 ? nonEmptyDropdownFilters : undefined,
      });
      
      onFilter(filteredExperiences);
    } catch (error) {
      toast({
        title: "Filter error",
        description: "Failed to apply filters. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFiltering(false);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedTags([]);
    setSearchTerm("");
    setDropdownFilters({});
    
    // Reset to show all experiences
    filterExperiences({}).then(onFilter);
  };

  // Handle tag selection
  const toggleTag = (tagId: number) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId) 
        : [...prev, tagId]
    );
  };

  // Handle dropdown filter selection
  const handleDropdownFilter = (columnKey: string, value: string) => {
    setDropdownFilters(prev => {
      const current = prev[columnKey] || [];
      
      // If already selected, remove it
      if (current.includes(value)) {
        const updated = current.filter(v => v !== value);
        return {
          ...prev,
          [columnKey]: updated
        };
      } 
      // Add to selection
      else {
        return {
          ...prev,
          [columnKey]: [...current, value]
        };
      }
    });
  };

  // Remove a dropdown filter value
  const removeDropdownFilter = (columnKey: string, value: string) => {
    setDropdownFilters(prev => {
      const current = prev[columnKey] || [];
      return {
        ...prev,
        [columnKey]: current.filter(v => v !== value)
      };
    });
  };

  return (
    <div className="w-full md:w-64 flex-shrink-0">
      <Card className="sticky top-6">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        
        <CardContent className="px-4 py-5 space-y-6">
          {/* Date Range Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Date Range</h4>
            <div className="space-y-2">
              <div>
                <Label htmlFor="start-date" className="text-xs text-gray-500">Start Date</Label>
                <Input
                  type="date"
                  id="start-date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="end-date" className="text-xs text-gray-500">End Date</Label>
                <Input
                  type="date"
                  id="end-date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          
          {/* Dropdown filters */}
          {dropdownColumns.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Dropdown Filters</h4>
              <div className="space-y-3">
                {dropdownColumns.map((column) => (
                  <div key={column.key} className="space-y-2">
                    <Label className="text-xs text-gray-500">{column.name}</Label>
                    <Select 
                      onValueChange={(value) => handleDropdownFilter(column.key, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${column.name}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {column.dropdownOptions?.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Show selected values as badges */}
                    {dropdownFilters[column.key] && dropdownFilters[column.key].length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {dropdownFilters[column.key].map(value => (
                          <Badge key={value} className="flex items-center gap-1 px-2 py-1">
                            {value}
                            <button 
                              onClick={() => removeDropdownFilter(column.key, value)}
                              className="text-xs rounded-full hover:bg-gray-300/20 p-[2px]"
                            >
                              <X size={12} />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Tags Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Skills/Tags</h4>
            <div className="space-y-1">
              {tags.map((tag: Tag) => (
                <div key={tag.id} className="flex items-center">
                  <Checkbox
                    id={`tag-${tag.id}`}
                    checked={selectedTags.includes(tag.id)}
                    onCheckedChange={() => toggleTag(tag.id)}
                  />
                  <Label 
                    htmlFor={`tag-${tag.id}`} 
                    className="ml-2 text-sm text-gray-700"
                  >
                    {tag.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Search */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Search</h4>
            <Input
              placeholder="Search experiences..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2 pt-2">
          <Button 
            className="w-full" 
            onClick={applyFilters}
            disabled={isFiltering}
          >
            Apply Filters
          </Button>
          <Button 
            className="w-full" 
            variant="outline"
            onClick={clearFilters}
            disabled={isFiltering}
          >
            Clear Filters
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
