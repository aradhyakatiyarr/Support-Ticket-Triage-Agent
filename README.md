# Ticket Triage Agent

AI-driven CRM support ticket triage. Paste a ticket (optionally with a screenshot), Qwen3.6 27B classifies it — sentiment, category, priority, routing team, draft reply — as a **forced tool call**, not a hopeful "please reply in JSON" prompt. Ships with a 30-ticket hand-labeled eval set so the accuracy claim is checkable, not asserted.

Runs entirely on **Groq's free tier** — no credit card, no paid API key needed.

## What it actually does

- **Live console** — paste any ticket text, optionally attach a screenshot (multimodal), get back a structured triage result in one API call.
- **Triage board** — every ticket you run lands in a Critical / High / Medium / Low lane the moment it's scored.
- **Eval dashboard** — runs 30 labeled tickets (`lib/sample-tickets.ts`) against the model and reports category/priority/sentiment accuracy, plus latency, so you have a real number for your resume instead of a guess.
- **Reasoning toggle** — "Fast" (non-thinking mode) vs "Thinking" (deep reasoning), same model weights either way — Qwen3.6 27B natively supports both.
- **Failure handling that isn't fake** — retries on 429/503 with backoff, falls back to a second model once for text-only tickets before actually failing, times out at 30s instead of hanging.

## Why Groq + Qwen3.6 27B

As of mid-2026 Groq's free tier runs on GPT-OSS and Qwen models rather than the older Llama lineup. `qwen/qwen3.6-27b` is currently the only model on Groq's free tier that does **vision + tool calling + JSON mode together**, which is exactly what a screenshot-capable ticket triage tool needs. `openai/gpt-oss-120b` is used as a text-only fallback when Qwen is rate-limited — it has no vision, so screenshot tickets don't fall back to it (you'll get a clear error instead of a silently wrong answer).

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · Zod · Groq API (OpenAI-compatible, tool-forced structured output)

## Run it locally

```bash
npm install
cp .env.example .env.local   # add your real GROQ_API_KEY
npm run dev
```

Get a free key at [console.groq.com](https://console.groq.com) — no credit card required. Open http://localhost:3000

## Deploy (browser only, no CLI needed)

1. **Get the code onto GitHub**
   Go to [github.com/new](https://github.com/new), create a new repository (keep it empty — no README/gitignore).
   On the new repo's page, click **"uploading an existing file"** and drag in every file/folder from this project (or use GitHub Desktop if you have it). Commit.

2. **Import into Vercel**
   Go to [vercel.com/new](https://vercel.com/new), choose **Import Git Repository**, pick the repo you just created. Framework preset should auto-detect as **Next.js** — leave the defaults.

3. **Add your API key**
   Before or right after the first deploy: **Project Settings → Environment Variables** → add
   `GROQ_API_KEY` = your free key from [console.groq.com](https://console.groq.com) → **Redeploy**.

4. Done — Vercel gives you a live `.vercel.app` URL. Put that link on your resume next to the project, not just the GitHub repo.

## Free tier limits, honestly

Groq's free tier for `qwen/qwen3.6-27b` is roughly **30 requests/min, 1,000 requests/day, 8,000 tokens/min** (org-wide, not per key). That's plenty for demoing the live console and running the 30-ticket eval a few times a day. If you run the eval back-to-back several times in a short window you may see some requests retry due to 429s — that's expected and the retry/backoff logic handles it, just takes a bit longer. This is worth mentioning in an interview: it's a real constraint you designed around, not something to hide.

## For the resume / interview

- **Problem framing:** support teams lose hours manually reading and routing tickets; misrouted or under-prioritized tickets are where churn starts.
- **The eval set is the point.** Anyone can demo one cherry-picked ticket. `lib/sample-tickets.ts` has 30 tickets with human-assigned ground truth — run the eval, screenshot the accuracy numbers, put them in your resume bullet instead of a placeholder "X%".
- **Talk about what happens when it breaks:** rate limits, overload, timeouts, malformed output, a fallback model that can't do vision — all handled explicitly in `lib/groq.ts`, not swept under the rug. This is the difference between a wrapper and a product.
- **Multimodal is real, not decorative:** the screenshot attachment goes to Qwen3.6 as an actual image block, used as evidence for error codes/UI state — not just a file upload that does nothing.
- **Cost/latency awareness:** the Fast/Thinking toggle is a live demo of the classic reasoning-depth-vs-latency tradeoff PMs are expected to reason about when picking model configs.
