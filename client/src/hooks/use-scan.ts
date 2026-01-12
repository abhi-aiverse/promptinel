import { useMutation } from "@tanstack/react-query";
import { api, type ScanRequest, type ScanResponse } from "@shared/routes";

// Hook for Input Scanner (Prompt Injection detection)
export function useScanInput() {
  return useMutation({
    mutationFn: async (data: ScanRequest) => {
      // Validate request data locally first
      const validated = api.scan.input.input.parse(data);
      
      const res = await fetch(api.scan.input.path, {
        method: api.scan.input.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.scan.input.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to scan input");
      }

      // Validate response structure
      return api.scan.input.responses[200].parse(await res.json());
    },
  });
}

// Hook for Output Scanner (PII/Content Safety detection)
export function useScanOutput() {
  return useMutation({
    mutationFn: async (data: ScanRequest) => {
      const validated = api.scan.output.input.parse(data);

      const res = await fetch(api.scan.output.path, {
        method: api.scan.output.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.scan.output.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to scan output");
      }

      return api.scan.output.responses[200].parse(await res.json());
    },
  });
}
