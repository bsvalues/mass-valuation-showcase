import { nanoid } from 'nanoid';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const db = await mysql.createConnection(process.env.DATABASE_URL);

const jobId = nanoid();
const userId = 1; // Default admin user

await db.execute(
  `INSERT INTO backgroundJobs (id, userid, jobtype, status, processed, succeeded, failed, total, countyname, parcellimit, createdat) 
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
  [jobId, userId, 'parcel_load', 'pending', 0, 0, 0, 0, 'Benton County', 10000]
);

console.log(`✅ Job created with ID: ${jobId}`);
await db.end();
