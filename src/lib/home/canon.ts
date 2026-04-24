import { readFileSync } from "node:fs";
import path from "node:path";

import {
  getDemoHref,
  getHomeHref,
  homeContent,
  type HomeContent,
  type Locale,
  type ProductSystem,
} from "./homeContent.ts";

type HomeLocale = Locale;

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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildReadout(c: HomeContent): string {
  const r = c.heroReadout;
  const rows = r.rows
    .map(
      (row) => `
      <div style="margin-bottom:18px;">
        <div style="font-family:var(--mono);font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(235,235,223,0.3);margin-bottom:6px;">${escapeHtml(row.label)}</div>
        <div style="font-family:var(--mono);font-size:12px;line-height:1.5;color:rgba(235,235,223,0.68);"><span style="color:#ebebdf;">${escapeHtml(row.value)}</span></div>
      </div>`,
    )
    .join("");
  return `<div class="fade-up" style="border-left:1px solid rgba(196,168,78,0.2);padding-left:24px;">
    <div style="font-family:var(--mono);font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(235,235,223,0.35);margin-bottom:22px;">${escapeHtml(r.eyebrow)}</div>
    ${rows}
  </div>`;
}

function yapasoItems(c: HomeContent): string {
  return c.yapaso.track
    .map(
      (item) => `
    <div class="yp-item fade-up">
      <div class="yi-status ${item.variant}">${escapeHtml(item.status)}</div>
      <div class="yi-industry">${escapeHtml(item.industry)}</div>
      <div class="yi-desc">${escapeHtml(item.desc)}</div>
    </div>`,
    )
    .join("");
}

function compItems(c: HomeContent): string {
  return c.complexity.items
    .map(
      (item) => `
    <div class="comp-item fade-up">
      <div class="ci-num">${escapeHtml(item.num)}</div>
      <div>
        <div class="ci-title">${escapeHtml(item.title)}</div>
        <div class="ci-body">${escapeHtml(item.body)}</div>
      </div>
    </div>`,
    )
    .join("");
}

function outputItems(c: HomeContent): string {
  return c.outputs.items
    .map((item, idx) => {
      const open = idx === 0;
      const bodyStyle = `max-height:${open ? "200px" : "0"};opacity:${open ? "1" : "0"};overflow:hidden;transition:max-height 0.35s ease, opacity 0.3s ease;`;
      const num = String(idx + 1).padStart(2, "0");
      return `
    <div class="qo fade-up" data-output-idx="${idx}" role="button" tabindex="0">
      <div class="qo-n">${num}</div>
      <div class="qo-title">${escapeHtml(item.title)}</div>
      <div class="qo-body" style="${bodyStyle}">${escapeHtml(item.body)}</div>
    </div>`;
    })
    .join("");
}

function renderLegacyOutputs(c: HomeContent): string {
  return `<section id="queHace" class="section">
  <div class="section-inner">
    <div class="eyebrow qh-intro fade-up">${escapeHtml(c.outputs.intro)}</div>
    <h2 class="qh-headline fade-up">${escapeHtml(c.outputs.headline)}</h2>
    <p class="qh-desc fade-up">${escapeHtml(c.outputs.desc)}</p>
    <div class="qh-outputs" id="qh-outputs">
      ${outputItems(c)}
    </div>
  </div>
</section>`;
}

function renderProductSystem(ps: ProductSystem): string {
  const navItems = ps.blocks
    .map(
      (b, i) => `
        <div class="ps-nav-item fade-up" data-ps-nav-item data-idx="${i}" role="button" tabindex="0">
          <span class="ps-nav-num">${escapeHtml(b.num)}</span>
          <span class="ps-nav-label">${escapeHtml(b.title)}</span>
        </div>`,
    )
    .join("");

  const blocks = ps.blocks
    .map(
      (b, i) => `
      <article class="ps-block fade-up" data-ps-block="${i}">
        <div class="ps-block-line"></div>
        <div class="ps-block-meta">
          <span class="ps-block-num">${escapeHtml(b.num)}</span>
          <span class="ps-block-signal">signal_key: ${escapeHtml(b.signalKey)}</span>
        </div>
        <h3 class="ps-block-title">${escapeHtml(b.title)}</h3>
        <p class="ps-block-tagline">${escapeHtml(b.tagline)}</p>
        <ul class="ps-block-points">
          ${b.points.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}
        </ul>
        <div class="ps-block-why">
          <div class="ps-block-why-eyebrow">${escapeHtml(b.whyEyebrow)}</div>
          <ul class="ps-block-why-list">
            ${b.whyPoints.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}
          </ul>
        </div>
      </article>`,
    )
    .join("");

  const topLines = ps.topLines
    .map((line) => `<span>${escapeHtml(line)}</span>`)
    .join("");

  return `<section id="productSystem" class="section">
  <div class="section-inner">
    <p class="ps-top fade-up">${topLines}</p>
    <div class="ps-grid">
      <aside class="ps-nav fade-up" data-ps-sidebar>
        <div class="ps-nav-eyebrow">${escapeHtml(ps.navEyebrow)}</div>
        <div class="ps-nav-list">${navItems}
        </div>
      </aside>
      <div class="ps-content">${blocks}
      </div>
    </div>
  </div>
</section>`;
}

