import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    res.status(405).json({ success: false });
    return;
  }

  try {
    const {
      timestamp,
      decision_id,
      decision_hash,
      input,
      forma,
      exposicion,
      presion,
      posicion,
      ventana,
      name,
      email,
      company,
      email_domain,
    } = req.body || {};

    if (!name || !email) {
      res.status(400).json({ success: false });
      return;
    }

    const sheetId = process.env.AURORA_SHEETS_SHEET_ID;
    const tab = process.env.AURORA_SHEETS_TAB ?? "Sheet1";

    const saRaw =
      process.env.AURORA_SHEETS_SA_JSON ??
      (process.env.AURORA_SHEETS_SA_JSON_B64
        ? Buffer.from(process.env.AURORA_SHEETS_SA_JSON_B64, "base64").toString("utf8")
        : "{}");

    const serviceAccount = JSON.parse(saRaw);

    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({
      version: "v4",
      auth,
    });

    const row = [
      timestamp ?? new Date().toISOString(),
      decision_id ?? "",
      decision_hash ?? "",
      input ?? "",
      forma ?? "",
      exposicion ?? "",
      presion ?? "",
      posicion ?? "",
      ventana ?? "",
      name ?? "",
      email ?? "",
      company ?? "",
      email_domain ?? "",
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: \`\${tab}!A1\`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [row],
      },
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Aurora lead API error:", err);
    res.status(500).json({ success: false });
  }
}
