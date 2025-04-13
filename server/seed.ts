import { db } from './db';
import { users } from '@shared/schema';

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