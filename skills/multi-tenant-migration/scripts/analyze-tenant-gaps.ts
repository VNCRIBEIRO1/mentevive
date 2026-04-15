/**
 * Multi-Tenant Gap Analysis Script
 *
 * Scans the entire Psicolobia codebase and generates a JSON report
 * of every file/query/route that needs multi-tenant changes.
 *
 * Usage: npx tsx skills/multi-tenant-migration/scripts/analyze-tenant-gaps.ts
 * Output: multi-tenant-audit.json
 */

import * as fs from "fs";
import * as path from "path";

const SRC_DIR = path.resolve(__dirname, "../../../src");
const SCRIPTS_DIR = path.resolve(__dirname, "../../../scripts");
const OUTPUT = path.resolve(__dirname, "../../../multi-tenant-audit.json");

interface Finding {
  file: string;
  line: number;
  type:
    | "db-query-no-tenant"
    | "insert-no-tenant"
    | "update-no-tenant"
    | "delete-no-tenant"
    | "session-no-tenant"
    | "hardcoded-url"
    | "stripe-no-account"
    | "jitsi-no-tenant-prefix"
    | "notification-no-tenant"
    | "public-route-no-tenant"
    | "env-single-tenant";
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  code: string;
}

interface AuditReport {
  timestamp: string;
  totalFiles: number;
  totalFindings: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  findings: Finding[];
}

