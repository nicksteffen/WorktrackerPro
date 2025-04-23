import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { experienceSchema, columnFormSchema, insertTagSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Error handler for Zod validation errors
  const handleValidationError = (err: unknown, res: Response) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    return res.status(500).json({ message: 'Internal server error' });
  };

  // Column routes
  app.get("/api/columns", async (req: Request, res: Response) => {
    try {
      const columns = await storage.getColumns();
      res.json(columns);
    } catch (err) {
      console.error("Error fetching columns:", err);
      res.status(500).json({ message: "Failed to fetch columns" });
    }
  });

  app.post("/api/columns", async (req: Request, res: Response) => {
    try {
      const columnData = columnFormSchema.parse(req.body);
      const column = await storage.createColumn(columnData);
      res.status(201).json(column);
    } catch (err) {
      console.error("Error creating column:", err);
      return handleValidationError(err, res);
    }
  });

  app.patch("/api/columns/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const columnData = columnFormSchema.partial().parse(req.body);
      const column = await storage.updateColumn(id, columnData);
      
      if (!column) {
        return res.status(404).json({ message: "Column not found" });
      }
      
      res.json(column);
    } catch (err) {
      console.error("Error updating column:", err);
      return handleValidationError(err, res);
    }
  });

  app.post("/api/columns/import", async (req: Request, res: Response) => {
  try {
    const columns = req.body;
    if (!Array.isArray(columns)) {
      return res.status(400).json({ message: "Invalid column configuration" });
    }
    
    // Delete existing columns
    const existingColumns = await storage.getColumns();
    for (const column of existingColumns) {
      await storage.deleteColumn(column.id);
    }
    
    // Import new columns
    for (const column of columns) {
      await storage.createColumn(column);
    }
    
    res.status(200).json({ message: "Column configuration imported successfully" });
  } catch (err) {
    console.error("Error importing columns:", err);
    res.status(500).json({ message: "Failed to import column configuration" });
  }
});

