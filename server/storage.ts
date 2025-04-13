import { 
  users, User, InsertUser, 
  reports, Report, InsertReport,
  attachments, Attachment, InsertAttachment,
  messages, Message, InsertMessage,
  smartContractEvents, SmartContractEvent, InsertSmartContractEvent
} from "@shared/schema";

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
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private reports: Map<number, Report>;
  private attachments: Map<number, Attachment>;
  private messages: Map<number, Message>;
  private smartContractEvents: Map<number, SmartContractEvent>;
  
  private userIdCounter: number;
  private reportIdCounter: number;
  private attachmentIdCounter: number;
  private messageIdCounter: number;
  private eventIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.reports = new Map();
    this.attachments = new Map();
    this.messages = new Map();
    this.smartContractEvents = new Map();
    
    this.userIdCounter = 1;
    this.reportIdCounter = 1;
    this.attachmentIdCounter = 1;
    this.messageIdCounter = 1;
    this.eventIdCounter = 1;
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...userData, id };
    this.users.set(id, user);
    return user;
  }
  
  // Report operations
  async createReport(reportData: InsertReport): Promise<Report> {
    const id = this.reportIdCounter++;
    const reportId = `TN-${new Date().getFullYear()}-${id.toString().padStart(3, '0')}`;
    const report: Report = { 
      ...reportData, 
      id, 
      reportId, 
      status: 'New',
      submittedAt: new Date(),
      blockchainHash: `0x${Math.random().toString(16).slice(2)}`, // Simulated hash
      assignedInvestigatorId: null
    };
    this.reports.set(id, report);
    return report;
  }
  
  async getReport(id: number): Promise<Report | undefined> {
    return this.reports.get(id);
  }
  
  async getReportByReportId(reportId: string): Promise<Report | undefined> {
    return Array.from(this.reports.values()).find(report => report.reportId === reportId);
  }
  
  async getReportsByWhistleblower(whistleblowerId: number): Promise<Report[]> {
    return Array.from(this.reports.values())
      .filter(report => report.whistleblowerId === whistleblowerId);
  }
  
  async getReportsByInvestigator(investigatorId: number): Promise<Report[]> {
    return Array.from(this.reports.values())
      .filter(report => report.assignedInvestigatorId === investigatorId);
  }
  
  async getReportsByStatus(status: string): Promise<Report[]> {
    return Array.from(this.reports.values())
      .filter(report => report.status === status);
  }
  
  async getAllReports(): Promise<Report[]> {
    return Array.from(this.reports.values());
  }
  
  async updateReportStatus(id: number, status: string): Promise<Report | undefined> {
    const report = this.reports.get(id);
    if (report) {
      const updatedReport = { ...report, status };
      this.reports.set(id, updatedReport);
      return updatedReport;
    }
    return undefined;
  }
  
  async assignInvestigator(reportId: number, investigatorId: number): Promise<Report | undefined> {
    const report = this.reports.get(reportId);
    if (report) {
      const updatedReport = { 
        ...report, 
        assignedInvestigatorId: investigatorId,
        status: 'Assigned'
      };
      this.reports.set(reportId, updatedReport);
      return updatedReport;
    }
    return undefined;
  }
  
  // Attachment operations
  async createAttachment(attachmentData: InsertAttachment): Promise<Attachment> {
    const id = this.attachmentIdCounter++;
    const attachment: Attachment = { 
      ...attachmentData, 
      id, 
      uploadedAt: new Date() 
    };
    this.attachments.set(id, attachment);
    return attachment;
  }
  
  async getAttachmentsByReport(reportId: number): Promise<Attachment[]> {
    return Array.from(this.attachments.values())
      .filter(attachment => attachment.reportId === reportId);
  }
  
  // Message operations
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const message: Message = { 
      ...messageData, 
      id, 
      sentAt: new Date(),
      isRead: false
    };
    this.messages.set(id, message);
    return message;
  }
  
  async getMessagesByReport(reportId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.reportId === reportId)
      .sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
  }
  
  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (message) {
      const updatedMessage = { ...message, isRead: true };
      this.messages.set(id, updatedMessage);
      return updatedMessage;
    }
    return undefined;
  }
  
  async getUnreadMessageCount(userId: number): Promise<number> {
    return Array.from(this.messages.values())
      .filter(message => message.senderId !== userId && !message.isRead)
      .length;
  }
  
  // Smart contract event operations
  async createSmartContractEvent(eventData: InsertSmartContractEvent): Promise<SmartContractEvent> {
    const id = this.eventIdCounter++;
    const event: SmartContractEvent = { 
      ...eventData, 
      id, 
      timestamp: new Date() 
    };
    this.smartContractEvents.set(id, event);
    return event;
  }
  
  async getEventsByReport(reportId: number): Promise<SmartContractEvent[]> {
    return Array.from(this.smartContractEvents.values())
      .filter(event => event.reportId === reportId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}

// Export the storage instance
export const storage = new MemStorage();
