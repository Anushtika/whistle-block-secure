import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage-db"; // Changed from in-memory to database storage
import { insertUserSchema, insertReportSchema, insertAttachmentSchema, insertMessageSchema, insertSmartContractEventSchema } from "@shared/schema";
import session from "express-session";
import { z } from "zod";
import crypto from "crypto";

declare module "express-session" {
  interface SessionData {
    userId: number;
    role: string;
  }
}

// Custom error class
class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "whistleblower-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 },
      store: storage.sessionStore
    })
  );

  // Auth middleware
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Role middleware
  const requireRole = (role: string) => (req: Request, res: Response, next: Function) => {
    if (!req.session.userId || req.session.role !== role) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/login", async (req, res, next) => {
    try {
      const { username, password, role } = req.body;
      
      if (!username || !password || !role) {
        throw new ApiError(400, "Username, password, and role are required");
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password || user.role !== role) {
        console.error(`Login failed for user: ${username}, role: ${role}`);
        throw new ApiError(401, "Invalid credentials");
      }
      
      req.session.userId = user.id;
      req.session.role = user.role;
      
      console.log(`User successfully logged in: ${username}, role: ${role}, id: ${user.id}`);
      
      res.json({ 
        id: user.id, 
        username: user.username, 
        role: user.role
      });
    } catch (err) {
      next(err);
    }
  });
  
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      
      req.session.userId = user.id;
      req.session.role = user.role;
      
      res.status(201).json({ 
        id: user.id, 
        username: user.username, 
        role: user.role
      });
    } catch (err) {
      next(err);
    }
  });
  
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  
  app.get("/api/auth/me", requireAuth, async (req, res, next) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      
      if (!user) {
        throw new ApiError(404, "User not found");
      }
      
      res.json({ 
        id: user.id, 
        username: user.username, 
        role: user.role
      });
    } catch (err) {
      next(err);
    }
  });
  
  // Report routes
  app.post("/api/reports", requireAuth, async (req, res, next) => {
    try {
      const validatedData = insertReportSchema.parse({
        ...req.body,
        whistleblowerId: req.session.role === 'whistleblower' ? req.session.userId : undefined
      });
      
      const report = await storage.createReport(validatedData);
      
      // Create blockchain event
      await storage.createSmartContractEvent({
        reportId: report.id,
        eventType: 'ReportCreated',
        data: { reportId: report.reportId },
        transactionHash: `0x${crypto.randomBytes(32).toString('hex')}`,
        blockNumber: Math.floor(Math.random() * 10000000)
      });
      
      res.status(201).json(report);
    } catch (err) {
      next(err);
    }
  });
  
  app.get("/api/reports", requireAuth, async (req, res, next) => {
    try {
      let reports;
      
      if (req.session.role === 'whistleblower') {
        reports = await storage.getReportsByWhistleblower(req.session.userId!);
      } else if (req.session.role === 'investigator') {
        if (req.query.status) {
          reports = await storage.getReportsByStatus(req.query.status as string);
        } else if (req.query.assigned === 'true') {
          reports = await storage.getReportsByInvestigator(req.session.userId!);
        } else {
          reports = await storage.getAllReports();
        }
      } else {
        throw new ApiError(403, "Forbidden");
      }
      
      res.json(reports);
    } catch (err) {
      next(err);
    }
  });
  
  app.get("/api/reports/:id", requireAuth, async (req, res, next) => {
    try {
      const report = await storage.getReport(parseInt(req.params.id));
      
      if (!report) {
        throw new ApiError(404, "Report not found");
      }
      
      // Check permissions
      if (req.session.role === 'whistleblower' && report.whistleblowerId !== req.session.userId) {
        throw new ApiError(403, "Forbidden");
      }
      
      res.json(report);
    } catch (err) {
      next(err);
    }
  });
  
  app.patch("/api/reports/:id/status", requireAuth, requireRole('investigator'), async (req, res, next) => {
    try {
      const { status } = req.body;
      
      if (!status) {
        throw new ApiError(400, "Status is required");
      }
      
      const updatedReport = await storage.updateReportStatus(parseInt(req.params.id), status);
      
      if (!updatedReport) {
        throw new ApiError(404, "Report not found");
      }
      
      // Create blockchain event
      await storage.createSmartContractEvent({
        reportId: updatedReport.id,
        eventType: 'StatusChanged',
        data: { status },
        transactionHash: `0x${crypto.randomBytes(32).toString('hex')}`,
        blockNumber: Math.floor(Math.random() * 10000000)
      });
      
      res.json(updatedReport);
    } catch (err) {
      next(err);
    }
  });
  
  app.patch("/api/reports/:id/assign", requireAuth, requireRole('investigator'), async (req, res, next) => {
    try {
      const { investigatorId } = req.body;
      
      if (!investigatorId) {
        throw new ApiError(400, "Investigator ID is required");
      }
      
      const updatedReport = await storage.assignInvestigator(parseInt(req.params.id), investigatorId);
      
      if (!updatedReport) {
        throw new ApiError(404, "Report not found");
      }
      
      // Create blockchain event
      await storage.createSmartContractEvent({
        reportId: updatedReport.id,
        eventType: 'InvestigatorAssigned',
        data: { investigatorId },
        transactionHash: `0x${crypto.randomBytes(32).toString('hex')}`,
        blockNumber: Math.floor(Math.random() * 10000000)
      });
      
      res.json(updatedReport);
    } catch (err) {
      next(err);
    }
  });
  
  // Attachment routes
  app.post("/api/attachments", requireAuth, async (req, res, next) => {
    try {
      const validatedData = insertAttachmentSchema.parse(req.body);
      const attachment = await storage.createAttachment(validatedData);
      
      res.status(201).json(attachment);
    } catch (err) {
      next(err);
    }
  });
  
  app.get("/api/reports/:reportId/attachments", requireAuth, async (req, res, next) => {
    try {
      const reportId = parseInt(req.params.reportId);
      const report = await storage.getReport(reportId);
      
      if (!report) {
        throw new ApiError(404, "Report not found");
      }
      
      // Check permissions
      if (req.session.role === 'whistleblower' && report.whistleblowerId !== req.session.userId) {
        throw new ApiError(403, "Forbidden");
      }
      
      const attachments = await storage.getAttachmentsByReport(reportId);
      res.json(attachments);
    } catch (err) {
      next(err);
    }
  });
  
  // Message routes
  app.post("/api/messages", requireAuth, async (req, res, next) => {
    try {
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.session.userId
      });
      
      // Check if user has access to this report
      const report = await storage.getReport(validatedData.reportId);
      
      if (!report) {
        throw new ApiError(404, "Report not found");
      }
      
      if (req.session.role === 'whistleblower' && report.whistleblowerId !== req.session.userId) {
        throw new ApiError(403, "Forbidden");
      }
      
      if (req.session.role === 'investigator' && report.assignedInvestigatorId !== req.session.userId) {
        throw new ApiError(403, "Forbidden");
      }
      
      const message = await storage.createMessage(validatedData);
      res.status(201).json(message);
    } catch (err) {
      next(err);
    }
  });
  
  app.get("/api/reports/:reportId/messages", requireAuth, async (req, res, next) => {
    try {
      const reportId = parseInt(req.params.reportId);
      const report = await storage.getReport(reportId);
      
      if (!report) {
        throw new ApiError(404, "Report not found");
      }
      
      // Check permissions
      if (req.session.role === 'whistleblower' && report.whistleblowerId !== req.session.userId) {
        throw new ApiError(403, "Forbidden");
      }
      
      if (req.session.role === 'investigator' && report.assignedInvestigatorId !== req.session.userId) {
        throw new ApiError(403, "Forbidden");
      }
      
      const messages = await storage.getMessagesByReport(reportId);
      res.json(messages);
    } catch (err) {
      next(err);
    }
  });
  
  app.patch("/api/messages/:id/read", requireAuth, async (req, res, next) => {
    try {
      const messageId = parseInt(req.params.id);
      const updatedMessage = await storage.markMessageAsRead(messageId);
      
      if (!updatedMessage) {
        throw new ApiError(404, "Message not found");
      }
      
      res.json(updatedMessage);
    } catch (err) {
      next(err);
    }
  });
  
  app.get("/api/messages/unread/count", requireAuth, async (req, res, next) => {
    try {
      const count = await storage.getUnreadMessageCount(req.session.userId!);
      res.json({ count });
    } catch (err) {
      next(err);
    }
  });
  
  // Smart contract event routes
  app.post("/api/blockchain/events", requireAuth, async (req, res, next) => {
    try {
      const validatedData = insertSmartContractEventSchema.parse(req.body);
      const event = await storage.createSmartContractEvent(validatedData);
      
      res.status(201).json(event);
    } catch (err) {
      next(err);
    }
  });
  
  app.get("/api/reports/:reportId/events", requireAuth, async (req, res, next) => {
    try {
      const reportId = parseInt(req.params.reportId);
      const report = await storage.getReport(reportId);
      
      if (!report) {
        throw new ApiError(404, "Report not found");
      }
      
      const events = await storage.getEventsByReport(reportId);
      res.json(events);
    } catch (err) {
      next(err);
    }
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}
