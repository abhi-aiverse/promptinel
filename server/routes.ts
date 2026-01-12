import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

// === HEURISTICS & REGEX ===

// Input Scanning Patterns (Prompt Injection, Overrides)
const INPUT_PATTERNS = [
  { regex: /ignore previous instructions/i, threat: "Prompt Injection: Ignore Instructions" },
  { regex: /act as/i, threat: "Prompt Injection: Persona Adoption" },
  { regex: /system prompt/i, threat: "Prompt Injection: System Prompt Leak/Override" },
  { regex: /you are now/i, threat: "Prompt Injection: Persona Override" },
  { regex: /ignore all/i, threat: "Prompt Injection: Ignore All" },
  { regex: /previous instructions/i, threat: "Prompt Injection: Context Leak" }
];

// Output Scanning Patterns (PII, Unsafe Content)
const OUTPUT_PATTERNS = [
  { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, threat: "PII: Email Address" },
  { regex: /(?:\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/, threat: "PII: Phone Number" }, // Basic US/Intl phone
  { regex: /\b\d{3}-\d{2}-\d{4}\b/, threat: "PII: SSN" },
  { regex: /(sk-[a-zA-Z0-9]{48}|Akia[a-zA-Z0-9]{16})/, threat: "Secret: API Key Leak" },
  { regex: /BEGIN PRIVATE KEY/, threat: "Secret: Private Key Leak" },
  { regex: /password\s*=\s*['"][^'"]+['"]/, threat: "Secret: Password Leak" }
];

function calculateRisk(text: string, patterns: { regex: RegExp, threat: string }[]): { score: number, threats: string[] } {
  const threats: string[] = [];
  let matchCount = 0;

  for (const pattern of patterns) {
    if (pattern.regex.test(text)) {
      threats.push(pattern.threat);
      matchCount++;
    }
  }

  // Heuristic scoring: 
  // 1 match = 0.8 (High risk immediately for PII/Injection)
  // 2+ matches = 1.0 (Critical)
  // 0 matches = 0
  let score = 0;
  if (matchCount >= 2) {
    score = 1.0;
  } else if (matchCount === 1) {
    score = 0.8; 
  }

  return { score, threats };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post(api.scan.input.path, async (req, res) => {
    try {
      const { text } = api.scan.input.input.parse(req.body);
      
      const { score, threats } = calculateRisk(text, INPUT_PATTERNS);
      const decision = score > 0.7 ? "block" : "allow";

      // Optional: Log to DB (Fire and forget or await)
      await storage.logScan({
        endpoint: "input",
        contentLength: text.length,
        riskScore: Math.round(score * 100), // Store as integer percent if needed, or just change schema to float
        decision,
        threats
      });

      res.json({
        risk_score: score,
        decision,
        threats
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post(api.scan.output.path, async (req, res) => {
    try {
      const { text } = api.scan.output.input.parse(req.body);

      const { score, threats } = calculateRisk(text, OUTPUT_PATTERNS);
      const decision = score > 0.7 ? "block" : "allow";

      await storage.logScan({
        endpoint: "output",
        contentLength: text.length,
        riskScore: Math.round(score * 100),
        decision,
        threats
      });

      res.json({
        risk_score: score,
        decision,
        threats
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  return httpServer;
}
