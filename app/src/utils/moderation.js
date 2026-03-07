/**
 * Content moderation utility for TravelPlanner.
 * Scans user-generated text for policy violations.
 */

const PROFANITY_LIST = [
  "fuck", "shit", "ass", "bitch", "damn", "bastard", "crap", "dick",
  "piss", "cock", "cunt", "whore", "slut", "nigger", "faggot", "retard",
];

const PHONE_RE = /(\+?\d{1,4}[\s\-.]?)?\(?\d{2,4}\)?[\s\-.]?\d{3,4}[\s\-.]?\d{2,4}/g;
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const URL_RE = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

/**
 * Scan text for moderation issues.
 * @param {string} text - The content to scan.
 * @returns {{ clean: boolean, issues: { type: string, match: string }[] }}
 */
export function scanContent(text) {
  if (!text || typeof text !== "string") {
    return { clean: true, issues: [] };
  }

  const issues = [];
  const lower = text.toLowerCase();

  // Profanity check
  for (const word of PROFANITY_LIST) {
    const re = new RegExp(`\\b${word}\\b`, "gi");
    const matches = text.match(re);
    if (matches) {
      for (const m of matches) {
        issues.push({ type: "profanity", match: m });
      }
    }
  }

  // Phone numbers
  const phones = text.match(PHONE_RE);
  if (phones) {
    for (const p of phones) {
      if (p.replace(/\D/g, "").length >= 7) {
        issues.push({ type: "phone", match: p.trim() });
      }
    }
  }

  // Email addresses
  const emails = text.match(EMAIL_RE);
  if (emails) {
    for (const e of emails) {
      issues.push({ type: "email", match: e });
    }
  }

  // URLs
  const urls = text.match(URL_RE);
  if (urls) {
    for (const u of urls) {
      issues.push({ type: "url", match: u });
    }
  }

  return {
    clean: issues.length === 0,
    issues,
  };
}
