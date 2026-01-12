import { type AuditLog, type InsertAuditLog, auditLogs } from "@shared/schema";
import { db } from "./db";

export interface IStorage {
  logScan(log: InsertAuditLog): Promise<AuditLog>;
}

export class DatabaseStorage implements IStorage {
  async logScan(log: InsertAuditLog): Promise<AuditLog> {
    const [entry] = await db.insert(auditLogs).values(log).returning();
    return entry;
  }
}

export const storage = new DatabaseStorage();