app.delete("/api/columns/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteColumn(id);
      
      if (!success) {
        return res.status(404).json({ message: "Column not found" });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error("Error deleting column:", err);
      res.status(500).json({ message: "Failed to delete column" });
    }
  });

  // Experience routes
  app.get("/api/experiences", async (req: Request, res: Response) => {
    try {
      // For simple queries, we'll continue to use URL parameters
      const { startDate, endDate, tagIds, searchTerm } = req.query;
      
      // If there are search parameters, use search method
      if (startDate || endDate || tagIds || searchTerm) {
        const experiences = await storage.searchExperiences({
          startDate: startDate ? new Date(startDate as string) : undefined,
          endDate: endDate ? new Date(endDate as string) : undefined,
          tagIds: tagIds ? (typeof tagIds === 'string' ? [parseInt(tagIds)] : (tagIds as string[]).map(id => parseInt(id))) : undefined,
          searchTerm: searchTerm as string | undefined,
        });
        return res.json(experiences);
      }
      
      // Otherwise, return all experiences
      const experiences = await storage.getExperiences();
      res.json(experiences);
    } catch (err) {
      console.error("Error fetching experiences:", err);
      res.status(500).json({ message: "Failed to fetch experiences" });
    }
  });
  
  // Dedicated search endpoint that accepts a POST request for more complex filtering
  app.post("/api/experiences/search", async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, tagIds, searchTerm, dropdownFilters } = req.body;
      
      console.log("Searching with filters:", { 
        startDate, 
        endDate, 
        tagIds, 
        searchTerm,
        dropdownFilters 
      });
      
      const experiences = await storage.searchExperiences({
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        tagIds,
        searchTerm,
        dropdownFilters
      });
      
      res.json(experiences);
    } catch (err) {
      console.error("Error searching experiences:", err);
      res.status(500).json({ message: "Failed to search experiences" });
    }
  });

  app.get("/api/experiences/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const experience = await storage.getExperience(id);
      
      if (!experience) {
        return res.status(404).json({ message: "Experience not found" });
      }
      
      res.json(experience);
    } catch (err) {
      console.error("Error fetching experience:", err);
      res.status(500).json({ message: "Failed to fetch experience" });
    }
  });

  app.post("/api/experiences", async (req: Request, res: Response) => {
    try {
      console.log("Received experience data:", req.body);
      const experienceData = experienceSchema.parse(req.body);
      
      console.log("Parsed experience data:", {
        startDate: experienceData.startDate,
        endDate: experienceData.endDate,
        customFields: experienceData.customFields
      });
      
      // Create the experience with dates converted by zod
      const experience = await storage.createExperience({
        startDate: experienceData.startDate,
        endDate: experienceData.endDate,
        customFields: experienceData.customFields,
      });
      
      // Add tags if provided
      if (experienceData.tags && experienceData.tags.length > 0) {
        for (const tagId of experienceData.tags) {
          await storage.addTagToExperience(experience.id, tagId);
        }
      }
      
      // Fetch the experience with tags
      const completeExperience = await storage.getExperience(experience.id);
      res.status(201).json(completeExperience);
    } catch (err) {
      console.error("Error creating experience:", err);
      return handleValidationError(err, res);
    }
  });

  app.patch("/api/experiences/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      console.log("Received update experience data:", req.body);
      const experienceData = experienceSchema.partial().parse(req.body);
      
      console.log("Parsed update experience data:", {
        startDate: experienceData.startDate,
        endDate: experienceData.endDate,
        customFields: experienceData.customFields
      });
      
      // Update the experience with dates converted by zod
      const experience = await storage.updateExperience(id, {
        startDate: experienceData.startDate,
        endDate: experienceData.endDate,
        customFields: experienceData.customFields,
      });
      
      if (!experience) {
        return res.status(404).json({ message: "Experience not found" });
      }
      
      // Update tags if provided
      if (experienceData.tags) {
        // Get current tags
        const currentTags = await storage.getExperienceTags(id);
        const currentTagIds = currentTags.map(tag => tag.id);
        
        // Tags to add
        const tagsToAdd = experienceData.tags.filter(tagId => !currentTagIds.includes(tagId));
        for (const tagId of tagsToAdd) {
          await storage.addTagToExperience(id, tagId);
        }
        
        // Tags to remove
        const tagsToRemove = currentTagIds.filter(tagId => !experienceData.tags!.includes(tagId));
        for (const tagId of tagsToRemove) {
          await storage.removeTagFromExperience(id, tagId);
        }
      }
      
      // Fetch the updated experience with tags
      const updatedExperience = await storage.getExperience(id);
      res.json(updatedExperience);
    } catch (err) {
      console.error("Error updating experience:", err);
      return handleValidationError(err, res);
    }
  });

  app.delete("/api/experiences/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteExperience(id);
      
      if (!success) {
        return res.status(404).json({ message: "Experience not found" });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error("Error deleting experience:", err);
      res.status(500).json({ message: "Failed to delete experience" });
    }
  });

  // Tag routes
  app.get("/api/tags", async (req: Request, res: Response) => {
    try {
      const tags = await storage.getTags();
      res.json(tags);
    } catch (err) {
      console.error("Error fetching tags:", err);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  app.post("/api/tags", async (req: Request, res: Response) => {
    try {
      const tagData = insertTagSchema.parse(req.body);
      const tag = await storage.createTag(tagData);
      res.status(201).json(tag);
    } catch (err) {
      console.error("Error creating tag:", err);
      return handleValidationError(err, res);
    }
  });

  app.delete("/api/tags/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTag(id);
      
      if (!success) {
        return res.status(404).json({ message: "Tag not found" });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error("Error deleting tag:", err);
      res.status(500).json({ message: "Failed to delete tag" });
    }
  });

  return httpServer;
}
