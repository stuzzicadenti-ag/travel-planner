/**
 * TravelPlanner validation & security tests.
 * Uses Node.js built-in test runner (node:test) and assertions (node:assert).
 *
 * Run: node --test tests/validation.test.js
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = join(__dirname, "..", "src");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read a source file as string */
function readSrc(...segments) {
  return readFileSync(join(SRC, ...segments), "utf-8");
}

/** Recursively collect all .ejs files under a directory */
function collectEjs(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectEjs(full));
    } else if (entry.name.endsWith(".ejs")) {
      results.push(full);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// 1. Route security: auth-required routes redirect without token
// ---------------------------------------------------------------------------
describe("Route security - auth guards", () => {
  const tripsRoute = readSrc("routes/trips.js");
  const profileRoute = readSrc("routes/profile.js");
  const adminRoute = readSrc("routes/admin.js");

  it("trips route has onRequest auth guard", () => {
    assert.match(tripsRoute, /addHook\s*\(\s*["']onRequest["']/);
    assert.match(tripsRoute, /if\s*\(\s*!req\.user\s*\)/);
    assert.match(tripsRoute, /redirect.*\/auth\/login/);
  });

  it("profile route has onRequest auth guard", () => {
    assert.match(profileRoute, /addHook\s*\(\s*["']onRequest["']/);
    assert.match(profileRoute, /if\s*\(\s*!req\.user\s*\)/);
    assert.match(profileRoute, /redirect.*\/auth\/login/);
  });

  it("review POST requires authentication", () => {
    const itinRoute = readSrc("routes/itineraries.js");
    // The review handler checks req.user and redirects to login
    assert.match(itinRoute, /post.*\/:id\/review/);
    assert.match(itinRoute, /if\s*\(\s*!req\.user\s*\)\s*return\s+reply\.redirect\(\s*["']\/auth\/login["']\)/);
  });

  it("save trip POST requires authentication", () => {
    const itinRoute = readSrc("routes/itineraries.js");
    assert.match(itinRoute, /post.*\/:id\/save/);
    assert.match(itinRoute, /if\s*\(\s*!req\.user\s*\)\s*return\s+reply\.redirect\(\s*["']\/auth\/login["']\)/);
  });
});

// ---------------------------------------------------------------------------
// 2. Input validation: search truncated to 200 chars, country to 3, tags to 50
// ---------------------------------------------------------------------------
describe("Input validation limits", () => {
  const itinRoute = readSrc("routes/itineraries.js");

  it("search input is truncated to 200 characters", () => {
    assert.match(itinRoute, /substring\s*\(\s*0\s*,\s*200\s*\)/);
  });

  it("country code is validated to max 3 characters", () => {
    assert.match(itinRoute, /String\(country\)\.length\s*<=\s*3/);
  });

  it("tag filter is validated to max 50 characters", () => {
    assert.match(itinRoute, /String\(tag\)\.length\s*<=\s*50/);
  });

  it("review comment is truncated to 1000 characters", () => {
    assert.match(itinRoute, /substring\s*\(\s*0\s*,\s*1000\s*\)/);
  });

  it("mood filter only accepts valid values", () => {
    assert.match(itinRoute, /VALID_MOODS\.includes\(mood\)/);
  });

  it("season filter only accepts valid values", () => {
    assert.match(itinRoute, /VALID_SEASONS\.includes\(season\)/);
  });

  it("auth registration validates email format", () => {
    const authRoute = readSrc("routes/auth.js");
    assert.match(authRoute, /EMAIL_RE\.test\(email\)/);
  });

  it("auth registration enforces password length 8-1000", () => {
    const authRoute = readSrc("routes/auth.js");
    assert.match(authRoute, /password\.length\s*<\s*8/);
    assert.match(authRoute, /password\.length\s*>\s*1000/);
  });

  it("auth registration enforces name/email max 255 chars", () => {
    const authRoute = readSrc("routes/auth.js");
    assert.match(authRoute, /name\.length\s*>\s*255/);
    assert.match(authRoute, /email\.length\s*>\s*255/);
  });
});

// ---------------------------------------------------------------------------
// 3. Rate limiting: rate limiter factory works correctly
// ---------------------------------------------------------------------------
describe("Rate limiting", () => {
  const server = readSrc("server.js");

  it("createRateLimiter function is defined", () => {
    assert.match(server, /function\s+createRateLimiter\s*\(/);
  });

  it("rate limiter returns false and sends 429 when exceeded", () => {
    assert.match(server, /reply\.code\(429\)/);
    assert.match(server, /return\s+false/);
  });

  it("rate limiter returns true when within limit", () => {
    assert.match(server, /return\s+true/);
  });

  it("auth rate limiter is configured (10 attempts per 15 min)", () => {
    assert.match(server, /checkAuthRateLimit.*createRateLimiter\s*\(\s*15\s*\*\s*60\s*\*\s*1000\s*,\s*10\s*\)/);
  });

  it("review rate limiter is configured (5 per 15 min)", () => {
    assert.match(server, /checkReviewRateLimit.*createRateLimiter\s*\(\s*15\s*\*\s*60\s*\*\s*1000\s*,\s*5\s*\)/);
  });

  it("write rate limiter is configured (20 per 15 min)", () => {
    assert.match(server, /checkWriteRateLimit.*createRateLimiter\s*\(\s*15\s*\*\s*60\s*\*\s*1000\s*,\s*20\s*\)/);
  });

  it("rate limiter cleans up expired entries", () => {
    assert.match(server, /setInterval/);
    assert.match(server, /attempts\.delete/);
  });
});

// ---------------------------------------------------------------------------
// 4. Security headers: onSend hook sets HSTS, CSP, removes X-Powered-By
// ---------------------------------------------------------------------------
describe("Security headers", () => {
  const server = readSrc("server.js");

  it("sets Strict-Transport-Security header", () => {
    assert.match(server, /Strict-Transport-Security/);
    assert.match(server, /max-age=31536000/);
    assert.match(server, /includeSubDomains/);
  });

  it("sets X-Content-Type-Options: nosniff", () => {
    assert.match(server, /X-Content-Type-Options.*nosniff/);
  });

  it("sets X-Frame-Options: DENY", () => {
    assert.match(server, /X-Frame-Options.*DENY/);
  });

  it("disables X-XSS-Protection (modern best practice)", () => {
    assert.match(server, /X-XSS-Protection.*0/);
  });

  it("sets Referrer-Policy", () => {
    assert.match(server, /Referrer-Policy.*strict-origin-when-cross-origin/);
  });

  it("sets Permissions-Policy", () => {
    assert.match(server, /Permissions-Policy/);
    assert.match(server, /camera=\(\)/);
    assert.match(server, /microphone=\(\)/);
    assert.match(server, /geolocation=\(\)/);
  });

  it("sets Content-Security-Policy", () => {
    assert.match(server, /Content-Security-Policy/);
    assert.match(server, /default-src\s+'self'/);
    assert.match(server, /script-src\s+'self'/);
  });

  it("removes X-Powered-By header", () => {
    assert.match(server, /removeHeader\s*\(\s*['"]X-Powered-By['"]\s*\)/);
  });

  it("headers are set in onSend hook (applies to all responses)", () => {
    assert.match(server, /addHook\s*\(\s*['"]onSend['"]/);
  });
});

// ---------------------------------------------------------------------------
// 5. Admin authorization: admin routes reject non-admin users
// ---------------------------------------------------------------------------
describe("Admin authorization", () => {
  const adminRoute = readSrc("routes/admin.js");

  it("admin routes have onRequest hook for role check", () => {
    assert.match(adminRoute, /addHook\s*\(\s*["']onRequest["']/);
  });

  it("admin routes check for admin or owner role", () => {
    assert.match(adminRoute, /req\.user\.role\s*!==\s*["']admin["']/);
    assert.match(adminRoute, /req\.user\.role\s*!==\s*["']owner["']/);
  });

  it("admin routes return 403 for non-admin users", () => {
    assert.match(adminRoute, /reply\.code\(403\)/);
    assert.match(adminRoute, /Forbidden/);
  });

  it("admin routes reject unauthenticated users (!req.user)", () => {
    assert.match(adminRoute, /!req\.user/);
  });

  it("only owners can assign owner role", () => {
    assert.match(adminRoute, /role\s*===\s*["']owner["']\s*&&\s*req\.user\.role\s*!==\s*["']owner["']/);
  });

  it("role changes are restricted to valid roles", () => {
    assert.match(adminRoute, /validRoles/);
    assert.match(adminRoute, /\["user",\s*"admin",\s*"owner"\]/);
  });

  it("admin actions are logged", () => {
    assert.match(adminRoute, /logAction/);
    // logAction uses parameterized query
    assert.match(adminRoute, /INSERT INTO admin_log.*\$1.*\$2.*\$3.*\$4.*\$5/);
  });
});

// ---------------------------------------------------------------------------
// 6. SQL safety: Drizzle parameterizes user input, raw queries use $N
// ---------------------------------------------------------------------------
describe("SQL safety - parameterized queries", () => {
  it("admin route uses parameterized raw queries ($1, $2, ...)", () => {
    const admin = readSrc("routes/admin.js");
    // All pool.query calls with user input use $N params
    const poolCalls = admin.match(/pool\.query\s*\(/g);
    assert.ok(poolCalls && poolCalls.length > 5, "admin route uses multiple pool.query calls");
    // All dynamic SQL uses $N parameter placeholders (built via idx counter), never raw user values
    // The admin search builds $${idx} which produces $1, $2 etc. — this is safe parameterization.
    assert.match(admin, /params\.push/, "admin queries push values to params array for parameterized binding");
    // Verify no direct user input concatenation in SQL (e.g., `... ${search} ...`)
    // $${idx} is safe (builds $1, $2), so we exclude 'idx' from the check
    const lines = admin.split("\n");
    const unsafeLines = lines.filter(line => {
      if (!line.includes("pool.query") && !line.includes("conditions.push")) return false;
      // Match ${...} but exclude ${idx} which is the safe parameter counter
      const interpolations = line.match(/\$\{(?!idx\})[^}]+\}/g);
      if (!interpolations) return false;
      // Filter out the safe `$${idx}` pattern used for building $1, $2, etc.
      return interpolations.some(m => !/^\$\{idx\}$/.test(m));
    });
    assert.deepStrictEqual(unsafeLines, [], "no unsafe string interpolation in admin SQL");
  });

  it("itineraries route uses Drizzle ORM for main queries", () => {
    const itin = readSrc("routes/itineraries.js");
    assert.match(itin, /import.*from\s+["']drizzle-orm["']/);
    assert.match(itin, /db\.select\(\)/);
  });

  it("itineraries route uses parameterized pool queries for reviews", () => {
    const itin = readSrc("routes/itineraries.js");
    // Review insert uses $1-$4
    assert.match(itin, /INSERT INTO reviews.*\$1.*\$2.*\$3.*\$4/);
  });

  it("newsletter uses parameterized query for email insert", () => {
    const newsletter = readSrc("routes/newsletter.js");
    assert.match(newsletter, /pool\.query\s*\(\s*\n?\s*["']INSERT INTO newsletter_subscribers.*\$1/);
  });

  it("community route uses no user-controlled string interpolation in SQL", () => {
    const community = readSrc("routes/community.js");
    const poolCalls = community.match(/pool\.query\s*\(\s*`/g);
    // All queries are static (no ${ } with user input)
    if (poolCalls) {
      const dynamicInSQL = community.match(/pool\.query\s*\(\s*`[^`]*\$\{[^}]+\}[^`]*`/g);
      assert.ok(!dynamicInSQL, "community queries have no dynamic interpolation");
    }
  });

  it("admin user search uses parameterized ILIKE", () => {
    const admin = readSrc("routes/admin.js");
    // search uses $N parameter, not string interpolation
    assert.match(admin, /ILIKE\s+\$\$\{idx\}/);
  });
});

// ---------------------------------------------------------------------------
// 7. Template safety: no unescaped user content
// ---------------------------------------------------------------------------
describe("Template safety - EJS escaping", () => {
  const viewsDir = join(SRC, "views");
  const ejsFiles = collectEjs(viewsDir);

  it("found EJS template files", () => {
    assert.ok(ejsFiles.length > 0, `found ${ejsFiles.length} EJS files`);
  });

  it("no unescaped user content in templates (<%- %> only for includes/i18n)", () => {
    const unsafePatterns = [];

    for (const file of ejsFiles) {
      const content = readFileSync(file, "utf-8");
      const shortPath = file.replace(viewsDir, "");

      // Find all <%- %> usages
      const unescaped = content.match(/<%-(.*?)%>/gs) || [];

      for (const tag of unescaped) {
        const inner = tag.replace(/^<%-\s*/, "").replace(/\s*%>$/, "").trim();

        // Safe: include() calls
        if (inner.startsWith("include(") || inner.startsWith("include (")) continue;

        // Safe: i18n t() calls (translation strings, not user input)
        if (/^(typeof\s+t\s*!==\s*['"]undefined['"])?\s*\??\s*t\s*\(/.test(inner)) continue;

        // Safe: hardcoded HTML entities (&#NNN;) not user data
        if (/^['"]&#\d+;['"]\.repeat\(/.test(inner)) continue;
        if (/^\S+\s*(<=|<|>|>=|===|!==)\s*\d+\s*\?\s*'&#\d+;'\s*:\s*'&#\d+;'$/.test(inner)) continue;
        if (/\|\|\s*'&#\d+;'/.test(inner) && !/request|user|body|query|params/.test(inner)) continue;

        // Anything else using <%- %> is suspect
        unsafePatterns.push(`${shortPath}: <%- ${inner} %>`);
      }
    }

    assert.deepStrictEqual(unsafePatterns, [], `Found unescaped non-include/i18n content:\n${unsafePatterns.join("\n")}`);
  });

  it("user-generated fields use escaped output (<%= %>)", () => {
    // Check that user.name, rev.comment, etc. use <%=
    const detailTemplate = readFileSync(join(viewsDir, "itineraries", "detail.ejs"), "utf-8");

    // Review comments must be escaped
    assert.match(detailTemplate, /<%=\s*rev\.comment\s*%>/);
    // User names must be escaped
    assert.match(detailTemplate, /<%=\s*rev\.user_name\s*%>/);
  });
});

// ---------------------------------------------------------------------------
// 8. Newsletter rate limiting
// ---------------------------------------------------------------------------
describe("Newsletter rate limiting", () => {
  const newsletter = readSrc("routes/newsletter.js");

  it("newsletter subscribe uses write rate limiter", () => {
    assert.match(newsletter, /checkWriteRateLimit/);
  });

  it("newsletter validates email format", () => {
    assert.match(newsletter, /EMAIL_RE\.test\(email\)/);
  });

  it("newsletter validates email length", () => {
    assert.match(newsletter, /email\.length\s*>\s*255/);
  });

  it("newsletter normalizes email to lowercase", () => {
    assert.match(newsletter, /email\.toLowerCase\(\)/);
  });

  it("newsletter uses ON CONFLICT DO NOTHING for duplicates", () => {
    assert.match(newsletter, /ON CONFLICT.*DO NOTHING/i);
  });

  it("newsletter redirects back to referer pathname (not full URL)", () => {
    assert.match(newsletter, /url\.pathname\s*\+\s*url\.search/);
  });
});

// ---------------------------------------------------------------------------
// 9. Cookie security settings
// ---------------------------------------------------------------------------
describe("Cookie security settings", () => {
  const auth = readSrc("routes/auth.js");

  it("token cookie is httpOnly", () => {
    assert.match(auth, /httpOnly\s*:\s*true/);
  });

  it("token cookie uses sameSite lax", () => {
    assert.match(auth, /sameSite\s*:\s*["']lax["']/);
  });

  it("token cookie sets path to /", () => {
    assert.match(auth, /path\s*:\s*["']\/["']/);
  });

  it("token cookie has maxAge set (7 days)", () => {
    assert.match(auth, /maxAge\s*:\s*7\s*\*\s*24\s*\*\s*60\s*\*\s*60/);
  });

  it("JWT has expiration (7d)", () => {
    assert.match(auth, /expiresIn\s*:\s*["']7d["']/);
  });

  it("language cookie uses sameSite lax", () => {
    const server = readSrc("server.js");
    assert.match(server, /setCookie\s*\(\s*["']lang["'].*sameSite\s*:\s*["']lax["']/s);
  });
});

// ---------------------------------------------------------------------------
// 10. Open redirect prevention in /lang/:code
// ---------------------------------------------------------------------------
describe("Open redirect prevention", () => {
  const server = readSrc("server.js");

  it("/lang/:code extracts pathname from referer instead of using raw URL", () => {
    // After fix: uses new URL(raw) and extracts pathname + search
    assert.match(server, /\/lang\/:code/);
    assert.match(server, /new URL\(raw\)/);
    assert.match(server, /url\.pathname\s*\+\s*url\.search/);
  });

  it("/lang/:code defaults to / when referer is missing", () => {
    assert.match(server, /let\s+redirect\s*=\s*["']\/["']/);
  });

  it("/lang/:code validates language code against SUPPORTED_LANGS", () => {
    assert.match(server, /SUPPORTED_LANGS\.includes\(code\)/);
  });

  it("newsletter subscribe also extracts pathname from referer", () => {
    const newsletter = readSrc("routes/newsletter.js");
    assert.match(newsletter, /new URL\(raw\)/);
    assert.match(newsletter, /url\.pathname\s*\+\s*url\.search/);
  });
});

// ---------------------------------------------------------------------------
// 11. Button audit: all buttons have type attributes
// ---------------------------------------------------------------------------
describe("Button audit - type attributes", () => {
  const viewsDir = join(SRC, "views");
  const ejsFiles = collectEjs(viewsDir);

  it("all <button> tags in templates have a type attribute", () => {
    const missing = [];

    for (const file of ejsFiles) {
      const content = readFileSync(file, "utf-8");
      const shortPath = file.replace(viewsDir, "");

      // Find all <button ...> tags
      const buttons = content.match(/<button\b[^>]*>/gi) || [];

      for (const btn of buttons) {
        if (!/type\s*=/i.test(btn)) {
          missing.push(`${shortPath}: ${btn.substring(0, 80)}`);
        }
      }
    }

    assert.deepStrictEqual(missing, [], `Buttons without type attribute:\n${missing.join("\n")}`);
  });
});

// ---------------------------------------------------------------------------
// 12. Error handling: no stack trace leakage in production
// ---------------------------------------------------------------------------
describe("Error handling", () => {
  const server = readSrc("server.js");

  it("global error handler is set", () => {
    assert.match(server, /setErrorHandler/);
  });

  it("production mode returns generic error message", () => {
    assert.match(server, /process\.env\.NODE_ENV\s*===\s*['"]production['"]/);
    assert.match(server, /An unexpected error occurred/);
  });

  it("errors are logged", () => {
    assert.match(server, /app\.log\.error\(error\)/);
  });

  it("body size is limited", () => {
    assert.match(server, /bodyLimit\s*:\s*1048576/);
  });
});

// ---------------------------------------------------------------------------
// 13. Additional security checks
// ---------------------------------------------------------------------------
describe("Additional security checks", () => {
  it("password is hashed with bcrypt before storage", () => {
    const auth = readSrc("routes/auth.js");
    assert.match(auth, /bcrypt\.hash\(password,\s*10\)/);
  });

  it("password comparison uses bcrypt.compare (timing-safe)", () => {
    const auth = readSrc("routes/auth.js");
    assert.match(auth, /bcrypt\.compare\(password/);
  });

  it("banned users are checked on every request (onRequest hook)", () => {
    const server = readSrc("server.js");
    assert.match(server, /SELECT banned.*FROM users WHERE id = \$1/);
  });

  it("banned user token is cleared", () => {
    const server = readSrc("server.js");
    assert.match(server, /clearCookie\s*\(\s*["']token["']/);
  });

  it("admin ID params are parsed as integers", () => {
    const admin = readSrc("routes/admin.js");
    const parseIntCalls = admin.match(/parseInt\(req\.params\.\w+,\s*10\)/g);
    assert.ok(parseIntCalls && parseIntCalls.length >= 5, "admin route parses all ID params as integers");
  });

  it("affiliate click redirect goes to item.affiliateUrl (not user-controlled URL)", () => {
    const itin = readSrc("routes/itineraries.js");
    assert.match(itin, /reply\.redirect\(item\.affiliateUrl\)/);
  });
});
