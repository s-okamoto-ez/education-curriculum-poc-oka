#!/usr/bin/env node
// ============================================================
// SQL基礎の教材が「こうなる」と書いている内容を、実物のDBで確かめる
//
//   node scripts/verify-db.mjs
//   node scripts/verify-db.mjs --keep-up   # 終了後もDBを起動したままにする
//
// 検証する内容は scripts/claims-db.json にあります。
// 教材の記述を変えたら、あちらも直してください。
//
// Docker が要ります。Windowsで docker が WSL の中にしか無い場合は、
// 自動的に wsl 経由で実行します。
// ============================================================

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SAMPLES = resolve(ROOT, "curriculum/06-sql-basics/samples");
const KEEP_UP = process.argv.includes("--keep-up");

const c = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

let failures = 0;
let passed = 0;

// ------------------------------------------------------------
// docker の呼び出し方を決める(直接 / wsl 経由)
// ------------------------------------------------------------
function toWslPath(p) {
  return p
    .replace(/^([A-Za-z]):/, (_, d) => `/mnt/${d.toLowerCase()}`)
    .replace(/\\/g, "/");
}

let runner = null;

function probe() {
  // 1) PATH 上の docker
  try {
    execFileSync("docker", ["info"], { stdio: "ignore" });
    return {
      label: "docker (直接)",
      exec: (args) =>
        execFileSync("docker", args, { cwd: SAMPLES, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }),
    };
  } catch { /* 次を試す */ }

  // 2) WSL の中の docker(Windows でよくある構成)
  if (process.platform === "win32") {
    try {
      execFileSync("wsl", ["-e", "bash", "-lc", "docker info >/dev/null 2>&1"], { stdio: "ignore" });
      const wslDir = toWslPath(SAMPLES);
      return {
        label: "docker (WSL経由)",
        exec: (args) => {
          const quoted = args.map((a) => `'${String(a).replace(/'/g, `'\\''`)}'`).join(" ");
          return execFileSync(
            "wsl",
            ["-e", "bash", "-lc", `cd '${wslDir}' && docker ${quoted}`],
            { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }
          );
        },
      };
    } catch { /* 見つからない */ }
  }
  return null;
}

runner = probe();

if (!runner) {
  console.log(c.yellow("Docker が見つからないため、DBの検証は行いません。"));
  console.log(c.dim("  Windowsの場合、docker が WSL の中にあるなら wsl が使える状態か確認してください。"));
  console.log(c.dim("  静的な検証だけなら: node scripts/verify.mjs"));
  process.exit(0);
}

console.log(c.dim(`実行方法: ${runner.label}`));

// ------------------------------------------------------------
// DBを起動して、初期化を待つ
// ------------------------------------------------------------
function psql(sql, extraArgs = []) {
  return runner.exec(["compose", "exec", "-T", "db", "psql", "-U", "app", "-d", "tsunagaru", ...extraArgs, "-c", sql]);
}
function psqlScalar(sql) {
  // -q はBEGIN/UPDATE/ROLLBACKなどのコマンド完了タグを消す。
  // 複数文をまとめた claim(例: "BEGIN; UPDATE ...; SELECT ...; ROLLBACK;")でも
  // 最後のSELECTの結果だけが残るようにするため。
  return runner.exec(["compose", "exec", "-T", "db", "psql", "-q", "-U", "app", "-d", "tsunagaru", "-tAc", sql]).trim();
}

let startedByUs = false;

function isReady() {
  try {
    psqlScalar("SELECT count(*) FROM access_logs");
    return true;
  } catch {
    return false;
  }
}

if (!existsSync(resolve(SAMPLES, "docker-compose.yml"))) {
  console.log(c.red("docker-compose.yml が見つかりません: " + SAMPLES));
  process.exit(1);
}

if (!isReady()) {
  console.log(c.dim("DBを起動します(初回は100万行の生成で1〜3分かかります)…"));
  runner.exec(["compose", "up", "-d"]);
  startedByUs = true;

  const deadline = Date.now() + 5 * 60 * 1000;
  let ready = false;
  while (Date.now() < deadline) {
    if (isReady()) { ready = true; break; }
    execFileSync(process.execPath, ["-e", "setTimeout(()=>{},3000)"]); // 3秒待つ
  }
  if (!ready) {
    console.log(c.red("DBの初期化が5分で終わりませんでした。"));
    console.log(c.dim("  ログ: docker compose logs db"));
    process.exit(1);
  }
}

// ------------------------------------------------------------
// 検証開始。まずインデックスを素の状態に戻す
// ------------------------------------------------------------
psql(
  "DROP INDEX IF EXISTS idx_access_logs_user_id; DROP INDEX IF EXISTS idx_access_logs_path; DROP INDEX IF EXISTS idx_access_logs_status; ANALYZE access_logs;"
);

const { claims } = JSON.parse(readFileSync(resolve(ROOT, "scripts/claims-db.json"), "utf8"));

console.log(c.bold("\n教材の記述と、実物のDBを突き合わせます"));

for (const cl of claims) {
  try {
    if (cl.setup) psql(cl.setup);

    if (cl.kind === "scalar") {
      const got = psqlScalar(cl.sql);
      if (got === String(cl.expect)) {
        passed++;
        console.log(`  ${c.green("OK")}  ${cl.desc}`);
      } else {
        failures++;
        console.log(`  ${c.red("NG")}  ${cl.desc}`);
        console.log(`      ${c.dim(`教材: ${cl.expect}  /  実物: ${got}`)}`);
        console.log(`      ${c.dim(`記述箇所: ${cl.where}`)}`);
      }
    } else if (cl.kind === "plan") {
      const out = psql("EXPLAIN ANALYZE " + cl.sql);
      const bad = [];
      for (const needle of cl.contains || []) {
        // 「Index Scan」は Bitmap Index Scan / Index Only Scan も含めて数える
        const re = needle === "Index Scan" ? /(Bitmap )?Index (Only )?Scan/ : new RegExp(needle);
        if (!re.test(out)) bad.push(`"${needle}" が計画に出ない`);
      }
      for (const needle of cl.notContains || []) {
        const re = needle === "Index Scan" ? /(Bitmap )?Index (Only )?Scan/ : new RegExp(needle);
        if (re.test(out)) bad.push(`"${needle}" が計画に出てしまう`);
      }
      const time = (out.match(/Execution Time: ([\d.]+) ms/) || [])[1];
      if (bad.length === 0) {
        passed++;
        console.log(`  ${c.green("OK")}  ${cl.desc}${time ? c.dim(`  (${time} ms)`) : ""}`);
      } else {
        failures++;
        console.log(`  ${c.red("NG")}  ${cl.desc}`);
        bad.forEach((b) => console.log(`      ${c.dim(b)}`));
        console.log(`      ${c.dim(`記述箇所: ${cl.where}`)}`);
        const scans = [...out.matchAll(/((?:Parallel |Bitmap |Index Only )*(?:Seq|Index|Bitmap Heap) Scan[^(]*)/g)]
          .map((m) => m[1].trim());
        if (scans.length) console.log(`      ${c.dim("実際の計画: " + scans.join(" / "))}`);
      }
    }

    if (cl.teardown) psql(cl.teardown);
  } catch (e) {
    failures++;
    console.log(`  ${c.red("NG")}  ${cl.desc}`);
    console.log(`      ${c.dim("SQLの実行に失敗: " + String(e.stderr || e.message).split("\n").filter(Boolean)[0])}`);
  }
}

// ------------------------------------------------------------
// 後片付け(受講者が始める状態に戻す)
// ------------------------------------------------------------
psql(
  "DROP INDEX IF EXISTS idx_access_logs_user_id; DROP INDEX IF EXISTS idx_access_logs_path; DROP INDEX IF EXISTS idx_access_logs_status;"
);

if (startedByUs && !KEEP_UP) {
  console.log(c.dim("\n起動したDBを停止します(データは残ります)"));
  runner.exec(["compose", "down"]);
}

console.log("");
if (failures === 0) {
  console.log(c.green(c.bold(`教材の記述はすべて実物と一致しました (${passed} 項目)`)));
  process.exit(0);
} else {
  console.log(c.red(c.bold(`${failures} 件、教材と実物が食い違っています`)));
  console.log(c.dim("教材を直すか、claims-db.json を直してください。"));
  process.exit(1);
}
