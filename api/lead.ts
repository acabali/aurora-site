import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Stage 0: method guard
  if (req.method !== "POST") {
    console.error("LEAD_API_BAD_METHOD", req.method);
    res.status(405).json({ success: false, error: "LEAD_API_BAD_METHOD" });
    return;
  }

  // Stage 1: body parsing
  let body: Record<string, unknown>;
  try {
    body = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) ?? {};
  } catch {
    console.error("LEAD_API_BAD_JSON");
    res.status(400).json({ success: false, error: "LEAD_API_BAD_JSON" });
    return;
  }

  const {
    timestamp, decision_id, decision_hash, input,
    forma, exposicion, presion, posicion, ventana,
    name, email, company, email_domain,
  } = body;

  if (!name || !email) {
    console.error("LEAD_API_MISSING_FIELDS");
    res.status(400).json({ success: false, error: "LEAD_API_MISSING_FIELDS" });
    return;
  }

  // Stage 2: service account resolution
  let sa: { client_email: string; private_key: string };
  try {
    let saRaw: string | undefined;

    if (process.env.AURORA_SHEETS_SA_JSON?.trim().startsWith("{")) {
      saRaw = process.env.AURORA_SHEETS_SA_JSON;
    } else if (process.env.AURORA_SHEETS_SA_JSON_B64) {
      saRaw = Buffer.from(process.env.AURORA_SHEETS_SA_JSON_B64, "base64").toString("utf8");
    }

    if (!saRaw) throw new Error("No service account env var found");

    const parsed = JSON.parse(saRaw) as Partial<{ client_email: string; private_key: string }>;

    if (!parsed.client_email || !parsed.private_key) {
      throw new Error(`SA missing fields: client_email=${!!parsed.client_email} private_key=${!!parsed.private_key}`);
    }

    sa = { client_email: parsed.client_email, private_key: parsed.private_key };
  } catch (err) {
    console.error("LEAD_API_BAD_SERVICE_ACCOUNT", (err as Error).message);
    res.status(500).json({ success: false, error: "LEAD_API_BAD_SERVICE_ACCOUNT" });
    return;
  }

  // Stage 3: sheet config validation
  const sheetId = process.env.AURORA_SHEETS_SHEET_ID;
  if (!sheetId) {
    console.error("LEAD_API_MISSING_SHEET_ID");
    res.status(500).json({ success: false, error: "LEAD_API_MISSING_SHEET_ID" });
    return;
  }
  const tab = process.env.AURORA_SHEETS_TAB ?? "Sheet1";
  const range = `${tab}!A1`;

  // Stage 4: Google Auth
  let auth: InstanceType<typeof google.auth.GoogleAuth>;
  try {
    auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: sa.client_email,
        private_key: sa.private_key.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  } catch (err) {
    console.error("LEAD_API_GOOGLE_AUTH_FAILED", (err as Error).message);
    res.status(500).json({ success: false, error: "LEAD_API_GOOGLE_AUTH_FAILED" });
    return;
  }

  // Stage 5: Sheets append
  try {
    const sheets = google.sheets({ version: "v4", auth });

    const row = [
      (timestamp as string) ?? new Date().toISOString(),
      (decision_id as string) ?? "",
      (decision_hash as string) ?? "",
      (input as string) ?? "",
      (forma as string) ?? "",
      (exposicion as string) ?? "",
      (presion as string) ?? "",
      (posicion as string) ?? "",
      (ventana as string) ?? "",
      String(name),
      String(email),
      (company as string) ?? "",
      (email_domain as string) ?? "",
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("LEAD_API_APPEND_FAILED", (err as Error).message);
    res.status(500).json({ success: false, error: "LEAD_API_APPEND_FAILED" });
  }
}