function productSystemSection(c: HomeContent): string {
  if (c.productSystem) return renderProductSystem(c.productSystem);
  return renderLegacyOutputs(c);
}

function systemSection(c: HomeContent): string {
  const lines = c.systemDef;
  const parts = lines.map((text, i) => {
    const isLast = i === lines.length - 1;
    const color = isLast ? "#ebebdf" : "rgba(235,235,223,0.48)";
    const fw = isLast ? "400" : "300";
    const border = !isLast ? "border-bottom:1px solid rgba(235,235,223,0.06);" : "";
    return `<p class="fade-up" style="font-family:var(--mono);font-size:13px;color:${color};font-weight:${fw};margin:0;padding:18px 0;${border}">${escapeHtml(text)}</p>`;
  });
  return `<section style="padding:80px 52px;border-bottom:1px solid rgba(235,235,223,0.08);">
    <div style="max-width:680px;display:grid;">
      ${parts.join("")}
    </div>
  </section>`;
}

function invStairs(c: HomeContent): string {
  return c.inevitable.stairs
    .map(
      (s) => `
    <div class="is fade-up">
      <div class="is-year">${escapeHtml(s.year)}</div>
      <div>
        <div class="is-label">${escapeHtml(s.label)}</div>
        <div class="is-note">${escapeHtml(s.note)}</div>
      </div>
    </div>`,
    )
    .join("");
}

function footerNav(c: HomeContent, homeHref: string, demoHref: string): string {
  return c.footer.nav
    .map((link) => {
      const href = link.href === "home" ? homeHref : demoHref;
      return `<a href="${href}">${escapeHtml(link.label)}</a>`;
    })
    .join("");
}

function injectHomeBody(body: string, locale: HomeLocale): string {
  const c = homeContent[locale];
  const homeHref = getHomeHref(locale);
  const demoHref = getDemoHref(locale);
  const vars: Record<string, string> = {
    HOME_HREF: homeHref,
    DEMO_HREF: demoHref,
    NAV_CTA: escapeHtml(c.navCta),
    HERO_KICKER: escapeHtml(c.hero.kicker),
    HERO_H1_LINE1: escapeHtml(c.hero.h1Line1),
    HERO_H1_LINE2: escapeHtml(c.hero.h1Line2),
    HERO_STATEMENT: c.hero.statementHtml,
    HERO_CTA: escapeHtml(c.hero.cta),
    HERO_NOTE: escapeHtml(c.hero.note),
    HERO_READOUT: buildReadout(c),
    YAPASO_EYEBROW: escapeHtml(c.yapaso.eyebrow),
    YAPASO_HEADLINE: escapeHtml(c.yapaso.headline),
    YAPASO_ITEMS: yapasoItems(c),
    YAPASO_BOTTOM: escapeHtml(c.yapaso.bottom),
    YAPASO_VERDICT: escapeHtml(c.yapaso.verdict),
    YAPASO_COST: escapeHtml(c.yapaso.cost),
    COMP_EYEBROW: escapeHtml(c.complexity.eyebrow),
    COMP_HEADLINE: escapeHtml(c.complexity.headline),
    COMP_ITEMS: compItems(c),
    COMP_BOTTOM_BIG: escapeHtml(c.complexity.bottomBig),
    COMP_BOTTOM_ACCENT: escapeHtml(c.complexity.bottomAccent),
    PRODUCT_SYSTEM_SECTION: productSystemSection(c),
    SYSTEM_SECTION: systemSection(c),
    INV_EYEBROW: escapeHtml(c.inevitable.eyebrow),
    INV_HEADLINE: escapeHtml(c.inevitable.headline),
    INV_LEAD: escapeHtml(c.inevitable.lead),
    INV_CODA: escapeHtml(c.inevitable.coda),
    INV_STAIRS: invStairs(c),
    GW_KICKER: escapeHtml(c.gateway.kicker),
    GW_H1: escapeHtml(c.gateway.h1),
    GW_SUB: escapeHtml(c.gateway.sub),
    GW_CTA: escapeHtml(c.gateway.cta),
    GW_ASIDE: escapeHtml(c.gateway.aside),
    CONTACT_PLACEHOLDER: escapeHtml(c.contact.placeholder),
    CONTACT_EMAIL_PLACEHOLDER: escapeHtml(c.contact.emailPlaceholder),
    FOOTER_NAV: footerNav(c, homeHref, demoHref),
    FOOTER_COPYRIGHT: escapeHtml(c.footer.copyright),
  };

  let out = body;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v);
  }

  if (/\{\{[A-Z0-9_]+\}\}/.test(out)) {
    const leftover = out.match(/\{\{[A-Z0-9_]+\}\}/g);
    throw new Error(`Canonical home has unreplaced placeholders: ${leftover?.join(", ")}`);
  }

  return out;
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
    color: rgba(235,235,223,0.4);
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
  const raw = readFileSync(canonPath, "utf8");
  const c = homeContent[locale];
  const source = raw.replace(/\{\{TITLE\}\}/g, escapeHtml(c.title));
  const title = extractTitle(source);
  const styles = `${extractSection(source, "style")}\n${getExtendedStyles()}`;
  const bodyHtml = injectHomeBody(extractSection(source, "body"), locale);
  const script = extractSection(source, "script");

  return {
    title,
    styles,
    bodyHtml,
    script,
  };
}
