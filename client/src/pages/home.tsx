import { useState } from "react";
import { useColumns } from "@/hooks/use-columns";
import { useExperiences } from "@/hooks/use-experiences";
import FilterSidebar from "@/components/filter-sidebar";
import ExperienceTable from "@/components/experience-table";
import { Experience } from "@shared/schema";

export default function Home() {
  const { columns, isLoading: columnsLoading } = useColumns();
  const { experiences, isLoading: experiencesLoading } = useExperiences();
  const [filteredExperiences, setFilteredExperiences] = useState<Experience[]>([]);
  
  // When filtering, update the displayed experiences
  const handleFilter = (filtered: Experience[]) => {
    setFilteredExperiences(filtered);
  };
  
  // If not filtered, show all experiences
  const displayedExperiences = filteredExperiences.length > 0 
    ? filteredExperiences 
    : experiences;
    
  const isLoading = columnsLoading || experiencesLoading;

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-6">
          <FilterSidebar onFilter={handleFilter} />
          
          <div className="flex-1">
            <ExperienceTable
              columns={columns}
              experiences={displayedExperiences}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
