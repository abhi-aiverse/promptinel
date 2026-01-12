import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanResponse, scanRequestSchema } from "@shared/schema";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ScannerFormProps {
  title: string;
  description: string;
  placeholder: string;
  type: "input" | "output";
  onScan: (data: { text: string }) => Promise<ScanResponse>;
  isPending: boolean;
}

export function ScannerForm({
  placeholder,
  onScan,
  isPending,
}: ScannerFormProps) {
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [isJsonOpen, setIsJsonOpen] = useState(false);

  const form = useForm<z.infer<typeof scanRequestSchema>>({
    resolver: zodResolver(scanRequestSchema),
    defaultValues: {
      text: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof scanRequestSchema>) => {
    try {
      const scanResult = await onScan(data);
      setResult(scanResult);
    } catch (error) {
      console.error("Scan failed", error);
    }
  };

  const riskPercentage = result ? Math.round(result.risk_score * 100) : 0;
  const isBlocked = result?.decision === "block";

  return (
    <div className="space-y-12">
      {/* Input Section */}
      <div className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-stone-400 uppercase tracking-[0.2em]">Content to Analyze</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={placeholder}
                      className="min-h-[200px] border-stone-200 bg-white shadow-sm resize-none focus-visible:ring-primary/20 rounded-sm p-6 text-base text-stone-800 leading-relaxed"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              disabled={isPending} 
              className="px-10 h-14 text-xs font-bold uppercase tracking-[0.25em] bg-primary hover:bg-primary/90 transition-all rounded-sm shadow-md"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                  Running Security Scan...
                </>
              ) : (
                "Run Security Scan"
              )}
            </Button>
          </form>
        </Form>
      </div>

      {/* Results Section */}
      <AnimatePresence mode="wait">
        {result ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <Card className="border-stone-200 shadow-sm rounded-sm overflow-hidden bg-white">
              <CardHeader className="border-b border-stone-100 bg-stone-50/50 py-5 px-8">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500">Security Enforcement Decision</CardTitle>
              </CardHeader>
              <CardContent className="p-10">
                <div className="flex flex-col md:flex-row md:items-center gap-16">
                  <div className="space-y-3 min-w-[160px]">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">Status</span>
                    <div>
                      <Badge 
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-sm pointer-events-none shadow-sm ${
                          isBlocked ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-stone-50 text-stone-700 border border-stone-100'
                        }`}
                      >
                        {isBlocked ? "BLOCK" : "ALLOW"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex-1 space-y-6">
                    <div className="flex items-end justify-between">
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">Risk Intensity</span>
                        <div className={`text-5xl font-black tracking-tighter ${isBlocked ? 'text-orange-700' : 'text-stone-900'}`}>
                          {riskPercentage}%
                        </div>
                      </div>
                      <div className="text-[10px] font-black text-stone-300 uppercase tracking-[0.25em] mb-2">
                        THRESHOLD 70%
                      </div>
                    </div>
                    <Progress 
                      value={riskPercentage} 
                      className="h-1.5 bg-stone-100 [&>div]:bg-primary" 
                    />
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">
                      Automatic blocking triggered at ≥ 70%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">Policy Violations Detected</h3>
              <div className="flex flex-wrap gap-3">
                {result.threats.length > 0 ? (
                  result.threats.map((threat, idx) => (
                    <Badge 
                      key={idx} 
                      className="py-3 px-6 rounded-sm border border-stone-200 bg-white text-stone-600 font-bold text-[10px] uppercase tracking-[0.2em] shadow-sm hover:bg-stone-50"
                    >
                      {threat}
                    </Badge>
                  ))
                ) : (
                  <div className="flex items-center text-stone-400 text-xs font-bold uppercase tracking-[0.2em]">
                    <ShieldCheck className="w-5 h-5 mr-4 text-stone-300" />
                    Clean State: No Violations Identified
                  </div>
                )}
              </div>
            </div>

            <Collapsible
              open={isJsonOpen}
              onOpenChange={setIsJsonOpen}
              className="border border-stone-200 rounded-sm bg-white overflow-hidden shadow-sm"
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full flex items-center justify-between p-6 h-auto hover:bg-stone-50 rounded-none text-stone-500">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Technical Scan Output</span>
                  {isJsonOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-8 bg-stone-900 border-t border-stone-200">
                  <pre className="text-stone-400 text-xs font-mono leading-relaxed overflow-x-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </motion.div>
        ) : (
          <div className="py-32 flex items-center justify-center border border-stone-200 border-dashed rounded-sm bg-white/50">
            <div className="text-center space-y-6">
              <div className="text-[10px] font-bold text-stone-300 uppercase tracking-[0.3em]">Ready for Analysis</div>
              <p className="text-stone-400 text-xs font-bold uppercase tracking-[0.2em]">Awaiting Security Payload</p>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
