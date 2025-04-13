import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema for both whistleblowers and investigators
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'whistleblower' or 'investigator'
  publicKey: text("public_key"), // For encryption purposes
  privateKeyEncrypted: text("private_key_encrypted"), // Encrypted private key
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  publicKey: true,
  privateKeyEncrypted: true,
});

// Reports submitted by whistleblowers
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reportId: text("report_id").notNull().unique(), // TN-YYYY-XXX format
  type: text("type").notNull(), // Corruption, Fraud, etc.
  department: text("department").notNull(),
  location: text("location").notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  status: text("status").notNull(), // New, Assigned, Under Investigation, Closed
  isAnonymous: boolean("is_anonymous").notNull().default(true),
  allowCommunication: boolean("allow_communication").notNull().default(false),
  whistleblowerId: integer("whistleblower_id").references(() => users.id),
  assignedInvestigatorId: integer("assigned_investigator_id").references(() => users.id),
  blockchainHash: text("blockchain_hash"), // Hash on blockchain
  encryptionKey: text("encryption_key"), // Encrypted symmetric key for this report
});

export const insertReportSchema = createInsertSchema(reports).pick({
  type: true,
  department: true,
  location: true,
  subject: true,
  description: true,
  isAnonymous: true,
  allowCommunication: true,
  whistleblowerId: true,
  encryptionKey: true,
});

// Attachments for reports
export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => reports.id),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  ipfsHash: text("ipfs_hash").notNull(), // IPFS hash for off-chain storage
  encryptedKey: text("encrypted_key"), // Encrypted key for the file
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const insertAttachmentSchema = createInsertSchema(attachments).pick({
  reportId: true,
  fileName: true,
  fileType: true,
  ipfsHash: true,
  encryptedKey: true,
});

// Secure messages between whistleblowers and investigators
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => reports.id),
  senderId: integer("sender_id").references(() => users.id),
  encryptedContent: text("encrypted_content").notNull(),
  encryptionKey: text("encryption_key"), // Encrypted symmetric key
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  isRead: boolean("is_read").notNull().default(false),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  reportId: true,
  senderId: true,
  encryptedContent: true,
  encryptionKey: true,
});

// Smart contract events for report workflow
export const smartContractEvents = pgTable("smart_contract_events", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => reports.id),
  eventType: text("event_type").notNull(), // StatusChange, Assignment, etc.
  data: jsonb("data").notNull(),
  transactionHash: text("transaction_hash").notNull(),
  blockNumber: integer("block_number").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertSmartContractEventSchema = createInsertSchema(smartContractEvents).pick({
  reportId: true,
  eventType: true,
  data: true,
  transactionHash: true,
  blockNumber: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type SmartContractEvent = typeof smartContractEvents.$inferSelect;
export type InsertSmartContractEvent = z.infer<typeof insertSmartContractEventSchema>;
