import { z } from "zod";

// ---- Canonical taxonomies -------------------------------------------------
// Kept small and mutually exclusive on purpose: a real routing table can't
// resolve a ticket that landed in two queues at once.

export const CATEGORIES = [
  "billing",
  "technical_issue",
  "account_access",
  "shipping_logistics",
  "product_feedback",
  "cancellation_churn",
  "feature_request",
  "other",
] as const;

export const PRIORITIES = ["low", "medium", "high", "critical"] as const;

export const SENTIMENTS = ["positive", "neutral", "frustrated", "angry"] as const;

export const ROUTING_TEAMS: Record<(typeof CATEGORIES)[number], string> = {
  billing: "Billing Team",
  technical_issue: "Technical Support",
  account_access: "Account Security",
  shipping_logistics: "Logistics",
  product_feedback: "Product Team",
  cancellation_churn: "Retention / Customer Success",
  feature_request: "Feature Backlog",
  other: "General Support",
};

// ---- Output schema ----------------------------------------------------
export const TriageResultSchema = z.object({
  sentiment: z.enum(SENTIMENTS),
  sentiment_score: z.number().min(-1).max(1),
  category: z.enum(CATEGORIES),
  priority: z.enum(PRIORITIES),
  priority_score: z.number().min(0).max(100),
  escalate: z.preprocess((v) => (typeof v === "string" ? v === "true" : v), z.boolean()),
  urgency_reason: z.string().min(1).max(220),
  draft_response: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export type TriageResult = z.infer<typeof TriageResultSchema>;

// ---- Tool definition (OpenAI-compatible function-calling format) ---------
// Groq's API is OpenAI-compatible, so tools are shaped as
// { type: "function", function: { name, description, parameters } } rather
// than Anthropic's { name, description, input_schema }. Forcing tool_choice
// to this function means the model can't wrap the answer in prose or fence
// it in markdown — we get a typed arguments object back, not a string to
// regex out.
const TRIAGE_PARAMETERS = {
  type: "object" as const,
  properties: {
    sentiment: { type: "string", enum: SENTIMENTS as unknown as string[] },
    sentiment_score: {
      type: "number",
      description: "-1 (very negative) to 1 (very positive)",
    },
    category: { type: "string", enum: CATEGORIES as unknown as string[] },
    priority: { type: "string", enum: PRIORITIES as unknown as string[] },
    priority_score: {
      type: "number",
      description: "0-100, how urgently this needs human attention",
    },
    escalate: {
      type: ["boolean", "string"],
      description: "true if this should skip the queue and page a human now",
    },
    urgency_reason: {
      type: "string",
      description: "One sentence, max ~25 words, plain language.",
    },
    draft_response: {
      type: "string",
      description:
        "A short, ready-to-edit reply to the customer. Acknowledge the issue, no invented facts, no promises about timelines or refunds.",
    },
    confidence: {
      type: "number",
      description: "0-1, model's confidence in this classification",
    },
  },
  required: [
    "sentiment",
    "sentiment_score",
    "category",
    "priority",
    "priority_score",
    "escalate",
    "urgency_reason",
    "draft_response",
    "confidence",
  ],
};

export const triageTool = {
  type: "function" as const,
  function: {
    name: "submit_triage",
    description: "Submit the structured triage result for a single support/CRM ticket.",
    parameters: TRIAGE_PARAMETERS,
  },
};

export const SYSTEM_PROMPT = `You are a CRM ticket triage engine. You read one incoming customer message (and optionally a screenshot the customer attached) and classify it precisely.

Rules:
- Ground every judgment only in what the customer actually wrote or showed. Never invent order numbers, names, refund amounts, or promises.
- priority reflects business urgency, not just tone: an angry customer asking a cosmetic question is lower priority than a calm customer locked out of a paid account.
- escalate=true only for: safety issues, potential legal/PR risk, high-value account churn threats, or explicit self-harm mentions in the text (route to a human immediately, don't draft a response for these).
- draft_response should sound like a competent human support agent: brief, specific to what they said, no corporate filler like "we value your business".
- If a screenshot is attached, use it as evidence (error codes, UI state, order confirmations) alongside the text.
- Always call the submit_triage tool exactly once with your result. Do not respond in plain text.`;
