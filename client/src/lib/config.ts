import { z } from "zod";

// Default column definitions
export const defaultColumns = [
  {
    id: 1,
    name: "Start Date",
    key: "startDate",
    type: "date" as const,
    order: 1,
    isVisible: true
  },
  {
    id: 2,
    name: "End Date",
    key: "endDate",
    type: "date" as const,
    order: 2,
    isVisible: true
  },
  {
    id: 3,
    name: "Client",
    key: "client",
    type: "short-text" as const,
    order: 3,
    isVisible: true
  },
  {
    id: 4,
    name: "Project",
    key: "project",
    type: "short-text" as const,
    order: 4,
    isVisible: true
  },
  {
    id: 5,
    name: "Skills",
    key: "skills",
    type: "dropdown" as const,
    dropdownOptions: ["React", "TypeScript", "Next.js", "MongoDB", "Python"],
    allowMultiple: true,
    order: 5,
    isVisible: true
  },
  {
    id: 6,
    name: "Notes",
    key: "notes",
    type: "long-text" as const,
    order: 6,
    isVisible: true
  }
];

// Define column types
export const columnTypes = [
  { value: "date", label: "Date" },
  { value: "short-text", label: "Short Text" },
  { value: "long-text", label: "Long Text" },
  { value: "dropdown", label: "Dropdown" }
];

// Helper functions for getting column properties

export const getColumnLabel = (type: string): string => {
  const columnType = columnTypes.find(ct => ct.value === type);
  return columnType?.label || type;
};

// Generate a unique key from a column name
export const generateColumnKey = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

// Tags color mapping to maintain consistent colors
export const tagColors: Record<string, { bg: string, text: string }> = {
  "React": { bg: "bg-blue-100", text: "text-blue-800" },
  "TypeScript": { bg: "bg-purple-100", text: "text-purple-800" },
  "Next.js": { bg: "bg-sky-100", text: "text-sky-800" },
  "MongoDB": { bg: "bg-green-100", text: "text-green-800" },
  "Python": { bg: "bg-yellow-100", text: "text-yellow-800" },
  "FastAPI": { bg: "bg-teal-100", text: "text-teal-800" },
  "default": { bg: "bg-gray-100", text: "text-gray-800" }
};

export const getTagColor = (tagName: string) => {
  return tagColors[tagName] || tagColors.default;
};
