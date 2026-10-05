#!/usr/bin/env node
// ============================================================
// 教材の静的検証(Docker不要)
//
//   node scripts/verify.mjs
//   node scripts/verify.mjs --skip-samples   # サンプル実行を飛ばす
//
// 失敗があれば終了コード 1 を返します。
// DBが要る検証は scripts/verify-db.mjs を使ってください。
// ============================================================

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_SAMPLES = process.argv.includes("--skip-samples");

let failures = 0;
let checks = 0;

const c = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

function fail(msg, detail) {
  failures++;
  console.log(`  ${c.red("NG")}  ${msg}`);
  if (detail) console.log(`      ${c.dim(detail)}`);
}
function ok(msg) {
  checks++;
  console.log(`  ${c.green("OK")}  ${msg}`);
}
function skip(msg, why) {
  console.log(`  ${c.yellow("--")}  ${msg} ${c.dim("(" + why + ")")}`);
}
function section(title) {
  console.log(`\n${c.bold(title)}`);
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === ".git" || e.name === "node_modules") continue;
    const p = join(dir, e.name);
    e.isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
}

const allFiles = walk(ROOT);
const mdFiles = allFiles.filter((f) => f.endsWith(".md"));
const svgFiles = allFiles.filter((f) => f.endsWith(".svg"));
const rel = (f) => relative(ROOT, f).replace(/\\/g, "/");

