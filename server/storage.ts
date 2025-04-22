import { 
  User, InsertUser, 
  Column, InsertColumn, 
  Experience, InsertExperience, 
  Tag, InsertTag,
  ExperienceTag, InsertExperienceTag
} from "@shared/schema";

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

export const storage = new MemStorage();
