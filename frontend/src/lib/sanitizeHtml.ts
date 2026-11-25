/**
 * Allowlist sanitizer for organizer-written rich text (event descriptions).
 *
 * Event descriptions are written by organizers and shown to every visitor and to admins
 * reviewing a submission, on the same origin as their signed-in session. Anything not on
 * the allowlist below is removed: scripts, event-handler attributes (onerror, onclick, ...),
 * javascript: and other non-web URLs, iframes, forms and SVG.
 *
 * Parsing uses DOMParser, which builds an inert document: nothing in it runs or loads.
 */

const ALLOWED_TAGS = new Set([
  "A", "B", "BLOCKQUOTE", "BR", "DIV", "EM", "FONT", "H1", "H2", "H3", "H4", "H5", "H6",
  "HR", "I", "IMG", "LI", "OL", "P", "S", "SPAN", "STRIKE", "STRONG", "SUB", "SUP", "U", "UL",
]);

/** Removed together with everything inside them. Any other unknown tag is unwrapped,
 *  keeping its (sanitized) children. */
const DROP_WITH_CONTENT = new Set([
  "BASE", "BUTTON", "EMBED", "FORM", "FRAME", "FRAMESET", "HEAD", "IFRAME", "INPUT", "LINK",
  "MATH", "META", "NOSCRIPT", "OBJECT", "SCRIPT", "SELECT", "STYLE", "SVG", "TEMPLATE",
  "TEXTAREA", "TITLE",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  A: new Set(["href", "class"]),
  IMG: new Set(["src", "alt", "width", "height"]),
  FONT: new Set(["color", "size", "face"]),
};

/** Text formatting the editor produces. Layout and positioning properties are dropped. */
const ALLOWED_STYLES = new Set([
  "color",
  "background-color",
  "font-size",
  "font-weight",
  "font-style",
  "text-decoration",
  "text-decoration-line",
  "text-align",
]);

const DATA_IMAGE = /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=]+$/i;

/** Returns a safe URL, or null. Bare domains ("example.com") become https links,
 *  matching how the editor and the event page already treat them. */
function safeUrl(value: string, kind: "link" | "image"): string | null {
  const url = value.trim();
  // Browsers ignore control characters and whitespace inside a scheme ("java\tscript:").
  const compact = url.replace(/[\u0000- \u007f]+/g, "");
  if (!compact) return null;
  if (kind === "image" && DATA_IMAGE.test(compact)) return compact;
  if (/^https?:\/\//i.test(compact)) return url;
  if (kind === "link" && /^(mailto|tel):/i.test(compact)) return url;
  if (compact.startsWith("/") && !compact.startsWith("//")) return url;
  // Any other explicit scheme (javascript:, data:, vbscript:, ...) is refused.
  if (/^[a-z][a-z0-9+.-]*:/i.test(compact) || compact.startsWith("//")) return null;
  return `https://${url}`;
}

function safeStyle(el: HTMLElement): string {
  const kept: string[] = [];
  for (let i = 0; i < el.style.length; i++) {
    const prop = el.style.item(i);
    const value = el.style.getPropertyValue(prop);
    if (ALLOWED_STYLES.has(prop) && !/url\s*\(|expression\s*\(/i.test(value))
      kept.push(`${prop}: ${value}`);
  }
  return kept.join("; ");
}

function cleanChildren(parent: Element) {
  for (const child of Array.from(parent.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) continue;
    if (child.nodeType !== Node.ELEMENT_NODE) {
      child.parentNode?.removeChild(child); // comments, processing instructions
      continue;
    }
    const el = child as HTMLElement;
    const tag = el.tagName.toUpperCase();
    if (!ALLOWED_TAGS.has(tag)) {
      if (DROP_WITH_CONTENT.has(tag)) {
        el.remove();
      } else {
        cleanChildren(el);
        el.replaceWith(...Array.from(el.childNodes));
      }
      continue;
    }

    const allowed = ALLOWED_ATTRS[tag];
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (name === "style") {
        const style = safeStyle(el);
        if (style) el.setAttribute("style", style);
        else el.removeAttribute("style");
      } else if (!allowed?.has(name)) {
        el.removeAttribute(attr.name);
      }
    }
    if (tag === "A") {
      const href = el.getAttribute("href");
      const safe = href === null ? null : safeUrl(href, "link");
      if (safe) el.setAttribute("href", safe);
      else el.removeAttribute("href");
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    }
    if (tag === "IMG") {
      const src = el.getAttribute("src");
      const safe = src === null ? null : safeUrl(src, "image");
      if (!safe) {
        el.remove();
        continue;
      }
      el.setAttribute("src", safe);
    }
    cleanChildren(el);
  }
}

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  if (typeof DOMParser === "undefined") return ""; // fail closed outside a browser
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  cleanChildren(doc.body);
  return doc.body.innerHTML;
}