// ============================================================
// 1. リンクと画像が実在するか
// ============================================================
section("1. リンク・画像の実在チェック");
{
  // コード例の中に出てくる、実ファイルではない参照
  const IGNORE = new Set(["...", "logo.png"]);
  let broken = 0;
  let total = 0;

  for (const f of mdFiles) {
    const txt = readFileSync(f, "utf8");
    const dir = dirname(f);

    // ``` で囲まれたコードブロックを除外してから調べる
    const body = txt.replace(/```[\s\S]*?```/g, "");

    const refs = [
      ...[...body.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]),
      ...[...body.matchAll(/<img[^>]*src="([^"]+)"/g)].map((m) => m[1]),
    ];

    for (const r of refs) {
      if (/^(https?:|#|mailto:)/.test(r)) continue;
      const target = r.split("#")[0];
      if (!target || IGNORE.has(target)) continue;
      total++;
      if (!existsSync(resolve(dir, target))) {
        broken++;
        fail(`リンク切れ: ${rel(f)}`, `-> ${r}`);
      }
    }
  }
  if (broken === 0) ok(`${total} 件の相対リンク・画像がすべて実在 (${mdFiles.length} ファイル)`);
}

// ============================================================
// 2. SVGの健全性
// ============================================================
section("2. 図(SVG)の健全性チェック");
{
  const diagrams = svgFiles.filter((f) => f.includes("diagrams"));
  let bad = 0;

  for (const f of svgFiles) {
    const s = readFileSync(f, "utf8");
    const isDiagram = f.includes("diagrams");
    const name = rel(f);

    // --- タグの対応 ---
    const stack = [];
    const re = /<(\/?)([a-zA-Z][\w:-]*)((?:"[^"]*"|[^>"])*)>/g;
    let m;
    let tagErr = null;
    while ((m = re.exec(s))) {
      const closing = m[1] === "/";
      const tag = m[2];
      if (m[3].trimEnd().endsWith("/")) continue; // 自己終了タグ
      if (closing) {
        const top = stack.pop();
        if (top !== tag) tagErr = `</${tag}> が <${top}> を閉じようとしている`;
      } else stack.push(tag);
    }
    if (tagErr) { bad++; fail(`タグ不整合: ${name}`, tagErr); }
    else if (stack.length) { bad++; fail(`閉じられていないタグ: ${name}`, stack.join(", ")); }

    if (!isDiagram) continue; // アイコンは以下の対象外

    // --- アクセシビリティ ---
    if (!/role="img"/.test(s)) { bad++; fail(`role="img" が無い: ${name}`); }
    if (!/aria-label="[^"]{20,}"/.test(s)) {
      bad++;
      fail(`aria-label が無い、または短すぎる: ${name}`, "図の内容を文章で説明してください");
    }

    // --- ダークモード ---
    if (!/@media \(prefers-color-scheme: dark\)/.test(s)) {
      bad++;
      fail(`ダークモード指定が無い: ${name}`);
    }

    // --- 背景と viewBox の一致 ---
    const vb = s.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
    const bg = s.match(/class="bg"[^>]*width="(\d+(?:\.\d+)?)"[^>]*height="(\d+(?:\.\d+)?)"/);
    if (!vb) { bad++; fail(`viewBox が "0 0 W H" の形式でない: ${name}`); }
    if (vb && bg && (vb[1] !== bg[1] || vb[2] !== bg[2])) {
      bad++;
      fail(`背景と viewBox の寸法が違う: ${name}`, `viewBox=${vb[1]}x${vb[2]} / bg=${bg[1]}x${bg[2]}`);
    }

    // --- Markdown記法の混入(SVGでは太字にならない) ---
    if (/\*\*/.test(s)) {
      bad++;
      fail(`SVG内に Markdown の ** が混入: ${name}`, "SVGでは太字になりません。font-weight を使ってください");
    }

    // --- 要素が画面外に出ていないか ---
    if (vb) {
      const W = parseFloat(vb[1]), H = parseFloat(vb[2]), TOL = 6;
      const out = [];
      // <text> の y(アイコン等の transform 内には text を置かない前提)
      for (const t of s.matchAll(/<text[^>]*\sy="(-?\d+(?:\.\d+)?)"/g)) {
        const y = parseFloat(t[1]);
        if (y < -TOL || y > H + TOL) out.push(`text y=${y}`);
      }
      // <rect> の下端・右端
      for (const t of s.matchAll(/<rect[^>]*\sx="(-?\d+(?:\.\d+)?)"[^>]*\sy="(-?\d+(?:\.\d+)?)"[^>]*\swidth="(\d+(?:\.\d+)?)"[^>]*\sheight="(\d+(?:\.\d+)?)"/g)) {
        const x2 = parseFloat(t[1]) + parseFloat(t[3]);
        const y2 = parseFloat(t[2]) + parseFloat(t[4]);
        if (y2 > H + TOL) out.push(`rect 下端 y=${y2}`);
        if (x2 > W + TOL) out.push(`rect 右端 x=${x2}`);
      }
      // <line> の始点・終点(x1/y1/x2/y2 は属性が明確なので誤検知しにくい)
      for (const t of s.matchAll(/<line\b[^>]*\sx1="(-?\d+(?:\.\d+)?)"[^>]*\sy1="(-?\d+(?:\.\d+)?)"[^>]*\sx2="(-?\d+(?:\.\d+)?)"[^>]*\sy2="(-?\d+(?:\.\d+)?)"/g)) {
        const [x1, y1, x2, y2] = t.slice(1).map(Number);
        for (const [x, y] of [[x1, y1], [x2, y2]]) {
          if (x < -TOL || x > W + TOL || y < -TOL || y > H + TOL) {
            out.push(`line 座標が画面外 (${x},${y})`);
          }
        }
      }
      if (out.length) {
        bad++;
        fail(`要素が画面外に出ている: ${name}`, `${out.slice(0, 4).join(" / ")} (viewBox ${W}x${H})`);
      }
    }
  }
  if (bad === 0) ok(`${svgFiles.length} 個のSVG(うち図 ${diagrams.length} 点)がすべて健全`);
}

