import { NextRequest, NextResponse } from "next/server";
import { runTriage, TriageError, type ModelKey } from "@/lib/groq";

export const runtime = "nodejs";
export const maxDuration = 60;

const STATUS_BY_CODE: Record<TriageError["code"], number> = {
  missing_api_key: 500,
  rate_limited: 429,
  overloaded: 503,
  timeout: 504,
  invalid_output: 502,
  upstream_error: 502,
  vision_unavailable: 503,
};

export async function POST(req: NextRequest) {
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "bad_request", message: "Invalid JSON body." } }, { status: 400 });
  }

  const ticketText = typeof payload?.ticketText === "string" ? payload.ticketText.trim() : "";
  if (!ticketText) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "ticketText is required." } },
      { status: 400 }
    );
  }
  if (ticketText.length > 6000) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "ticketText is too long (max 6000 characters)." } },
      { status: 400 }
    );
  }

  const model: ModelKey = payload?.model === "quality" ? "quality" : "fast";
  const imageBase64: string | undefined = typeof payload?.imageBase64 === "string" ? payload.imageBase64 : undefined;
  const imageMediaType: string | undefined =
    typeof payload?.imageMediaType === "string" ? payload.imageMediaType : undefined;

  try {
    const { result, modelUsed, fellBack, latencyMs } = await runTriage({
      ticketText,
      imageBase64,
      imageMediaType,
      model,
    });
    return NextResponse.json({ result, modelUsed, fellBack, latencyMs });
  } catch (e) {
    const err = e as TriageError;
    const status = STATUS_BY_CODE[err.code] ?? 500;
    return NextResponse.json({ error: { code: err.code, message: err.message } }, { status });
  }
}
