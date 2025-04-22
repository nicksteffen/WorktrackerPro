import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { useExperiences } from "@/hooks/use-experiences";
import { Experience, Column, Tag, experienceSchema } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface ExperienceFormProps {
  columns: Column[];
  experience: Experience | null;
  onClose: () => void;
}

export default function ExperienceForm({ 
  columns, 
  experience, 
  onClose 
}: ExperienceFormProps) {
  const { createExperience, updateExperience, tags } = useExperiences();
  
  // Custom validation schema based on column requirements
  const getValidationSchema = () => {
    const customFieldsSchema: Record<string, any> = {};
    
    // Add validation for each column
    columns.forEach(column => {
      if (column.key === 'startDate' || column.key === 'endDate') return; // These are handled separately
      
      let fieldSchema;
      
      switch (column.type) {
        case 'date':
          fieldSchema = z.string().optional();
          break;
        case 'short-text':
          fieldSchema = z.string().optional();
          break;
        case 'long-text':
          fieldSchema = z.string().optional();
          break;
        case 'dropdown':
          if (column.allowMultiple) {
            fieldSchema = z.array(z.string()).optional();
          } else {
            fieldSchema = z.string().optional();
          }
          break;
        default:
          fieldSchema = z.any().optional();
      }
      
      customFieldsSchema[column.key] = fieldSchema;
    });
    
    return experienceSchema.extend({
      customFields: z.object(customFieldsSchema),
    });
  };
  
  // Initialize form with experience data or defaults
  const form = useForm<z.infer<ReturnType<typeof getValidationSchema>>>({
    resolver: zodResolver(getValidationSchema()),
    defaultValues: {
      startDate: experience?.startDate ? new Date(experience.startDate) : new Date(),
      endDate: experience?.endDate ? new Date(experience.endDate) : undefined,
      customFields: experience?.customFields || {},
      tags: experience?.tags?.map(tag => tag.id) || [],
    },
  });

  const onSubmit = (data: z.infer<ReturnType<typeof getValidationSchema>>) => {
    if (experience) {
      updateExperience({ 
        id: experience.id, 
        data: {
          startDate: data.startDate,
          endDate: data.endDate,
          customFields: data.customFields,
          tags: data.tags,
        }
      });
    } else {
      createExperience({
        startDate: data.startDate,
        endDate: data.endDate,
        customFields: data.customFields,
        tags: data.tags,
      });
    }
    onClose();
  };
  
  // Toggle tag selection
  const toggleTag = (tagId: number) => {
    const currentTags = form.getValues("tags") || [];
    const tagIndex = currentTags.indexOf(tagId);
    
    if (tagIndex > -1) {
      // Remove tag
      const newTags = [...currentTags];
      newTags.splice(tagIndex, 1);
      form.setValue("tags", newTags);
    } else {
      // Add tag
      form.setValue("tags", [...currentTags, tagId]);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Start Date */}
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* End Date */}
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Current/Ongoing</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Custom Fields */}
        <div className="space-y-4">
          {columns.map(column => {
            // Skip date fields as they're handled separately
            if (column.key === 'startDate' || column.key === 'endDate') return null;
            
            // Render different form controls based on column type
            switch (column.type) {
              case 'date':
                return (
                  <FormField
                    key={column.id}
                    control={form.control}
                    name={`customFields.${column.key}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{column.name}</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                );
                
              case 'short-text':
                return (
                  <FormField
                    key={column.id}
                    control={form.control}
                    name={`customFields.${column.key}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{column.name}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                );
                
              case 'long-text':
                return (
                  <FormField
                    key={column.id}
                    control={form.control}
                    name={`customFields.${column.key}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{column.name}</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value || ''} rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                );
                
              case 'dropdown':
                if (column.allowMultiple) {
                  return (
                    <FormField
                      key={column.id}
                      control={form.control}
                      name={`customFields.${column.key}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{column.name}</FormLabel>
                          <div className="space-y-2">
                            {column.dropdownOptions?.map((option, index) => (
                              <div key={index} className="flex items-center">
                                <Checkbox
                                  id={`${column.key}-${index}`}
                                  checked={(field.value || []).includes(option)}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentValue, option]);
                                    } else {
                                      field.onChange(currentValue.filter((val: string) => val !== option));
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`${column.key}-${index}`}
                                  className="ml-2 text-sm"
                                >
                                  {option}
                                </label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  );
                } else {
                  return (
                    <FormField
                      key={column.id}
                      control={form.control}
                      name={`customFields.${column.key}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{column.name}</FormLabel>
                          <Select
                            value={field.value || ''}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={`Select ${column.name}`} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {column.dropdownOptions?.map((option, index) => (
                                <SelectItem key={index} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  );
                }
                
              default:
                return null;
            }
          })}
          
          {/* Tags */}
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag: Tag) => (
                    <Badge
                      key={tag.id}
                      variant={(field.value || []).includes(tag.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {experience ? "Update" : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
