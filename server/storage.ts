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
    
    // Initialize with some demo users
    this.initializeDemoData();
  }
  
  private initializeDemoData() {
    // Create whistleblower user
    const whistleblower = {
      id: this.userIdCounter++,
      username: "whistleblower",
      password: "password123",
      role: "whistleblower",
      publicKey: "demo_public_key_1",
      privateKeyEncrypted: "demo_encrypted_private_key_1"
    };
    this.users.set(whistleblower.id, whistleblower);
    
    // Create investigator user
    const investigator = {
      id: this.userIdCounter++,
      username: "investigator",
      password: "password123",
      role: "investigator",
      publicKey: "demo_public_key_2",
      privateKeyEncrypted: "demo_encrypted_private_key_2"
    };
    this.users.set(investigator.id, investigator);
    
    // Create some example reports
    const report1 = {
      id: this.reportIdCounter++,
      reportId: `TN-2023-001`,
      type: "Corruption",
      department: "Public Works Department",
      location: "Chennai",
      subject: "Suspicious Contract Allocation",
      description: "I have observed that contracts are being awarded without proper tender process in the Public Works Department.",
      submittedAt: new Date(2023, 3, 15),
      status: "Under Investigation",
      isAnonymous: true,
      allowCommunication: true,
      whistleblowerId: whistleblower.id,
      assignedInvestigatorId: investigator.id,
      blockchainHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      encryptionKey: "demo_encryption_key_1"
    };
    this.reports.set(report1.id, report1);
    
    const report2 = {
      id: this.reportIdCounter++,
      reportId: `TN-2023-002`,
      type: "Fraud",
      department: "Tax Department",
      location: "Coimbatore",
      subject: "Tax Evasion Scheme",
      description: "I have evidence of a coordinated tax evasion scheme involving several businesses and officials.",
      submittedAt: new Date(2023, 5, 22),
      status: "New",
      isAnonymous: false,
      allowCommunication: true,
      whistleblowerId: whistleblower.id,
      assignedInvestigatorId: null,
      blockchainHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      encryptionKey: "demo_encryption_key_2"
    };
    this.reports.set(report2.id, report2);
    
    // Create sample attachments
    const attachment1 = {
      id: this.attachmentIdCounter++,
      reportId: report1.id,
      fileName: "evidence.pdf",
      fileType: "application/pdf",
      ipfsHash: "QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX",
      encryptedKey: "encrypted_key_for_attachment_1",
      uploadedAt: new Date(2023, 3, 16)
    };
    this.attachments.set(attachment1.id, attachment1);
    
    // Create sample messages
    const message1 = {
      id: this.messageIdCounter++,
      reportId: report1.id,
      senderId: whistleblower.id,
      encryptedContent: "I have additional evidence to share regarding this case.",
      encryptionKey: "message_encryption_key_1",
      sentAt: new Date(2023, 3, 18),
      isRead: true
    };
    this.messages.set(message1.id, message1);
    
    const message2 = {
      id: this.messageIdCounter++,
      reportId: report1.id,
      senderId: investigator.id,
      encryptedContent: "Thank you for your report. Could you provide more details about the parties involved?",
      encryptionKey: "message_encryption_key_2",
      sentAt: new Date(2023, 3, 19),
      isRead: true
    };
    this.messages.set(message2.id, message2);
    
    // Create sample blockchain events
    const event1 = {
      id: this.eventIdCounter++,
      reportId: report1.id,
      eventType: "ReportCreated",
      data: { reportId: report1.reportId },
      transactionHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      blockNumber: 12345678,
      timestamp: new Date(2023, 3, 15)
    };
    this.smartContractEvents.set(event1.id, event1);
    
    const event2 = {
      id: this.eventIdCounter++,
      reportId: report1.id,
      eventType: "StatusChanged",
      data: { status: "Under Investigation" },
      transactionHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      blockNumber: 12345680,
      timestamp: new Date(2023, 3, 17)
    };
    this.smartContractEvents.set(event2.id, event2);
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
