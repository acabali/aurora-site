import { readFileSync } from "node:fs";
import path from "node:path";

type HomeLocale = "es" | "en";

const canonPath = path.resolve(process.cwd(), "design/aurora-home-v2.html");

function extractSection(source: string, tagName: "style" | "script" | "body"): string {
  const match = source.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, "i"));
  if (!match) {
    throw new Error(`Canonical home is missing <${tagName}>.`);
  }

  return match[1]!.trim();
}

function extractTitle(source: string): string {
  const match = source.match(/<title>([\s\S]*?)<\/title>/i);
  return match?.[1]?.trim() || "Aurora";
}

function localizeCanonHtml(html: string, locale: HomeLocale): string {
  const homeHref = locale === "en" ? "/en" : "/";
  const demoHref = locale === "en" ? "/en/demo" : "/demo";
  const navActions = `
  <div class="nav-actions">
    <div class="nav-lang" aria-label="Language switcher">
      <a href="/"${locale === "es" ? ' aria-current="page"' : ""}>ES</a>
      <a href="/en"${locale === "en" ? ' aria-current="page"' : ""}>EN</a>
    </div>
    <a href="${demoHref}" class="nav-cta">Probá con tu decisión →</a>
  </div>`;

  return html
    .replace('<a href="/demo" class="nav-cta">Probá con tu decisión →</a>', navActions)
    .replace(/href="\/demo"/g, `href="${demoHref}"`)
    .replace('href="/" class="nav-logo"', `href="${homeHref}" class="nav-logo"`)
    .replace('href="/" class="foot-logo"', `href="${homeHref}" class="foot-logo"`)
    .replace('href="/">Inicio</a>', `href="${homeHref}">Inicio</a>`);
}

function getExtendedStyles(): string {
  return `
  .nav-actions {
    display: flex;
    align-items: center;
    gap: 18px;
  }

  .nav-lang {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding-right: 18px;
    border-right: 1px solid var(--line);
  }

  .nav-lang a {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(240,237,232,0.4);
    text-decoration: none;
  }

  .nav-lang a[aria-current="page"] {
    color: var(--paper);
  }

  @media (max-width: 900px) {
    .nav-actions {
      gap: 12px;
    }

    .nav-lang {
      gap: 8px;
      padding-right: 12px;
    }
  }
  `;
}

export function getCanonicalHomePage(locale: HomeLocale): {
  title: string;
  styles: string;
  bodyHtml: string;
  script: string;
} {
  const source = readFileSync(canonPath, "utf8");
  const title = extractTitle(source);
  const styles = `${extractSection(source, "style")}\n${getExtendedStyles()}`;
  const bodyHtml = localizeCanonHtml(extractSection(source, "body"), locale);
  const script = extractSection(source, "script");

  return {
    title,
    styles,
    bodyHtml,
    script,
  };
}