// ============================================================
// 3. Issue自動発行のドライラン
// ============================================================
section("3. Issue自動発行のドライラン");
{
  const curriculum = join(ROOT, "curriculum");
  const dirs = readdirSync(curriculum, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  let issues = 0;
  let bad = 0;
  const titles = [];

  for (const d of dirs) {
    const topicDir = join(curriculum, d);
    const exDir = join(topicDir, "exercises");
    if (!existsSync(exDir)) continue; // columns/ など

    const readme = join(topicDir, "README.md");
    if (!existsSync(readme)) { bad++; fail(`README.md が無い: curriculum/${d}`); continue; }

    const topicName = (readFileSync(readme, "utf8").split(/\r?\n/)[0].match(/^# (.+)$/) || [])[1];
    if (!topicName) { bad++; fail(`README.md の1行目が見出しでない: curriculum/${d}`); }

    if (!existsSync(join(topicDir, "cheatsheet.md"))) {
      bad++;
      fail(`cheatsheet.md が無い: curriculum/${d}`, "Issue本文の末尾リンクが切れます");
    }

    for (const f of readdirSync(exDir).filter((x) => x.endsWith(".md")).sort()) {
      const first = readFileSync(join(exDir, f), "utf8").split(/\r?\n/)[0];
      const raw = (first.match(/^# (.+)$/) || [])[1];
      if (!raw) { bad++; fail(`演習の1行目が見出しでない: curriculum/${d}/exercises/${f}`); continue; }
      const short = raw.replace(/^\d+\.\s*/, "");
      const title = `[${topicName}] ${short}`;
      if (titles.includes(title)) { bad++; fail(`Issueタイトルが重複: ${title}`); }
      titles.push(title);
      issues++;
    }
  }

  if (bad === 0) ok(`${issues} 件のIssueが正しく発行される`);
  if (process.argv.includes("--list-issues")) {
    titles.forEach((t, i) => console.log(`      ${String(i + 1).padStart(2)}. ${t}`));
  }
}

// ============================================================
// 4. HTML/CSSサンプルの構文チェック(タグ対応・ブレース対応)
// ============================================================
section("4. HTML/CSSサンプルの構文チェック");
{
  const VOID_TAGS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
  const htmlFiles = allFiles.filter((f) => f.endsWith(".html") && rel(f).includes("/samples/"));
  const cssFiles = allFiles.filter((f) => f.endsWith(".css") && rel(f).includes("/samples/"));
  let bad = 0;

  for (const f of htmlFiles) {
    const html = readFileSync(f, "utf8");
    const stack = [];
    const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;
    let m;
    let err = null;
    while ((m = re.exec(html))) {
      const closing = m[1] === "/";
      const tag = m[2].toLowerCase();
      const selfClosed = m[4] === "/" || VOID_TAGS.has(tag);
      if (selfClosed) continue;
      if (closing) {
        const top = stack.pop();
        if (top !== tag) { err = `</${tag}> が予期しない位置(直前に開いていたのは <${top || "なし"}>)`; break; }
      } else {
        stack.push(tag);
      }
    }
    if (!err && stack.length) err = `閉じられていないタグ: <${stack.join(">, <")}>`;
    if (err) { bad++; fail(`HTMLタグ不整合: ${rel(f)}`, err); }
  }

  for (const f of cssFiles) {
    const css = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    const open = (css.match(/\{/g) || []).length;
    const close = (css.match(/\}/g) || []).length;
    if (open !== close) { bad++; fail(`CSSの中括弧が不一致: ${rel(f)}`, `{ が${open}個 / } が${close}個`); }
  }

  if (bad === 0) ok(`${htmlFiles.length} 個のHTML・${cssFiles.length} 個のCSSサンプルが構文的に健全`);

  // --- .js のサンプル(サーバーなど、実行し続けるので起動はしない)は構文だけ見る ---
  const jsFiles = allFiles.filter((f) => f.endsWith(".js") && rel(f).includes("/samples/"));
  let jsBad = 0;
  for (const f of jsFiles) {
    try {
      execFileSync(process.execPath, ["--check", f], { stdio: ["ignore", "pipe", "pipe"] });
    } catch (e) {
      jsBad++;
      fail(`JS構文エラー: ${rel(f)}`, String(e.stderr || e.message).split("\n")[0]);
    }
  }
  if (jsFiles.length && jsBad === 0) ok(`${jsFiles.length} 個の.jsサンプルが構文的に健全(起動しての動作確認は別途手動)`);
}

// ============================================================
// 5. サンプルコードが、教材の記述どおりに動くか
// ============================================================
section("5. サンプルコードの実行確認");
if (SKIP_SAMPLES) {
  skip("サンプル実行", "--skip-samples 指定");
} else {
  const nodeMajor = parseInt(process.versions.node.split(".")[0], 10);
  if (nodeMajor < 22) {
    skip("サンプル実行", `Node v22以上が必要 (現在 v${process.versions.node})`);
  } else {
    const pb = join(ROOT, "curriculum/04-programming-basics/samples");

    // --- 演習01: 教材が予測させている出力が実際に出るか ---
    try {
      const out = execFileSync(process.execPath, ["01-predict.ts"], {
        cwd: pb, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
      });
      const expects = [
        ["A\nC\nB\nD", "パート1: 関数定義の位置に関わらず、呼ばれた順に出る"],
        ["今の件数は 1 件", "パート2: テンプレート文字列は評価時点の値で固定される"],
        ["[ '田中', '佐藤', '鈴木' ]", "パート3: const の配列に push できる"],
        ["12003", "パート4: 数値 + 文字列 は連結になる"],
        ["3600", "パート4: 数値 * 文字列 は数値に変換される"],
        ["在庫なし", "パート5: 0 は偽として扱われる"],
        ["undefined", "パート7: 範囲外の添字は undefined"],
      ];
      let bad = 0;
      for (const [needle, why] of expects) {
        if (!out.includes(needle)) { bad++; fail(`01-predict.ts に "${needle}" が出ない`, why); }
      }
      if (bad === 0) ok(`01-predict.ts が教材どおりの出力 (${expects.length} 項目)`);
    } catch (e) {
      fail("01-predict.ts の実行に失敗", String(e.stderr || e.message).split("\n")[0]);
    }

    // --- 演習03: 教材が読ませるスタックトレースが実際に出るか ---
    try {
      execFileSync(process.execPath, ["03-broken/main.ts"], {
        cwd: pb, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
      });
      fail("03-broken/main.ts が落ちなかった", "この演習は落ちることが前提です");
    } catch (e) {
      const err = String(e.stderr || "");
      const expects = [
        ["TypeError", "エラー種別"],
        ["formatAuthor", "スタックの一番上の関数"],
        ["post.ts", "最初に開くファイル"],
        ["renderPost", "呼び出し元"],
        ["renderTimeline", "さらに呼び出し元"],
      ];
      let bad = 0;
      for (const [needle, why] of expects) {
        if (!err.includes(needle)) { bad++; fail(`03-broken のエラーに "${needle}" が出ない`, why); }
      }
      if (bad === 0) ok(`03-broken/main.ts が教材どおりのスタックトレースで落ちる (${expects.length} 項目)`);
    }

    // --- 演習04: 未実装の空欄が、教材の説明どおりの値を返すか ---
    try {
      const out = execFileSync(process.execPath, ["04-arrays.ts"], {
        cwd: pb, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
      });
      const expects = [
        ["表示すべき投稿数: 6", "visiblePosts が未実装のうち(全6件がそのまま返る)"],
        ["本文一覧: []", "bodies が未実装のうち"],
        ["新機能が出たらしい", "find はパート3の時点で実装済み"],
        ["存在しないIDを探す: undefined", "find が見つからない場合"],
        ["いいねの合計: 0", "totalLikes が未実装のうち"],
        ["人気投稿の本文: []", "popularBodies が未実装のうち"],
      ];
      let bad = 0;
      for (const [needle, why] of expects) {
        if (!out.includes(needle)) { bad++; fail(`04-arrays.ts(未実装状態) に "${needle}" が出ない`, why); }
      }
      if (bad === 0) ok(`04-arrays.ts が未実装状態で教材どおりの出力 (${expects.length} 項目)`);
    } catch (e) {
      fail("04-arrays.ts の実行に失敗", String(e.stderr || e.message).split("\n")[0]);
    }

    // --- 演習05: 成功/try-catch経路が教材どおりに動くか ---
    try {
      const out = execFileSync(process.execPath, ["05-async.ts"], {
        cwd: pb, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
      });
      const expects = [
        ["[パート1] 取得できた投稿数: 2", "成功経路"],
        ["[パート2] 失敗しました: タイムラインの取得に失敗しました", "try/catchで受け止めた経路"],
        ["[パート2] ここは、成功でも失敗でも必ず実行される", "catch後も処理が続く"],
      ];
      let bad = 0;
      for (const [needle, why] of expects) {
        if (!out.includes(needle)) { bad++; fail(`05-async.ts に "${needle}" が出ない`, why); }
      }
      // mainの外のconsole.logが、パート1の結果より先に出ること(非同期の直感に反する挙動)
      const outerIdx = out.indexOf("mainの外にある");
      const part1Idx = out.indexOf("[パート1] 取得できた投稿数");
      if (outerIdx === -1 || part1Idx === -1 || outerIdx > part1Idx) {
        bad++;
        fail("05-async.ts: 同期処理が非同期処理より先に出る、という教材の説明を再現できない");
      }
      if (bad === 0) ok(`05-async.ts が教材どおりの出力・実行順 (${expects.length + 1} 項目)`);
    } catch (e) {
      fail("05-async.ts の実行に失敗", String(e.stderr || e.message).split("\n")[0]);
    }

    // --- 演習06: 検索の不具合(型エラーにならない)と、undefinedの不具合(型エラーになる)を両方再現するか ---
    try {
      execFileSync(process.execPath, ["06-search-and-render.ts"], {
        cwd: pb, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
      });
      fail("06-search-and-render.ts が落ちなかった", "パート2は未実装状態で落ちることが前提です");
    } catch (e) {
      const out = String(e.stdout || "");
      const err = String(e.stderr || "");
      const expects = [
        [out, "「 太郎 」で検索: []", "パート1が未実装のうち(完全一致なので0件)"],
        [out, "田中太郎: エンジニアです。", "profileがあるユーザーは表示できる"],
        [out, "佐藤花子: デザイン担当。", "profileがあるユーザーは表示できる"],
        [err, "TypeError", "エラー種別"],
        [err, "renderProfile", "スタックの一番上の関数"],
      ];
      let bad = 0;
      for (const [text, needle, why] of expects) {
        if (!text.includes(needle)) { bad++; fail(`06-search-and-render.ts に "${needle}" が出ない`, why); }
      }
      if (bad === 0) ok(`06-search-and-render.ts が未実装状態で教材どおりの出力・エラーで落ちる (${expects.length} 項目)`);
    }

    // --- 演習02: 仕込んだ型エラーの数が合っているか ---
    const tsc = join(pb, "node_modules/typescript/bin/tsc");
    if (!existsSync(tsc)) {
      skip("型チェック", "samples で npm install が未実行");
    } else {
      let out = "";
      try {
        execFileSync(process.execPath, [tsc, "--noEmit"], { cwd: pb, encoding: "utf8" });
      } catch (e) {
        out = String(e.stdout || "");
      }
      const inTypes = (out.match(/^02-types\.ts\(/gm) || []).length;
      const inPredict = (out.match(/^01-predict\.ts\(/gm) || []).length;
      const inArrays = (out.match(/^04-arrays\.ts\(/gm) || []).length;
      const inAsync = (out.match(/^05-async\.ts\(/gm) || []).length;
      const inSearch = (out.match(/^06-search-and-render\.ts\(/gm) || []).length;
      // 02-types.ts には演習で直させる誤りを6件、01-predict.ts には掛け算の1件を仕込んでいる。
      // 04-arrays.ts と 05-async.ts は、未実装の空欄があっても型エラーにはならない設計。
      // 06-search-and-render.ts は、パート2(user.profile.bio)がoptional chaining未使用のため1件だけ型エラーになる設計。
      if (inTypes !== 6) fail(`02-types.ts の型エラーが ${inTypes} 件`, "教材は6件と説明しています");
      else if (inPredict !== 1) fail(`01-predict.ts の型エラーが ${inPredict} 件`, "教材(演習02のおまけ)は1件と説明しています");
      else if (inArrays !== 0) fail(`04-arrays.ts に型エラーが ${inArrays} 件`, "未実装の空欄は型エラーにならない設計のはず");
      else if (inAsync !== 0) fail(`05-async.ts に型エラーが ${inAsync} 件`, "型エラーは仕込んでいない");
      else if (inSearch !== 1) fail(`06-search-and-render.ts の型エラーが ${inSearch} 件`, "教材はパート2で1件と説明しています");
      else ok("型エラーの件数が教材どおり (02-types.ts に6件 / 01-predict.ts に1件 / 04・05は0件 / 06に1件)");
    }
  }
}

// ============================================================
// 結果
// ============================================================
console.log("");
if (failures === 0) {
  console.log(c.green(c.bold(`すべて通りました (${checks} 項目)`)));
  console.log(c.dim("DBが要る検証は: node scripts/verify-db.mjs"));
  process.exit(0);
} else {
  console.log(c.red(c.bold(`${failures} 件の問題があります`)));
  process.exit(1);
}
