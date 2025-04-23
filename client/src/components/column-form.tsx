import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { columnFormSchema, Column } from "@shared/schema";
import { generateColumnKey } from "@/lib/config";
import { useColumns } from "@/hooks/use-columns";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Switch } from "@/components/ui/switch";
import { columnTypes } from "@/lib/config";

interface ColumnFormProps {
  column?: Column;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function ColumnForm({ column, onSubmit, onCancel }: ColumnFormProps) {
  const { columns } = useColumns();
  const [showDropdownOptions, setShowDropdownOptions] = useState(
    column?.type === "dropdown"
  );
  
  // Get the maximum order value for new columns
  const [maxOrder, setMaxOrder] = useState<number>(column?.order || 0);
  
  // Calculate max order when component loads
  useEffect(() => {
    if (!column && columns.length > 0) {
      // Find the highest order value
      const highestOrder = Math.max(...columns.map(col => col.order));
      setMaxOrder(highestOrder);
      
      // Update the form with the next order
      form.setValue("order", highestOrder + 1);
    }
  }, [columns]);
  
  const form = useForm({
    resolver: zodResolver(columnFormSchema),
    defaultValues: {
      name: column?.name || "",
      key: column?.key || "",
      type: column?.type || "short-text",
      dropdownOptions: column?.dropdownOptions || [],
      allowMultiple: column?.allowMultiple || false,
      isVisible: column?.isVisible ?? true,
      order: column ? column.order : maxOrder + 1, // Use next available order for new columns
    },
  });
  
  // Update key when name changes (only for new columns)
  const watchName = form.watch("name");
  const watchType = form.watch("type");
  
  // Generate key from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);
    
    // Only auto-generate key for new columns
    if (!column) {
      const key = generateColumnKey(name);
      form.setValue("key", key);
    }
  };
  
  // Show/hide dropdown options based on type
  const handleTypeChange = (value: string) => {
    form.setValue("type", value as any);
    setShowDropdownOptions(value === "dropdown");
    
    // Reset dropdown options when changing away from dropdown
    if (value !== "dropdown") {
      form.setValue("dropdownOptions", []);
      form.setValue("allowMultiple", false);
    }
  };
  
  // Parse dropdown options from textarea
  const handleDropdownOptionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const optionsText = e.target.value;
    
    // Store the raw text value directly
    const textareaValue = optionsText;
    
    // Parse into array for the form value
    const options = optionsText
      .split("\n")
      .map(option => option.trim())
      .filter(Boolean);
    
    form.setValue("dropdownOptions", options);
    
    // Force re-render with the correct text content
    e.target.value = textareaValue;
  };
  
  const handleSubmit = (data: any) => {
    onSubmit(data);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Column Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={handleNameChange}
                  placeholder="e.g., Role, Location, Technologies"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Column Key</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., role, location, technologies"
                  disabled={!!column} // Disable editing key for existing columns
                />
              </FormControl>
              <FormDescription>
                A unique identifier for this column (auto-generated from name)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Column Type</FormLabel>
              <Select 
                value={field.value} 
                onValueChange={handleTypeChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {columnTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {showDropdownOptions && (
          <>
            <FormField
              control={form.control}
              name="dropdownOptions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dropdown Options</FormLabel>
                  <FormControl>
                    <Textarea
                      value={field.value?.join("\n") || ""}
                      onChange={handleDropdownOptionsChange}
                      placeholder="Enter options, one per line"
                      rows={4}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          // Prevent form submission when pressing Enter in the textarea
                          e.stopPropagation();
                          
                          // Get the current value and cursor position
                          const textarea = e.currentTarget;
                          const cursorPosition = textarea.selectionStart;
                          const value = textarea.value;
                          
                          // Insert a newline at the cursor position
                          const newValue = value.substring(0, cursorPosition) + "\n" + value.substring(cursorPosition);
                          
                          // Update the value and cursor position
                          textarea.value = newValue;
                          textarea.selectionStart = textarea.selectionEnd = cursorPosition + 1;
                          
                          // Manually trigger the onChange handler
                          const changeEvent = new Event('input', { bubbles: true });
                          textarea.dispatchEvent(changeEvent);
                          
                          // Prevent the default Enter key behavior
                          e.preventDefault();
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter each option on a new line
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="allowMultiple"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Allow Multiple Selections</FormLabel>
                    <FormDescription>
                      Users can select more than one option for this column
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        )}
        
        <FormField
          control={form.control}
          name="isVisible"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Visible in Table</FormLabel>
                <FormDescription>
                  Show this column in the experiences table
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {column ? "Update Column" : "Add Column"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
