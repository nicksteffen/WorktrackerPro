import { 
  users, type User, type InsertUser,
  columns, type Column, type InsertColumn,
  experiences, type Experience, type InsertExperience,
  tags, type Tag, type InsertTag,
  experienceTags, type ExperienceTag, type InsertExperienceTag
} from "@shared/schema";
import { db } from "./db";
import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";

export interface IStorage {
  // User methods (from original file)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Column methods
  getColumns(): Promise<Column[]>;
  getColumn(id: number): Promise<Column | undefined>;
  getColumnByKey(key: string): Promise<Column | undefined>;
  createColumn(column: InsertColumn): Promise<Column>;
  updateColumn(id: number, column: Partial<InsertColumn>): Promise<Column | undefined>;
  deleteColumn(id: number): Promise<boolean>;
  
  // Experience methods
  getExperiences(): Promise<Experience[]>;
  getExperience(id: number): Promise<Experience | undefined>;
  createExperience(experience: InsertExperience): Promise<Experience>;
  updateExperience(id: number, experience: Partial<InsertExperience>): Promise<Experience | undefined>;
  deleteExperience(id: number): Promise<boolean>;
  
  // Tag methods
  getTags(): Promise<Tag[]>;
  getTag(id: number): Promise<Tag | undefined>;
  getTagByName(name: string): Promise<Tag | undefined>;
  createTag(tag: InsertTag): Promise<Tag>;
  deleteTag(id: number): Promise<boolean>;
  
  // Experience-Tag methods
  getExperienceTags(experienceId: number): Promise<Tag[]>;
  addTagToExperience(experienceId: number, tagId: number): Promise<ExperienceTag>;
  removeTagFromExperience(experienceId: number, tagId: number): Promise<boolean>;
  
