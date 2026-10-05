#!/usr/bin/env node
// ============================================================
// 演習Markdown → 演習Issueのタイトルと本文
//
//   node scripts/build-issue-body.mjs <演習ファイル>           # 本文を出力
//   node scripts/build-issue-body.mjs <演習ファイル> --title   # タイトルを出力
//
// Issue本文の相対パスは、ファイルビューではなく Issue のURL
// (/OWNER/REPO/issues/N) を基準に解決されます。そのため
// `../assets/diagrams/x.svg` は /OWNER/REPO/assets/diagrams/x.svg になり404。
// ここで教材内の相対パスを絶対URLへ直します。
//
// 行き先はリンクと画像で変えます。ここを間違えると図が出ません。
//   リンク(.md など) → /blob/  ファイルのページ
//   画像(<img>, ![]) → /raw/   画像の実体
// Privateリポジトリでも /raw/ なら図はIssue上でそのまま表示されます
// (github.com と同一オリジンなので、閲覧者のセッションで取得できる)。
// blob や raw.githubusercontent.com では表示されません。実測で確認済み。
//
// 参照先は GITHUB_SERVER_URL / GITHUB_REPOSITORY / GITHUB_REF_NAME を見ます
// (未設定ならローカルの git remote と main にフォールバック)。
// ============================================================

import { readFileSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";
import { posix } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const WANT_TITLE = args.includes("--title");
const target = args.find((a) => !a.startsWith("--"));

if (!target) {
  console.error("usage: node scripts/build-issue-body.mjs <演習ファイル> [--title]");
  process.exit(1);
}

// ---------------------------------------------- 参照先のベースURL

function currentRepo() {
  if (process.env.GITHUB_REPOSITORY) return process.env.GITHUB_REPOSITORY;
  try {
    const url = execFileSync("git", ["-C", ROOT, "remote", "get-url", "origin"], {
      encoding: "utf8",
    }).trim();
    const m = url.match(/[:/]([^/:]+\/[^/]+?)(?:\.git)?$/);
    if (m) return m[1];
  } catch {
    // remoteが無い場合は下でエラーにする
  }
  return null;
}

const SERVER = process.env.GITHUB_SERVER_URL || "https://github.com";
const REPO = currentRepo();
const REF = process.env.GITHUB_REF_NAME || "main";

if (!REPO) {
  console.error("リポジトリを特定できません。GITHUB_REPOSITORY を設定してください。");
  process.exit(1);
}

const BLOB = `${SERVER}/${REPO}/blob/${REF}`; // ファイルのページ
const RAW = `${SERVER}/${REPO}/raw/${REF}`; // 画像の実体

// ---------------------------------------------- 相対パスの解決

const fileRel = relative(ROOT, resolve(target)).replace(/\\/g, "/");
const dirRel = posix.dirname(fileRel);

let warned = false;

// 教材内の相対パスを、リポジトリルート基準のパスへ畳む。
// リポジトリの外へ出るものは書き換えず、警告だけ出して残す。
function toUrl(rel, base) {
  const [pathPart, hash = ""] = rel.split("#");
  const resolved = posix.normalize(posix.join(dirRel, pathPart));
  if (resolved.startsWith("..")) {
    console.error(`  警告: リポジトリ外を指しています: ${rel} (${fileRel})`);
    warned = true;
    return null;
  }
  return `${base}/${resolved}${hash ? "#" + hash : ""}`;
}

// ---------------------------------------------- タイトル

const raw = readFileSync(resolve(target), "utf8");
const lines = raw.split(/\r?\n/);

const rawTitle = (lines[0] || "").replace(/^#\s+/, "");
// 「01. 今どこにいるかを知る」→「今どこにいるかを知る」
const dot = rawTitle.indexOf(". ");
const shortTitle = dot >= 0 ? rawTitle.slice(dot + 2) : rawTitle;

const topicDir = posix.dirname(dirRel); // curriculum/01-command-line-basics
const topicReadme = resolve(ROOT, topicDir, "README.md");
let topicName = topicDir.split("/").pop();
try {
  const head = readFileSync(topicReadme, "utf8").split(/\r?\n/)[0];
  const named = head.replace(/^#\s+/, "").trim();
  if (named) topicName = named;
} catch {
  // READMEが無ければディレクトリ名のまま
}

if (WANT_TITLE) {
  console.log(`[${topicName}] ${shortTitle}`);
  process.exit(0);
}

// ---------------------------------------------- 本文

// 1行目は見出し、2行目は空行。Issueのタイトルと重複するので落とす。
let body = lines.slice(2).join("\n");

// (1) Markdown画像 ![alt](rel) → /raw/ (リンクより先に処理する)
body = body.replace(/!\[([^\]]*)\]\((\.{1,2}\/[^)\s]+)\)/g, (whole, alt, rel) => {
  const url = toUrl(rel, RAW);
  return url ? `![${alt}](${url})` : whole;
});

// (2) Markdownリンク ](rel) → /blob/
body = body.replace(/\]\((\.{1,2}\/[^)\s]+)\)/g, (whole, rel) => {
  const url = toUrl(rel, BLOB);
  return url ? `](${url})` : whole;
});

// (3) HTML属性の相対パス。src は画像なので /raw/、href はページなので /blob/
body = body.replace(/\b(src|href)="(\.{1,2}\/[^"]+)"/g, (whole, attr, rel) => {
  const url = toUrl(rel, attr === "src" ? RAW : BLOB);
  return url ? `${attr}="${url}"` : whole;
});

// ---------------------------------------------- フッタ

const readmeUrl = `${BLOB}/${topicDir}/README.md`;
const cheatsheetUrl = `${BLOB}/${topicDir}/cheatsheet.md`;

body += `\n\n---\nこの演習は **[${topicName}](${readmeUrl})** の一部です。\n分からないコマンドや構文が出てきたら [早見表（チートシート）](${cheatsheetUrl}) を確認してください。`;

process.stdout.write(body + "\n");

if (warned) process.exitCode = 1;
