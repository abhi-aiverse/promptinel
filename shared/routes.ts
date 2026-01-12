import { z } from 'zod';
import { scanRequestSchema, scanResponseSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  scan: {
    input: {
      method: 'POST' as const,
      path: '/api/scan/input',
      input: scanRequestSchema,
      responses: {
        200: scanResponseSchema,
        400: errorSchemas.validation,
      },
    },
    output: {
      method: 'POST' as const,
      path: '/api/scan/output',
      input: scanRequestSchema,
      responses: {
        200: scanResponseSchema,
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
