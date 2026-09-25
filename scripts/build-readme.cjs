#!/usr/bin/env node
// Builds README.md from venues.json. Every cell comes from a recorded fact; a missing
// fact is written "not checked", never guessed.
// Run: node scripts/build-readme.cjs
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const venues = JSON.parse(fs.readFileSync(path.join(ROOT, "venues.json"), "utf8"));
const NC = "not checked";

const CATEGORIES = [
  { key: "launch", title: "Launch platforms", blurb: "Sites built for launch day: a daily or weekly feed of new products." },
  { key: "ai", title: "AI tool directories", blurb: "Directories that list AI products by category." },
  { key: "review", title: "Software review sites", blurb: "Listing and review sites buyers use to compare software." },
  { key: "directory", title: "Startup directories", blurb: "Evergreen directories of startups and SaaS products." },
  { key: "network", title: "Founder networks", blurb: "Networks and hubs for founders, operators and growth people." },
  { key: "ph", title: "Product Hunt support groups", blurb: "Groups where makers share their Product Hunt launches. Check each group's rules before posting." },
  { key: "community", title: "Founder communities", blurb: "Forums and chat communities. Most allow a launch post only within their rules." },
];

function categoryOf(v) {
  const f = v.fit_categories || [];
  const has = (...k) => k.some((x) => f.includes(x));
  if (v.platform && v.platform !== "web") return v.purpose === "product_hunt" ? "ph" : "community";
  if (has("launch-feed", "launch")) return "launch";
  if (has("ai-directory", "vibe-coder")) return "ai";
  if (has("review-site")) return "review";
  if (has("directory")) return "directory";
  return "network";
}

const cost = (c) => ({
  free: "Free", paid: "Paid", freemium: "Free, paid options",
  free_with_backlink: "Free with a backlink", free_with_badge: "Free with a badge",
}[c] || NC);
const selfPromo = (s) => ({ yes: "Yes", limited: "Limited, check the rules", no: "No" }[s] || NC);
const dofollow = (d) => (d === true ? "yes" : d === false ? "no" : NC);
function audience(a) {
  if (!a) return NC;
  const parts = String(a).split(";").map((s) => s.trim()).filter(Boolean);
  const text = parts.length > 1 ? parts.slice(1).join("; ") : parts[0];
  return text.charAt(0).toUpperCase() + text.slice(1);
}
const cell = (s) => String(s).replace(/\|/g, "\\|");

const groups = new Map(CATEGORIES.map((c) => [c.key, []]));
for (const v of venues) groups.get(categoryOf(v)).push(v);

const out = [];
out.push("# Awesome Launch Directories", "");
out.push("Places to launch a product, each checked by hand-verifiable facts: cost, self-promotion rules, and whether the link is dofollow.", "");
out.push("Want this matched to your product? Try https://foxplug.com/where-to-launch — free, no signup.", "");
out.push("A cell that says \"not checked\" means that fact has not been verified yet. It is never a guess. Corrections are welcome.", "");
out.push("## Contents", "");
for (const c of CATEGORIES) if (groups.get(c.key).length) out.push(`- [${c.title}](#${c.title.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/ /g, "-")}) (${groups.get(c.key).length})`);
out.push("");
for (const c of CATEGORIES) {
  const rows = groups.get(c.key).sort((a, b) => a.name.localeCompare(b.name));
  if (!rows.length) continue;
  out.push(`## ${c.title}`, "", c.blurb, "");
  out.push("| Name | Audience | Free or paid | Self-promotion allowed | Dofollow | Last verified |");
  out.push("| --- | --- | --- | --- | --- | --- |");
  for (const v of rows) {
    out.push(`| [${cell(v.name)}](${v.url}) | ${cell(audience(v.audience))} | ${cost(v.cost)} | ${selfPromo(v.self_promotion)} | ${dofollow(v.dofollow)} | ${v.last_verified || NC} |`);
  }
  out.push("");
}
out.push("## Contributing", "", "See [CONTRIBUTING.md](CONTRIBUTING.md). Every change needs a link a reviewer can open to confirm it.", "");
out.push("## License", "", "[CC0 1.0](LICENSE). Public domain dedication.", "");
out.push("---", "", "Maintained by FoxPlug (https://foxplug.com). Corrections welcome — open a pull request.", "");

fs.writeFileSync(path.join(ROOT, "README.md"), out.join("\n"));
for (const c of CATEGORIES) console.log(`${c.title}: ${groups.get(c.key).length}`);
console.log(`Total: ${venues.length}`);
