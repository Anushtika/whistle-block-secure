import { 
  users, User, InsertUser, 
  reports, Report, InsertReport,
  attachments, Attachment, InsertAttachment,
  messages, Message, InsertMessage,
  smartContractEvents, SmartContractEvent, InsertSmartContractEvent
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";

// PostgreSQL session store
const PostgresSessionStore = connectPg(session);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Report operations
  createReport(report: InsertReport): Promise<Report>;
  getReport(id: number): Promise<Report | undefined>;
  getReportByReportId(reportId: string): Promise<Report | undefined>;
  getReportsByWhistleblower(whistleblowerId: number): Promise<Report[]>;
  getReportsByInvestigator(investigatorId: number): Promise<Report[]>;
  getReportsByStatus(status: string): Promise<Report[]>;
  getAllReports(): Promise<Report[]>;
  updateReportStatus(id: number, status: string): Promise<Report | undefined>;
  assignInvestigator(reportId: number, investigatorId: number): Promise<Report | undefined>;
  
  // Attachment operations
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  getAttachmentsByReport(reportId: number): Promise<Attachment[]>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByReport(reportId: number): Promise<Message[]>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
  getUnreadMessageCount(userId: number): Promise<number>;
  
  // Smart contract event operations
  createSmartContractEvent(event: InsertSmartContractEvent): Promise<SmartContractEvent>;
  getEventsByReport(reportId: number): Promise<SmartContractEvent[]>;
  
  // Session store
  sessionStore: session.Store;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    // Initialize session store
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  }
  
  // Report operations
  async createReport(reportData: InsertReport): Promise<Report> {
    const reportId = `TN-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const report = {
      ...reportData,
      reportId,
      status: 'New',
      submittedAt: new Date(),
      blockchainHash: `0x${Math.random().toString(16).slice(2)}`, // Simulated hash
      assignedInvestigatorId: null
    };
    
    const result = await db.insert(reports).values(report).returning();
    return result[0];
  }
  
  async getReport(id: number): Promise<Report | undefined> {
    const result = await db.select().from(reports).where(eq(reports.id, id));
    return result[0];
  }
  
  async getReportByReportId(reportId: string): Promise<Report | undefined> {
    const result = await db.select().from(reports).where(eq(reports.reportId, reportId));
    return result[0];
  }
  
  async getReportsByWhistleblower(whistleblowerId: number): Promise<Report[]> {
    return db.select().from(reports).where(eq(reports.whistleblowerId, whistleblowerId));
  }
  
  async getReportsByInvestigator(investigatorId: number): Promise<Report[]> {
    return db.select().from(reports).where(eq(reports.assignedInvestigatorId, investigatorId));
  }
  
  async getReportsByStatus(status: string): Promise<Report[]> {
    return db.select().from(reports).where(eq(reports.status, status));
  }
  
  async getAllReports(): Promise<Report[]> {
    return db.select().from(reports);
  }
  
  async updateReportStatus(id: number, status: string): Promise<Report | undefined> {
    const result = await db
      .update(reports)
      .set({ status })
      .where(eq(reports.id, id))
      .returning();
    return result[0];
  }
  
  async assignInvestigator(reportId: number, investigatorId: number): Promise<Report | undefined> {
    const result = await db
      .update(reports)
      .set({ 
        assignedInvestigatorId: investigatorId,
        status: 'Assigned'
      })
      .where(eq(reports.id, reportId))
      .returning();
    return result[0];
  }
  
  // Attachment operations
  async createAttachment(attachmentData: InsertAttachment): Promise<Attachment> {
    const result = await db
      .insert(attachments)
      .values({
        ...attachmentData,
        uploadedAt: new Date()
      })
      .returning();
    return result[0];
  }
  
  async getAttachmentsByReport(reportId: number): Promise<Attachment[]> {
    return db.select().from(attachments).where(eq(attachments.reportId, reportId));
  }
  
  // Message operations
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const result = await db
      .insert(messages)
      .values({
        ...messageData,
        sentAt: new Date(),
        isRead: false
      })
      .returning();
    return result[0];
  }
  
  async getMessagesByReport(reportId: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.reportId, reportId))
      .orderBy(messages.sentAt);
  }
  
  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const result = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id))
      .returning();
    return result[0];
  }
  
  async getUnreadMessageCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: messages })
      .from(messages)
      .where(
        and(
          eq(messages.isRead, false),
          eq(messages.senderId, userId)
        )
      );
    return result.length;
  }
  
  // Smart contract event operations
  async createSmartContractEvent(eventData: InsertSmartContractEvent): Promise<SmartContractEvent> {
    const result = await db
      .insert(smartContractEvents)
      .values({
        ...eventData,
        timestamp: new Date()
      })
      .returning();
    return result[0];
  }
  
  async getEventsByReport(reportId: number): Promise<SmartContractEvent[]> {
    return db
      .select()
      .from(smartContractEvents)
      .where(eq(smartContractEvents.reportId, reportId))
      .orderBy(smartContractEvents.timestamp);
  }
}

// Create and export the database storage instance
export const storage = new DatabaseStorage();