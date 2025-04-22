import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { formatISO } from "date-fns";
import { useExperiences } from "@/hooks/use-experiences";
import { Tag } from "@shared/schema";

interface FilterSidebarProps {
  onFilter: (filteredExperiences: any[]) => void;
}

export default function FilterSidebar({ onFilter }: FilterSidebarProps) {
  const { tags, filterExperiences } = useExperiences();
  const { toast } = useToast();
  
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [client, setClient] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isFiltering, setIsFiltering] = useState(false);

  // Apply filters
  const applyFilters = async () => {
    setIsFiltering(true);
    
    try {
      const filteredExperiences = await filterExperiences({
        startDate: startDate ? formatISO(new Date(startDate), { representation: 'date' }) : undefined,
        endDate: endDate ? formatISO(new Date(endDate), { representation: 'date' }) : undefined,
        tagIds: selectedTags.length > 0 ? selectedTags : undefined,
        searchTerm: searchTerm || client || undefined,
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
    setClient("");
    setSearchTerm("");
    
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
          
          {/* Client Filter */}
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
