import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Audit log table for security scans
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  endpoint: text("endpoint").notNull(),
  contentLength: integer("content_length").notNull(),
  riskScore: integer("risk_score").notNull(), 
  decision: text("decision").notNull(),
  threats: jsonb("threats").$type<string[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// === API CONTRACT TYPES ===

export const scanRequestSchema = z.object({
  text: z.string().min(1, "Input text cannot be empty"),
});

export const scanResponseSchema = z.object({
  risk_score: z.number().min(0).max(1),
  decision: z.enum(["allow", "block"]),
  threats: z.array(z.string()),
});

export type ScanRequest = z.infer<typeof scanRequestSchema>;
export type ScanResponse = z.infer<typeof scanResponseSchema>;
