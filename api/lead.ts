// Aurora Demo Lead Capture — Vercel serverless function
// POST /api/lead — appends decision footprint + lead data to Google Sheets

import type { IncomingMessage, ServerResponse } from "node:http";
import { google } from "googleapis";

interface LeadPayload {
  decision_id: string;
  decision_hash: string;
  timestamp: string;
  input: string;
  forma: string;
  exposicion: string;
  presion: string;
  posicion: string;
  ventana: string;
  name: string;
  email: string;
  company?: string | null;
  email_domain: string;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ success: false }));
    return;
  }

  let payload: Partial<LeadPayload>;
  try {
    const raw = await readBody(req);
    if (!raw.trim()) throw new Error("Empty body");
    payload = JSON.parse(raw) as Partial<LeadPayload>;
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ success: false }));
    return;
  }

  const {
    decision_id, decision_hash, timestamp, input,
    forma, exposicion, presion, posicion, ventana,
    name, email, company,
  } = payload;

  if (!name?.trim() || !email?.trim()) {
    res.statusCode = 400;
    res.end(JSON.stringify({ success: false }));
    return;
  }

  if (!isValidEmail(email.trim())) {
    res.statusCode = 400;
    res.end(JSON.stringify({ success: false }));
    return;
  }

  const email_domain = email.trim().split("@")[1] ?? "";

  try {
    // Prefer AURORA_SHEETS_SA_JSON (working) over _B64 (contains only private key)
    const saRaw = process.env.AURORA_SHEETS_SA_JSON
      ?? (process.env.AURORA_SHEETS_SA_JSON_B64
        ? Buffer.from(process.env.AURORA_SHEETS_SA_JSON_B64, "base64").toString("utf8")
        : "{}");

    const sa = JSON.parse(saRaw) as { client_email?: string; private_key?: string };

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: sa.client_email ?? "",
        private_key:  (sa.private_key ?? "").replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const row = [
      timestamp ?? new Date().toISOString(),
      decision_id   ?? "",
      decision_hash ?? "",
      (input        ?? "").slice(0, 2000),
      forma         ?? "",
      exposicion    ?? "",
      presion       ?? "",
      posicion      ?? "",
      ventana       ?? "",
      name.trim().slice(0, 200),
      email.trim().toLowerCase().slice(0, 320),
      company?.trim().slice(0, 200) ?? "",
      email_domain,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.AURORA_SHEETS_SHEET_ID,
      range:         `${process.env.AURORA_SHEETS_TAB ?? "Sheet1"}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody:   { values: [row] },
    });

    res.statusCode = 200;
    res.end(JSON.stringify({ success: true }));
  } catch (err) {
    console.error("Sheets append error:", err);
    res.statusCode = 500;
    res.end(JSON.stringify({ success: false }));
  }
}
