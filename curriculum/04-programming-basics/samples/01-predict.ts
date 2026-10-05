// ============================================================
// 演習01 — 出力を予測してから実行する
// ------------------------------------------------------------
// このファイルは「読んで予測する」ためのものです。
// 実行する前に、各パートが何を出力するかをIssueに書いてください。
//
// 実行方法:  node 01-predict.ts
// ============================================================
// このファイル単独でトップレベルの型・変数を持てるよう、`export {}` でモジュール化しています。
// (中身が無いのは意図的です。書く必要はありません)
export {};

// --- パート1: 実行の順番 ------------------------------------

console.log("A");

function greet(): void {
  console.log("B");
}

console.log("C");
greet();
console.log("D");

console.log("--- パート1おわり ---");

// --- パート2: 変数の中身はいつ決まるか ----------------------

let count = 1;
const shown = `今の件数は ${count} 件`;

count = 99;

console.log(shown);
console.log(`今の件数は ${count} 件`);

console.log("--- パート2おわり ---");

// --- パート3: const は「変えられない」のか -------------------

const total = 10;
// total = 20;  ← これはエラーになります(コメントを外して確かめてOK)

const names = ["田中", "佐藤"];
names.push("鈴木");

console.log(names);
console.log(names.length);

console.log("--- パート3おわり ---");

// --- パート4: 足し算のようで足し算でないもの -----------------

const price = 1200;
const countFromApi = "3"; // APIから文字列で返ってきた、という想定

console.log(price + 1);
console.log(price + countFromApi);
console.log(price * countFromApi);

console.log("--- パート4おわり ---");

// --- パート5: 条件分岐 --------------------------------------

const stock = 0;

if (stock) {
  console.log("在庫あり");
} else {
  console.log("在庫なし");
}

if (stock === 0) {
  console.log("在庫はちょうど0です");
}

console.log("--- パート5おわり ---");

// --- パート6: 繰り返しと関数 --------------------------------

function withTax(base: number): number {
  return Math.round(base * 1.1);
}

const prices = [100, 250, 980];

for (const p of prices) {
  console.log(`${p} 円 → ${withTax(p)} 円`);
}

console.log("--- パート6おわり ---");

// --- パート7: 配列の外側を見る -------------------------------

const users = ["u1043", "u2287", "u3391"];

console.log(users[0]);
console.log(users[2]);
console.log(users[3]);

console.log("--- パート7おわり ---");
