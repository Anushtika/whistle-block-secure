import { db } from './db';
import { users, reports, attachments, messages, smartContractEvents } from '@shared/schema';
import crypto from 'crypto';

async function seed() {
  console.log("Seeding database with initial data...");
  
  // Check if users already exist
  const existingUsers = await db.select().from(users);
  
  if (existingUsers.length === 0) {
    // Create demo users
    await db.insert(users).values([
      {
        username: "whistleblower",
        password: "password123",
        role: "whistleblower",
        publicKey: null,
        privateKeyEncrypted: null
      },
      {
        username: "investigator",
        password: "password123",
        role: "investigator",
        publicKey: null,
        privateKeyEncrypted: null
      }
    ]);
    
    console.log("Created demo users: whistleblower, investigator");
  } else {
    console.log(`${existingUsers.length} users already exist, skipping user creation`);
  }
  
  // Check if reports exist
  const existingReports = await db.select().from(reports);
  
  if (existingReports.length === 0) {
    // Get user IDs
    const usersData = await db.select().from(users);
    const whistleblowerId = usersData.find(u => u.role === "whistleblower")?.id;
    const investigatorId = usersData.find(u => u.role === "investigator")?.id;
    
    if (whistleblowerId && investigatorId) {
      // Create demo reports
      const demoReports = [
        {
          reportId: `TN-2025-001`,
          status: 'Assigned',
          submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          blockchainHash: `0x${crypto.randomBytes(32).toString('hex')}`,
          type: 'corruption',
          department: 'Public Works',
          location: 'Chennai',
          subject: 'Bribery in construction contracts',
          description: 'Observed officials demanding bribes from contractors to award public construction projects.',
          isAnonymous: true,
          allowCommunication: true,
          whistleblowerId: whistleblowerId,
          assignedInvestigatorId: investigatorId,
          encryptionKey: null
        },
        {
          reportId: `TN-2025-002`,
          status: 'Under Investigation',
          submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          blockchainHash: `0x${crypto.randomBytes(32).toString('hex')}`,
          type: 'fraud',
          department: 'Education',
          location: 'Coimbatore',
          subject: 'Manipulation of scholarship funds',
          description: 'Discovered evidence of scholarship funds being diverted to non-existent students.',
          isAnonymous: false,
          allowCommunication: true,
          whistleblowerId: whistleblowerId,
          assignedInvestigatorId: investigatorId,
          encryptionKey: null
        },
        {
          reportId: `TN-2025-003`,
          status: 'New',
          submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          blockchainHash: `0x${crypto.randomBytes(32).toString('hex')}`,
          type: 'misconduct',
          department: 'Police',
          location: 'Madurai',
          subject: 'Officer misconduct during investigation',
          description: 'Police officer threatened witnesses and tampered with evidence in an ongoing case.',
          isAnonymous: true,
          allowCommunication: true,
          whistleblowerId: whistleblowerId,
          assignedInvestigatorId: null,
          encryptionKey: null
        }
      ];
      
      for (const report of demoReports) {
        const [insertedReport] = await db.insert(reports).values(report).returning();
        
        // Create blockchain events for reports
        await db.insert(smartContractEvents).values({
          reportId: insertedReport.id,
          eventType: 'ReportCreated',
          data: { reportId: insertedReport.reportId },
          transactionHash: `0x${crypto.randomBytes(32).toString('hex')}`,
          blockNumber: Math.floor(Math.random() * 10000000),
          timestamp: insertedReport.submittedAt
        });
        
        // For assigned reports, create assignment event
        if (insertedReport.assignedInvestigatorId) {
          await db.insert(smartContractEvents).values({
            reportId: insertedReport.id,
            eventType: 'InvestigatorAssigned',
            data: { investigatorId: insertedReport.assignedInvestigatorId },
            transactionHash: `0x${crypto.randomBytes(32).toString('hex')}`,
            blockNumber: Math.floor(Math.random() * 10000000),
            timestamp: new Date(insertedReport.submittedAt.getTime() + 2 * 60 * 60 * 1000) // 2 hours after submission
          });
        }
        
        // For reports under investigation, create status update event
        if (insertedReport.status === 'Under Investigation') {
          await db.insert(smartContractEvents).values({
            reportId: insertedReport.id,
            eventType: 'StatusChanged',
            data: { status: 'Under Investigation' },
            transactionHash: `0x${crypto.randomBytes(32).toString('hex')}`,
            blockNumber: Math.floor(Math.random() * 10000000),
            timestamp: new Date(insertedReport.submittedAt.getTime() + 1 * 24 * 60 * 60 * 1000) // 1 day after submission
          });
        }
        
        // Create demo messages for reports with communication
        if (insertedReport.allowCommunication && insertedReport.status !== 'New') {
          // Investigator message
          await db.insert(messages).values({
            reportId: insertedReport.id,
            senderId: investigatorId,
            encryptedContent: "Thank you for your report. We have begun our investigation and will update you regularly.",
            sentAt: new Date(insertedReport.submittedAt.getTime() + 4 * 60 * 60 * 1000), // 4 hours after submission
            isRead: true,
            encryptionKey: null
          });
          
          // Whistleblower response
          await db.insert(messages).values({
            reportId: insertedReport.id,
            senderId: whistleblowerId,
            encryptedContent: "Thank you. I have additional information I can provide if needed.",
            sentAt: new Date(insertedReport.submittedAt.getTime() + 6 * 60 * 60 * 1000), // 6 hours after submission
            isRead: true,
            encryptionKey: null
          });
          
          // Another investigator message if under investigation
          if (insertedReport.status === 'Under Investigation') {
            await db.insert(messages).values({
              reportId: insertedReport.id,
              senderId: investigatorId,
              encryptedContent: "We've started reviewing the documents you've provided. Could you provide more details about the dates when these events occurred?",
              sentAt: new Date(insertedReport.submittedAt.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days after submission
              isRead: false,
              encryptionKey: null
            });
          }
        }
      }
      
      console.log("Created demo reports with events and messages");
    }
  } else {
    console.log(`${existingReports.length} reports already exist, skipping report creation`);
  }
  
  console.log("Database seeding complete!");
}

seed()
  .catch(e => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    // Close the pool after seeding
    try {
      const { pool } = await import('./db');
      await pool.end();
    } catch (err) {
      console.error("Error closing database connection:", err);
    }
  });