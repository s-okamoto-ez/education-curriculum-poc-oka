#!/usr/bin/env node
// ============================================================
// 発行済みの演習Issueの本文を、いまの演習Markdownから作り直して貼り直す
//
//   node scripts/fix-seeded-issues.mjs                    # 何が変わるか出すだけ
//   node scripts/fix-seeded-issues.mjs --apply            # 実際に貼り直す
//   node scripts/fix-seeded-issues.mjs --only 1,2 --apply # 番号を指定して試す
//
// 既存Issueは2点で壊れている。
//   (1) 図と本文中の相対パスが、Issue上では /OWNER/REPO/assets/... に解決されて404
//   (2) 移管前の所有者のURLが本文に焼き込まれている
// どちらも build-issue-body.mjs の出力で置き換えれば直る。
//
// Issueと演習ファイルはタイトルで突き合わせる。一致しないもの・重複するものは触らない。
// gh CLI が認証済みであること(gh auth status で確認)。
// ============================================================

import { writeFileSync, readdirSync, existsSync, mkdtempSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const APPLY = process.argv.includes("--apply");
const BUILDER = join(ROOT, "scripts", "build-issue-body.mjs");

// --only 1,2 で対象を絞る(まず1件だけ当てて実物を見たいとき用)
const onlyArg = process.argv[process.argv.indexOf("--only") + 1];
const ONLY = process.argv.includes("--only")
  ? new Set(onlyArg.split(",").map((n) => Number(n.trim())))
  : null;

const c = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

function gh(args) {
  return execFileSync("gh", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

function build(args) {
  return execFileSync(process.execPath, args, {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    cwd: ROOT,
  });
}

// ---------------------------------------------- 演習ファイルを集める

const exercises = [];
const curriculum = join(ROOT, "curriculum");
for (const topic of readdirSync(curriculum).sort()) {
  const dir = join(curriculum, topic, "exercises");
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir).sort()) {
    if (name.endsWith(".md")) exercises.push(`curriculum/${topic}/exercises/${name}`);
  }
}

if (exercises.length === 0) {
  console.error("演習ファイルが見つかりません。リポジトリのルートで実行してください。");
  process.exit(1);
}

// ---------------------------------------------- 既存Issueを引く

let issues;
try {
  issues = JSON.parse(
    gh(["issue", "list", "--state", "all", "--limit", "500", "--json", "number,title,body"])
  );
} catch (e) {
  console.error("gh でIssueを取得できませんでした。gh auth status を確認してください。");
  console.error(e.stderr || e.message);
  process.exit(1);
}

const byTitle = new Map();
for (const i of issues) {
  if (!byTitle.has(i.title)) byTitle.set(i.title, []);
  byTitle.get(i.title).push(i);
}

console.log(`演習ファイル ${exercises.length} 件 / Issue ${issues.length} 件`);
console.log(
  APPLY
    ? c.bold("\n--apply: 実際に貼り直します\n")
    : c.dim("\n下見だけです。貼り直すには --apply を付けてください\n")
);

// ---------------------------------------------- 突き合わせて貼り直す

const tmp = mkdtempSync(join(tmpdir(), "fix-issues-"));
let changed = 0;
let same = 0;
let skipped = 0;

for (const file of exercises) {
  const title = build([BUILDER, file, "--title"]).trim();
  const matches = byTitle.get(title) || [];

  if (matches.length === 0) {
    console.log(`  ${c.yellow("--")}  ${file} ${c.dim("→ 同じタイトルのIssueなし: " + title)}`);
    skipped++;
    continue;
  }
  if (matches.length > 1) {
    const ns = matches.map((m) => "#" + m.number).join(", ");
    console.log(`  ${c.yellow("--")}  ${file} ${c.dim("→ タイトルが重複 (" + ns + ")。手で直してください")}`);
    skipped++;
    continue;
  }

  const issue = matches[0];
  if (ONLY && !ONLY.has(issue.number)) continue;

  const body = build([BUILDER, file]).replace(/\r\n/g, "\n").trimEnd();
  const current = (issue.body || "").replace(/\r\n/g, "\n").trimEnd();

  if (body === current) {
    same++;
    continue;
  }

  // 何が直るのかを一言で出す
  const fixes = [];
  if (/<img\b[^>]*src="\.{1,2}\//.test(current)) fixes.push("図が表示されるURL(/raw/)に");
  if (/\]\(\.{1,2}\//.test(current)) fixes.push("本文中の相対リンクを絶対URLに");
  const referenced = [...current.matchAll(/github\.com\/([^/\s)"]+\/[^/\s)"]+)\/blob/g)].map((m) => m[1]);
  const stale = [...new Set(referenced)].filter((r) => r !== process.env.GITHUB_REPOSITORY);
  if (stale.length) fixes.push(`参照先 ${stale.join(", ")} を差し替え`);

  console.log(`  ${c.green("→")}  #${issue.number}  ${title}`);
  if (fixes.length) console.log(`      ${c.dim(fixes.join(" / "))}`);
  changed++;

  if (APPLY) {
    const bodyFile = join(tmp, `issue-${issue.number}.md`);
    writeFileSync(bodyFile, body + "\n", "utf8");
    gh(["issue", "edit", String(issue.number), "--body-file", bodyFile]);
  }
}

console.log(
  `\n${APPLY ? "貼り直した" : "貼り直す対象"}: ${changed} / 変更なし: ${same}` +
    (skipped ? ` / 見送り: ${skipped}` : "")
);

if (!APPLY && changed > 0) {
  const only = ONLY ? ` --only ${[...ONLY].join(",")}` : "";
  console.log(c.dim(`\n  node scripts/fix-seeded-issues.mjs${only} --apply`));
}