  // Search methods
  searchExperiences(params: { 
    startDate?: Date; 
    endDate?: Date; 
    tagIds?: number[];
    searchTerm?: string;
  }): Promise<Experience[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private columns: Map<number, Column>;
  private experiences: Map<number, Experience>;
  private tags: Map<number, Tag>;
  private experienceTags: Map<number, ExperienceTag>;
  private userCurrentId: number;
  private columnCurrentId: number;
  private experienceCurrentId: number;
  private tagCurrentId: number;
  private experienceTagCurrentId: number;

  constructor() {
    this.users = new Map();
    this.columns = new Map();
    this.experiences = new Map();
    this.tags = new Map();
    this.experienceTags = new Map();
    
    this.userCurrentId = 1;
    this.columnCurrentId = 1;
    this.experienceCurrentId = 1;
    this.tagCurrentId = 1;
    this.experienceTagCurrentId = 1;
    
    // Initialize with default columns
    this.initializeDefaultColumns();
  }

  private initializeDefaultColumns() {
    const defaultColumns: InsertColumn[] = [
      { name: "Start Date", key: "startDate", type: "date", order: 1, isVisible: true },
      { name: "End Date", key: "endDate", type: "date", order: 2, isVisible: true },
      { name: "Client", key: "client", type: "short-text", order: 3, isVisible: true },
      { name: "Project", key: "project", type: "short-text", order: 4, isVisible: true },
      { name: "Skills", key: "skills", type: "dropdown", dropdownOptions: ["React", "TypeScript", "Next.js", "MongoDB", "Python"], allowMultiple: true, order: 5, isVisible: true },
      { name: "Notes", key: "notes", type: "long-text", order: 6, isVisible: true },
    ];

    defaultColumns.forEach(column => {
      this.createColumn(column);
    });
  }

  // User methods (from original file)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Column methods
  async getColumns(): Promise<Column[]> {
    return Array.from(this.columns.values()).sort((a, b) => a.order - b.order);
  }

  async getColumn(id: number): Promise<Column | undefined> {
    return this.columns.get(id);
  }

  async getColumnByKey(key: string): Promise<Column | undefined> {
    return Array.from(this.columns.values()).find(column => column.key === key);
  }

  async createColumn(insertColumn: InsertColumn): Promise<Column> {
    const id = this.columnCurrentId++;
    // If order is not provided, set it to the last position
    if (!insertColumn.order) {
      const columns = await this.getColumns();
      insertColumn.order = columns.length > 0 ? Math.max(...columns.map(c => c.order)) + 1 : 1;
    }
    const column: Column = { ...insertColumn, id };
    this.columns.set(id, column);
    return column;
  }

  async updateColumn(id: number, columnData: Partial<InsertColumn>): Promise<Column | undefined> {
    const column = this.columns.get(id);
    if (!column) return undefined;
    
    const updatedColumn: Column = { ...column, ...columnData };
    this.columns.set(id, updatedColumn);
    return updatedColumn;
  }

  async deleteColumn(id: number): Promise<boolean> {
    return this.columns.delete(id);
  }

  // Experience methods
  async getExperiences(): Promise<Experience[]> {
    const experiences = Array.from(this.experiences.values());
    
    // Attach tags to each experience
    for (const experience of experiences) {
      experience.tags = await this.getExperienceTags(experience.id);
    }
    
    return experiences;
  }

  async getExperience(id: number): Promise<Experience | undefined> {
    const experience = this.experiences.get(id);
    if (!experience) return undefined;
    
    // Attach tags
    experience.tags = await this.getExperienceTags(id);
    
    return experience;
  }

  async createExperience(insertExperience: InsertExperience): Promise<Experience> {
    const id = this.experienceCurrentId++;
    const experience: Experience = { ...insertExperience, id };
    this.experiences.set(id, experience);
    return experience;
  }

  async updateExperience(id: number, experienceData: Partial<InsertExperience>): Promise<Experience | undefined> {
    const experience = await this.getExperience(id);
    if (!experience) return undefined;
    
    const updatedExperience: Experience = { 
      ...experience, 
      ...experienceData,
      // Preserve tags
      tags: experience.tags 
    };
    
    this.experiences.set(id, updatedExperience);
    return updatedExperience;
  }

  async deleteExperience(id: number): Promise<boolean> {
    // Delete related experience-tag relations
    const experienceTagIds = Array.from(this.experienceTags.values())
      .filter(et => et.experienceId === id)
      .map(et => et.id);
    
    experienceTagIds.forEach(etId => this.experienceTags.delete(etId));
    
    return this.experiences.delete(id);
  }

  // Tag methods
  async getTags(): Promise<Tag[]> {
    return Array.from(this.tags.values());
  }

  async getTag(id: number): Promise<Tag | undefined> {
    return this.tags.get(id);
  }

  async getTagByName(name: string): Promise<Tag | undefined> {
    return Array.from(this.tags.values()).find(tag => tag.name === name);
  }

  async createTag(insertTag: InsertTag): Promise<Tag> {
    // Check if tag already exists
    const existingTag = await this.getTagByName(insertTag.name);
    if (existingTag) return existingTag;
    
    const id = this.tagCurrentId++;
    const tag: Tag = { ...insertTag, id };
    this.tags.set(id, tag);
    return tag;
  }

  async deleteTag(id: number): Promise<boolean> {
    // Delete related experience-tag relations
    const experienceTagIds = Array.from(this.experienceTags.values())
      .filter(et => et.tagId === id)
      .map(et => et.id);
    
    experienceTagIds.forEach(etId => this.experienceTags.delete(etId));
    
    return this.tags.delete(id);
  }

  // Experience-Tag methods
  async getExperienceTags(experienceId: number): Promise<Tag[]> {
    const tagIds = Array.from(this.experienceTags.values())
      .filter(et => et.experienceId === experienceId)
      .map(et => et.tagId);
    
    return tagIds.map(tagId => this.tags.get(tagId)).filter(Boolean) as Tag[];
  }

  async addTagToExperience(experienceId: number, tagId: number): Promise<ExperienceTag> {
    // Check if relation already exists
    const exists = Array.from(this.experienceTags.values()).some(
      et => et.experienceId === experienceId && et.tagId === tagId
    );
    
    if (exists) {
      return Array.from(this.experienceTags.values()).find(
        et => et.experienceId === experienceId && et.tagId === tagId
      ) as ExperienceTag;
    }
    
    const id = this.experienceTagCurrentId++;
    const experienceTag: ExperienceTag = { id, experienceId, tagId };
    this.experienceTags.set(id, experienceTag);
    return experienceTag;
  }

  async removeTagFromExperience(experienceId: number, tagId: number): Promise<boolean> {
    const experienceTagId = Array.from(this.experienceTags.values()).find(
      et => et.experienceId === experienceId && et.tagId === tagId
    )?.id;
    
    if (!experienceTagId) return false;
    
    return this.experienceTags.delete(experienceTagId);
  }

  // Search methods
  async searchExperiences(params: { 
    startDate?: Date; 
    endDate?: Date; 
    tagIds?: number[];
    searchTerm?: string;
  }): Promise<Experience[]> {
    let experiences = await this.getExperiences();
    
    // Filter by start date
    if (params.startDate) {
      experiences = experiences.filter(exp => 
        new Date(exp.startDate) >= new Date(params.startDate!)
      );
    }
    
    // Filter by end date
    if (params.endDate) {
      experiences = experiences.filter(exp => 
        !exp.endDate || new Date(exp.endDate) <= new Date(params.endDate!)
      );
    }
    
    // Filter by tags
    if (params.tagIds && params.tagIds.length > 0) {
      experiences = experiences.filter(exp => {
        if (!exp.tags) return false;
        return params.tagIds!.some(tagId => 
          exp.tags!.some(tag => tag.id === tagId)
        );
      });
    }
    
    // Filter by search term
    if (params.searchTerm) {
      const searchTerm = params.searchTerm.toLowerCase();
      experiences = experiences.filter(exp => {
        // Search in custom fields
        const customFieldsMatch = Object.values(exp.customFields).some(value => 
          value && typeof value === 'string' && value.toLowerCase().includes(searchTerm)
        );
        
        // Search in tags
        const tagsMatch = exp.tags?.some(tag => 
          tag.name.toLowerCase().includes(searchTerm)
        );
        
        return customFieldsMatch || tagsMatch;
      });
    }
    
    return experiences;
  }
}

// DatabaseStorage implementation using PostgreSQL
export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeDefaultColumns();
  }

  // Initialize default columns if none exist yet
  private async initializeDefaultColumns() {
    const existingColumns = await this.getColumns();
    
    if (existingColumns.length === 0) {
      const defaultColumns = [
        {
          name: "Start Date",
          key: "startDate",
          type: "date",
          isVisible: true,
          order: 1,
        },
        {
          name: "End Date",
          key: "endDate",
          type: "date",
          isVisible: true,
          order: 2,
        },
        {
          name: "Client",
          key: "client",
          type: "short-text",
          isVisible: true,
          order: 3,
        },
        {
          name: "Project",
          key: "project",
          type: "short-text",
          isVisible: true,
          order: 4,
        },
        {
          name: "Skills",
          key: "skills",
          type: "dropdown",
          dropdownOptions: ["React", "TypeScript", "Next.js", "MongoDB", "Python"],
          allowMultiple: true,
          isVisible: true,
          order: 5,
        },
        {
          name: "Notes",
          key: "notes",
          type: "long-text",
          isVisible: true,
          order: 6,
        }
      ];
      
      for (const column of defaultColumns) {
        await this.createColumn(column as InsertColumn);
      }
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Column methods
  async getColumns(): Promise<Column[]> {
    return db.select().from(columns).orderBy(asc(columns.order));
  }
  
  async getColumn(id: number): Promise<Column | undefined> {
    const [column] = await db.select().from(columns).where(eq(columns.id, id));
    return column || undefined;
  }
  
  async getColumnByKey(key: string): Promise<Column | undefined> {
    const [column] = await db.select().from(columns).where(eq(columns.key, key));
    return column || undefined;
  }
  
  async createColumn(insertColumn: InsertColumn): Promise<Column> {
    // Ensure dropdownOptions is properly typed
    const columnData: typeof insertColumn = {
      ...insertColumn,
      dropdownOptions: insertColumn.dropdownOptions || null,
      allowMultiple: insertColumn.allowMultiple || null,
      isVisible: insertColumn.isVisible !== undefined ? insertColumn.isVisible : true
    };
    
    const [column] = await db.insert(columns).values(columnData).returning();
    return column;
  }
  
  async updateColumn(id: number, columnData: Partial<InsertColumn>): Promise<Column | undefined> {
    const [updatedColumn] = await db.update(columns)
      .set(columnData)
      .where(eq(columns.id, id))
      .returning();
    return updatedColumn || undefined;
  }
  
  async deleteColumn(id: number): Promise<boolean> {
    const result = await db.delete(columns).where(eq(columns.id, id)).returning({ id: columns.id });
    return result.length > 0;
  }
  
  // Experience methods
  async getExperiences(): Promise<Experience[]> {
    const experiencesList = await db.select().from(experiences);
    
    // For each experience, fetch tags
    const result: Experience[] = [];
    for (const exp of experiencesList) {
      const tags = await this.getExperienceTags(exp.id);
      result.push({ ...exp, tags });
    }
    
    return result;
  }
  
  async getExperience(id: number): Promise<Experience | undefined> {
    const [experience] = await db.select().from(experiences).where(eq(experiences.id, id));
    
    if (!experience) {
      return undefined;
    }
    
    // Get tags for this experience
    const tags = await this.getExperienceTags(id);
    return { ...experience, tags };
  }
  
  async createExperience(insertExperience: InsertExperience): Promise<Experience> {
    // Ensure endDate is properly typed (can be null but not undefined)
    const experienceData = {
      ...insertExperience,
      endDate: insertExperience.endDate ?? null
    };
    
    const [experience] = await db.insert(experiences).values(experienceData).returning();
    return { ...experience, tags: [] };
  }
  
  async updateExperience(id: number, experienceData: Partial<InsertExperience>): Promise<Experience | undefined> {
    // Ensure endDate is properly typed for update operation
    const updateData = {
      ...experienceData,
      endDate: experienceData.endDate ?? undefined
    };
    
    const [updatedExperience] = await db.update(experiences)
      .set(updateData)
      .where(eq(experiences.id, id))
      .returning();
    
    if (!updatedExperience) {
      return undefined;
    }
    
    // Get tags for this experience
    const tags = await this.getExperienceTags(id);
    return { ...updatedExperience, tags };
  }
  
  async deleteExperience(id: number): Promise<boolean> {
    // This will cascade delete related experience_tags entries due to our FK constraint
    const result = await db.delete(experiences).where(eq(experiences.id, id)).returning({ id: experiences.id });
    return result.length > 0;
  }
  
  // Tag methods
  async getTags(): Promise<Tag[]> {
    return db.select().from(tags);
  }
  
  async getTag(id: number): Promise<Tag | undefined> {
    const [tag] = await db.select().from(tags).where(eq(tags.id, id));
    return tag || undefined;
  }
  
  async getTagByName(name: string): Promise<Tag | undefined> {
    const [tag] = await db.select().from(tags).where(eq(tags.name, name));
    return tag || undefined;
  }
  
  async createTag(insertTag: InsertTag): Promise<Tag> {
    // Check if the tag already exists
    const existingTag = await this.getTagByName(insertTag.name);
    if (existingTag) {
      return existingTag;
    }
    
    const [tag] = await db.insert(tags).values(insertTag).returning();
    return tag;
  }
  
  async deleteTag(id: number): Promise<boolean> {
    const result = await db.delete(tags).where(eq(tags.id, id)).returning({ id: tags.id });
    return result.length > 0;
  }
  
  // Experience-Tag methods
  async getExperienceTags(experienceId: number): Promise<Tag[]> {
    const tagLinks = await db.select({
      tag: tags
    })
    .from(experienceTags)
    .innerJoin(tags, eq(experienceTags.tagId, tags.id))
    .where(eq(experienceTags.experienceId, experienceId));
    
    return tagLinks.map(link => link.tag);
  }
  
  async addTagToExperience(experienceId: number, tagId: number): Promise<ExperienceTag> {
    // Check if the association already exists
    const [existing] = await db.select()
      .from(experienceTags)
      .where(and(
        eq(experienceTags.experienceId, experienceId),
        eq(experienceTags.tagId, tagId)
      ));
    
    if (existing) {
      return existing;
    }
    
    const [experienceTag] = await db.insert(experienceTags)
      .values({ experienceId, tagId })
      .returning();
    
    return experienceTag;
  }
  
  async removeTagFromExperience(experienceId: number, tagId: number): Promise<boolean> {
    const result = await db.delete(experienceTags)
      .where(and(
        eq(experienceTags.experienceId, experienceId),
        eq(experienceTags.tagId, tagId)
      ))
      .returning();
    
    return result.length > 0;
  }
  
  // Search methods
  async searchExperiences(params: { 
    startDate?: Date; 
    endDate?: Date; 
    tagIds?: number[];
    searchTerm?: string;
  }): Promise<Experience[]> {
    // We'll do this in two steps to avoid the type issues:
    // 1. First, get all experiences
    const allExperiences = await this.getExperiences();
    
    // 2. Then, filter them in memory, which is simpler and avoids type issues with Drizzle
    let filteredExperiences = allExperiences;
    
    // Filter by start date
    if (params.startDate) {
      const startDate = new Date(params.startDate);
      filteredExperiences = filteredExperiences.filter(exp => 
        new Date(exp.startDate) >= startDate
      );
    }
    
    // Filter by end date
    if (params.endDate) {
      const endDate = new Date(params.endDate);
      filteredExperiences = filteredExperiences.filter(exp => 
        !exp.endDate || new Date(exp.endDate) <= endDate
      );
    }
    
    // Filter by tags
    if (params.tagIds && params.tagIds.length > 0) {
      filteredExperiences = filteredExperiences.filter(exp => 
        exp.tags?.some(tag => params.tagIds!.includes(tag.id))
      );
    }
    
    // Filter by search term
    if (params.searchTerm) {
      const searchTerm = params.searchTerm.toLowerCase();
      filteredExperiences = filteredExperiences.filter(exp => {
        // Search in custom fields
        const customFieldsMatch = Object.entries(exp.customFields || {}).some(([_, value]) =>
          value !== null &&
          value !== undefined &&
          String(value).toLowerCase().includes(searchTerm)
        );
        
        // Search in tags
        const tagsMatch = exp.tags?.some(tag =>
          tag.name.toLowerCase().includes(searchTerm)
        );
        
        return customFieldsMatch || tagsMatch;
      });
    }
    
    return filteredExperiences;
  }
}

// Use the PostgreSQL storage implementation
export const storage = new DatabaseStorage();