const PATTERNS: {
  regex: RegExp;
  type: Finding["type"];
  severity: Finding["severity"];
  description: string;
}[] = [
  // DB queries without tenantId
  {
    regex: /db\.select\(\)\.from\(/g,
    type: "db-query-no-tenant",
    severity: "critical",
    description: "SELECT query — needs tenantId filter",
  },
  {
    regex: /db\.query\.\w+\.find/g,
    type: "db-query-no-tenant",
    severity: "critical",
    description: "Drizzle relational query — needs tenantId filter",
  },
  {
    regex: /db\.insert\(\w+\)\.values\(/g,
    type: "insert-no-tenant",
    severity: "critical",
    description: "INSERT — needs tenantId in values",
  },
  {
    regex: /db\.update\(\w+\)\.set\(/g,
    type: "update-no-tenant",
    severity: "high",
    description: "UPDATE — needs tenantId in WHERE clause",
  },
  {
    regex: /db\.delete\(\w+\)\.where\(/g,
    type: "delete-no-tenant",
    severity: "high",
    description: "DELETE — needs tenantId in WHERE clause",
  },
  // Session without tenant context
  {
    regex: /requireAdmin\(\)/g,
    type: "session-no-tenant",
    severity: "high",
    description: "requireAdmin() — needs to return tenantId",
  },
  {
    regex: /requireAuth\(\)/g,
    type: "session-no-tenant",
    severity: "high",
    description: "requireAuth() — needs to return tenantId",
  },
  // Hardcoded URLs
  {
    regex: /psicolobia\.vercel\.app/g,
    type: "hardcoded-url",
    severity: "medium",
    description: "Hardcoded domain — should be dynamic per tenant",
  },
  {
    regex: /WHATSAPP_LINK/g,
    type: "hardcoded-url",
    severity: "low",
    description: "WhatsApp link — should be per-tenant",
  },
  // Stripe without connected account
  {
    regex: /stripe\.checkout\.sessions\.create/g,
    type: "stripe-no-account",
    severity: "critical",
    description: "Stripe checkout — needs stripeAccount parameter for Connect",
  },
  {
    regex: /stripe\.refunds\.create/g,
    type: "stripe-no-account",
    severity: "high",
    description: "Stripe refund — needs stripeAccount parameter",
  },
  {
    regex: /stripe\.webhooks\.constructEvent/g,
    type: "stripe-no-account",
    severity: "critical",
    description: "Webhook signature — needs to handle connected account events",
  },
  // Jitsi without tenant namespace
  {
    regex: /buildRoomName\(/g,
    type: "jitsi-no-tenant-prefix",
    severity: "medium",
    description: "Jitsi room — needs tenant slug prefix",
  },
  {
    regex: /ROOM_PREFIX/g,
    type: "jitsi-no-tenant-prefix",
    severity: "medium",
    description: "Jitsi room prefix — should include tenant slug",
  },
  // Notifications without tenant
  {
    regex: /createNotification\(/g,
    type: "notification-no-tenant",
    severity: "high",
    description: "Notification — needs tenantId parameter",
  },
  // Public routes that need tenant from ?tenant=SLUG query param (Strategy C)
  {
    regex: /\/api\/portal\/availability|\/api\/portal\/booked-slots|\/api\/portal\/settings|\/api\/portal\/blocked-dates/g,
    type: "public-route-no-tenant",
    severity: "critical",
    description: "Public route — needs tenant context from ?tenant=SLUG query param",
  },
  // Strategy C: users table should NOT have tenantId (global users)
  {
    regex: /users.*tenantId|tenantId.*users/g,
    type: "env-single-tenant",
    severity: "medium",
    description: "Strategy C: users table must NOT have tenantId — use tenant_memberships instead",
  },
  // Strategy C: subdomain parsing should not exist
  {
    regex: /subdomain|x-tenant-id/gi,
    type: "env-single-tenant",
    severity: "medium",
    description: "Strategy C: no subdomains — use JWT/cookie activeTenantId or ?tenant=SLUG",
  },
];

function scanFile(filePath: string): Finding[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const findings: Finding[] = [];
  const relPath = path.relative(path.resolve(__dirname, "../../.."), filePath).replace(/\\/g, "/");

  // Skip test files and configs for critical findings
  const isTest = relPath.includes("test") || relPath.includes("__tests__");
  const isConfig = relPath.endsWith(".config.ts") || relPath.endsWith(".config.js") || relPath.endsWith(".config.mjs");

  if (isConfig) return [];

  for (const pattern of PATTERNS) {
    let match;
    const regex = new RegExp(pattern.regex.source, "g");

    while ((match = regex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split("\n").length;
      const codeLine = lines[lineNumber - 1]?.trim() || "";

      findings.push({
        file: relPath,
        line: lineNumber,
        type: pattern.type,
        severity: isTest ? "low" : pattern.severity,
        description: pattern.description,
        code: codeLine.substring(0, 120),
      });
    }
  }

  return findings;
}

function walkDir(dir: string, ext: string[] = [".ts", ".tsx"]): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      // Skip node_modules and .next
      if (item.name === "node_modules" || item.name === ".next") continue;
      results.push(...walkDir(full, ext));
    } else if (ext.some((e) => item.name.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

function main() {
  console.log("🔍 Scanning codebase for multi-tenant gaps...\n");

  const files = [...walkDir(SRC_DIR), ...walkDir(SCRIPTS_DIR)];
  const allFindings: Finding[] = [];

  for (const file of files) {
    allFindings.push(...scanFile(file));
  }

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  allFindings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const bySeverity: Record<string, number> = {};
  const byType: Record<string, number> = {};

  for (const f of allFindings) {
    bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
    byType[f.type] = (byType[f.type] || 0) + 1;
  }

  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    totalFiles: files.length,
    totalFindings: allFindings.length,
    bySeverity,
    byType,
    findings: allFindings,
  };

  fs.writeFileSync(OUTPUT, JSON.stringify(report, null, 2));

  // Print summary
  console.log(`📁 Files scanned: ${files.length}`);
  console.log(`🔎 Total findings: ${allFindings.length}\n`);

  console.log("By severity:");
  for (const [sev, count] of Object.entries(bySeverity)) {
    const icon = sev === "critical" ? "🔴" : sev === "high" ? "🟡" : sev === "medium" ? "🟢" : "⚪";
    console.log(`  ${icon} ${sev}: ${count}`);
  }

  console.log("\nBy type:");
  for (const [type, count] of Object.entries(byType)) {
    console.log(`  - ${type}: ${count}`);
  }

  // List critical files
  const criticalFiles = new Set(
    allFindings.filter((f) => f.severity === "critical").map((f) => f.file)
  );
  if (criticalFiles.size > 0) {
    console.log(`\n🔴 Critical files (${criticalFiles.size}):`);
    for (const f of criticalFiles) {
      const count = allFindings.filter((x) => x.file === f && x.severity === "critical").length;
      console.log(`  ${f} (${count} findings)`);
    }
  }

  console.log(`\n✅ Report saved to: multi-tenant-audit.json`);
}

main();
