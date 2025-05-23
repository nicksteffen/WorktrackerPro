import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import passport from 'passport';
import bcrypt from 'bcryptjs';
import { requireAuth, sessionMiddleware } from './auth';
import { pool } from "./db";
import { storage } from "./storage";
import { experienceSchema, columnFormSchema, insertTagSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Auth middleware
  app.use(sessionMiddleware);
  app.use(passport.initialize());
  app.use(passport.session());

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }

      // Check if user already exists
      const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const result = await pool.query(
        'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
        [username, hashedPassword]
      );

      req.login(result.rows[0], (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error logging in after registration' });
        }
        res.status(200).json(result.rows[0]);
      });
    } catch (err) {
      console.error('Registration error:', err);
      res.status(400).json({ message: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', passport.authenticate('local'), (req, res) => {
    res.json(req.user);
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout(() => {
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/session', (req, res) => {
    res.json(req.user || null);
  });

  // Error handler for Zod validation errors
  const handleValidationError = (err: unknown, res: Response) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    return res.status(500).json({ message: 'Internal server error' });
  };

  // Column routes
  app.get("/api/columns", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const columns = await storage.getColumns(userId);
      res.json(columns);
    } catch (err) {
      console.error("Error fetching columns:", err);
      res.status(500).json({ message: "Failed to fetch columns" });
    }
  });

  app.post("/api/columns", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const columnData = columnFormSchema.parse({...req.body, userId});
      const column = await storage.createColumn(columnData);
      res.status(201).json(column);
    } catch (err) {
      console.error("Error creating column:", err);
      return handleValidationError(err, res);
    }
  });

  app.patch("/api/columns/:id", requireAuth, async (req: Request, res: Response) => {
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

  app.post("/api/columns/import", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const columns = req.body;
      if (!Array.isArray(columns)) {
        return res.status(400).json({ message: "Invalid column configuration" });
      }

      // Delete existing columns
      const existingColumns = await storage.getColumns(userId);
      for (const column of existingColumns) {
        await storage.deleteColumn(column.id);
      }

      // Import new columns
      for (const column of columns) {
        await storage.createColumn({...column, userId});
      }

      res.status(200).json({ message: "Column configuration imported successfully" });
    } catch (err) {
      console.error("Error importing columns:", err);
      res.status(500).json({ message: "Failed to import column configuration" });
    }
  });

  app.delete("/api/columns/:id", requireAuth, async (req: Request, res: Response) => {
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
  app.get("/api/experiences", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const experiences = await storage.getExperiences(userId);
      res.json(experiences);
    } catch (err) {
      console.error("Error fetching experiences:", err);
      res.status(500).json({ message: "Failed to fetch experiences" });
    }
  });

  // Dedicated search endpoint that accepts a POST request for more complex filtering
  app.post("/api/experiences/search", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { startDate, endDate, tagIds, searchTerm, dropdownFilters } = req.body;

      const experiences = await storage.searchExperiences({
        userId,
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

  app.get("/api/experiences/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const id = parseInt(req.params.id);
      const experience = await storage.getExperience(id, userId);

      if (!experience) {
        return res.status(404).json({ message: "Experience not found" });
      }

      res.json(experience);
    } catch (err) {
      console.error("Error fetching experience:", err);
      res.status(500).json({ message: "Failed to fetch experience" });
    }
  });

  app.post("/api/experiences", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const experienceData = experienceSchema.parse({...req.body, userId});
      const experience = await storage.createExperience(experienceData);

      // Add tags if provided
      if (experienceData.tags && experienceData.tags.length > 0) {
        for (const tagId of experienceData.tags) {
          await storage.addTagToExperience(experience.id, tagId);
        }
      }

      // Fetch the experience with tags
      const completeExperience = await storage.getExperience(experience.id, userId);
      res.status(201).json(completeExperience);
    } catch (err) {
      console.error("Error creating experience:", err);
      return handleValidationError(err, res);
    }
  });

  app.patch("/api/experiences/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const id = parseInt(req.params.id);
      const experienceData = experienceSchema.partial().parse(req.body);

      const experience = await storage.updateExperience(id, experienceData);

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
      const updatedExperience = await storage.getExperience(id, userId);
      res.json(updatedExperience);
    } catch (err) {
      console.error("Error updating experience:", err);
      return handleValidationError(err, res);
    }
  });

  app.delete("/api/experiences/:id", requireAuth, async (req: Request, res: Response) => {
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
  app.get("/api/tags", requireAuth, async (req: Request, res: Response) => {
    try {
      const tags = await storage.getTags();
      res.json(tags);
    } catch (err) {
      console.error("Error fetching tags:", err);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  app.post("/api/tags", requireAuth, async (req: Request, res: Response) => {
    try {
      const tagData = insertTagSchema.parse(req.body);
      const tag = await storage.createTag(tagData);
      res.status(201).json(tag);
    } catch (err) {
      console.error("Error creating tag:", err);
      return handleValidationError(err, res);
    }
  });

  app.delete("/api/tags/:id", requireAuth, async (req: Request, res: Response) => {
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