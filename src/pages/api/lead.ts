import type { APIRoute } from "astro";
import { google } from "googleapis";

const REQUIRED_FIELDS = [
  "session_id",
  "name",
  "company",
  "country",
  "industry",
  "email_domain",
  "source",
] as const;

const HEADER = [
  "ts",
  "session_id",
  "name",
  "company",
  "country",
  "industry",
  "email_domain",
  "source",
];

type LeadPayload = Record<(typeof REQUIRED_FIELDS)[number], string>;

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

async function ensureTabAndHeader(sheetId: string, tabName: string, sheets: ReturnType<typeof google.sheets>) {
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
    fields: "sheets.properties",
  });

  const sheetExists = (metadata.data.sheets ?? []).some(
    (s) => s.properties?.title?.trim().toLowerCase() === tabName.trim().toLowerCase()
  );

  if (!sheetExists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: tabName } } }],
      },
    });
  }

  const firstCol = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `'${tabName}'!A:A`,
    majorDimension: "ROWS",
  });

  const rows = firstCol.data.values ?? [];
  if (rows.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `'${tabName}'!A1:H1`,
      valueInputOption: "RAW",
      requestBody: { values: [HEADER] },
    });
  }
}

const postHandler: APIRoute = async ({ request }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const payload = REQUIRED_FIELDS.reduce(
    (acc, key) => ({ ...acc, [key]: normalizeString(body?.[key]) }),
    {} as LeadPayload
  );

  const missing = REQUIRED_FIELDS.find((field) => !payload[field]);
  if (missing) {
    return json({ ok: false, error: `missing_${missing}` }, 400);
  }

  const sheetId = normalizeString(import.meta.env.AURORA_SHEETS_SHEET_ID);
  const tabName = normalizeString(import.meta.env.AURORA_SHEETS_TAB);
  const rawServiceAccount = normalizeString(import.meta.env.AURORA_SHEETS_SA_JSON);

  if (!sheetId || !tabName || !rawServiceAccount) {
    console.error("lead_api_missing_env", {
      hasSheetId: Boolean(sheetId),
      hasTabName: Boolean(tabName),
      hasServiceAccount: Boolean(rawServiceAccount),
    });
    return json({ ok: false, error: "server_not_configured" }, 500);
  }

  try {
    const parsed = JSON.parse(rawServiceAccount) as { client_email?: string; private_key?: string };
    const auth = new google.auth.GoogleAuth({
      credentials: {
        ...parsed,
        private_key: (parsed.private_key ?? "").replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    await ensureTabAndHeader(sheetId, tabName, sheets);

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `'${tabName}'!A:H`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [
          [
            new Date().toISOString(),
            payload.session_id,
            payload.name,
            payload.company,
            payload.country,
            payload.industry,
            payload.email_domain,
            payload.source,
          ],
        ],
      },
    });

    return json({ ok: true }, 200);
  } catch (error) {
    console.error("lead_api_failed", error);
    return json({ ok: false, error: "internal_error" }, 500);
  }
};

const methodNotAllowed: APIRoute = async () => json({ ok: false, error: "method_not_allowed" }, 405);

export const POST = postHandler;
export const GET = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
export const OPTIONS = methodNotAllowed;
export const HEAD = methodNotAllowed;
