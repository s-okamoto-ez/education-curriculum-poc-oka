#!/usr/bin/env node
// ============================================================
// トピックREADMEの演習リンクを、そのリポジトリのIssueへ向け直す
//
//   node scripts/link-readmes-to-issues.mjs --map <ファイル>  # 発行直後(ワークフロー用)
//   node scripts/link-readmes-to-issues.mjs --repo OWNER/REPO # 発行済みリポジトリ用
//   ...                                          --dry-run    # 書き換えずに差分だけ出す
//
// テンプレート本体では、トピックREADMEは `exercises/NN-*.md` への相対リンクの
// ままにしておく。Issue番号は複製先ごとに変わるので、テンプレートに番号を
// 焼き込むと壊れるため。
//
// 代わりに、複製先でIssueを発行し終えた直後にこのスクリプトを走らせ、その
// リポジトリのIssue URLへ書き換える。受講者はREADMEの表から自分のIssueへ
// 直接飛べるようになる。
//
// --map は「演習ファイルのパス<TAB>Issue URL」の行が並んだファイル。
// seed-issues.yml が gh issue create の出力から作る。
// --repo は gh でIssueを引いてタイトルで突き合わせる(発行済みリポジトリの
// 後追い修正用)。タイトルの作り方は build-issue-body.mjs に合わせる。
// ============================================================

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { posix } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BUILDER = join(ROOT, "scripts", "build-issue-body.mjs");

const argv = process.argv.slice(2);
const DRY = argv.includes("--dry-run");
const arg = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : null;
};
const MAP_FILE = arg("--map");
const REPO = arg("--repo");

if (!MAP_FILE && !REPO) {
  console.error("--map <ファイル> か --repo OWNER/REPO のどちらかが要ります。");
  process.exit(1);
}

const c = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

// ---------------------------------------------- 演習ファイル → Issue URL

/** @type {Map<string, string>} リポジトリルートからの相対パス → Issue URL */
const urlByFile = new Map();

if (MAP_FILE) {
  for (const line of readFileSync(MAP_FILE, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    const [file, url] = line.split("\t");
    if (!file || !url) continue;
    urlByFile.set(file.replace(/\\/g, "/").trim(), url.trim());
  }
} else {
  // 発行済みリポジトリから引く。突き合わせはタイトル。
  const issues = JSON.parse(
    execFileSync("gh", ["issue", "list", "--repo", REPO, "--state", "all", "--limit", "500", "--json", "number,title,url"], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    })
  );
  const byTitle = new Map();
  for (const i of issues) {
    if (!byTitle.has(i.title)) byTitle.set(i.title, []);
    byTitle.get(i.title).push(i);
  }

  for (const file of exerciseFiles()) {
    const title = execFileSync(process.execPath, [BUILDER, file, "--title"], {
      encoding: "utf8",
      cwd: ROOT,
    }).trim();
    const matches = byTitle.get(title) || [];
    if (matches.length === 1) {
      urlByFile.set(file, matches[0].url);
    } else {
      const why = matches.length === 0 ? "同じタイトルのIssueなし" : "タイトルが重複";
      console.log(`  ${c.yellow("--")}  ${file} ${c.dim("→ " + why + ": " + title)}`);
    }
  }
}

function exerciseFiles() {
  const out = [];
  const curriculum = join(ROOT, "curriculum");
  for (const topic of readdirSync(curriculum).sort()) {
    const dir = join(curriculum, topic, "exercises");
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir).sort()) {
      if (name.endsWith(".md")) out.push(`curriculum/${topic}/exercises/${name}`);
    }
  }
  return out;
}

if (urlByFile.size === 0) {
  console.error("Issueとの対応が1件も取れませんでした。何も書き換えません。");
  process.exit(1);
}

// ---------------------------------------------- READMEを書き換える

let rewritten = 0;
let unresolved = 0;
let touchedFiles = 0;

const curriculum = join(ROOT, "curriculum");
for (const topic of readdirSync(curriculum).sort()) {
  const readme = join(curriculum, topic, "README.md");
  if (!existsSync(readme)) continue;

  const dirRel = `curriculum/${topic}`;
  const before = readFileSync(readme, "utf8");

  // ](exercises/NN-name.md) の形だけを対象にする。他のリンクには触らない。
  const after = before.replace(/\]\((exercises\/[^)\s#]+\.md)\)/g, (whole, rel) => {
    const target = posix.normalize(posix.join(dirRel, rel));
    const url = urlByFile.get(target);
    if (!url) {
      console.log(`  ${c.yellow("--")}  ${dirRel}/README.md ${c.dim("→ 対応するIssueなし: " + rel)}`);
      unresolved++;
      return whole;
    }
    rewritten++;
    return `](${url})`;
  });

  if (after === before) continue;
  touchedFiles++;
  console.log(`  ${c.green("→")}  ${dirRel}/README.md`);
  if (!DRY) writeFileSync(readme, after, "utf8");
}

console.log(
  `\n${DRY ? "書き換える対象" : "書き換えた"}: リンク ${rewritten} 本 / README ${touchedFiles} ファイル` +
    (unresolved ? ` / 対応が取れず据え置き: ${unresolved}` : "")
);

if (unresolved) process.exitCode = 1;
