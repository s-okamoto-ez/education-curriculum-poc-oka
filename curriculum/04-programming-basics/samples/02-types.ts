// ============================================================
// 演習02 — 型に守ってもらう / 型に怒られる
// ------------------------------------------------------------
// このファイルには、わざと型の誤りが仕込んであります。
// エディタ上で赤い波線が出ている箇所を探してください。
//
// 型チェック:  npx tsc --noEmit
// 実行:        node 02-types.ts
//
// ※ この2つの結果が違うことが、この演習の主題です。
// ============================================================
// このファイル単独でトップレベルの型・変数を持てるよう、`export {}` でモジュール化しています。
// (中身が無いのは意図的です。書く必要はありません)
export {};

// --- パート1: 基本の型 --------------------------------------

const userName: string = "田中";
const age: number = 28;
const isPremium: boolean = true;

console.log(`${userName} / ${age}歳 / プレミアム: ${isPremium}`);

// --- パート2: わざと間違える(誤り①) -----------------------
// APIから返ってきた値が文字列だった、という想定

const postCount: number = "42";

console.log(`投稿数: ${postCount}`);

// --- パート3: オブジェクトの型 -------------------------------

type User = {
  id: string;
  name: string;
  isPremium: boolean;
};

const tanaka: User = {
  id: "u1043",
  name: "田中",
  isPremium: true,
};

console.log(tanaka);

// --- パート4: 項目が足りない(誤り②) -----------------------

const sato: User = {
  id: "u2287",
  name: "佐藤",
};

console.log(sato);

// --- パート5: 存在しない項目を読む(誤り③) -----------------

console.log(tanaka.email);

// --- パート6: 関数の入口と出口 -------------------------------

function describeUser(user: User): string {
  const plan = user.isPremium ? "プレミアム" : "無料";
  return `${user.name}さん(${plan})`;
}

console.log(describeUser(tanaka));

// --- パート7: 渡すものを間違える(誤り④) -------------------

console.log(describeUser("田中"));

// --- パート8: 返すものを間違える(誤り⑤) -------------------

function countPosts(user: User): number {
  return `${user.name}の投稿数`;
}

console.log(countPosts(tanaka));

// --- パート9: 配列の型 ---------------------------------------

const ids: string[] = ["u1043", "u2287", "u3391"];

for (const id of ids) {
  console.log(id.toUpperCase());
}

// --- パート10: 配列に違うものを入れる(誤り⑥) ---------------

const counts: number[] = [1, 2, "3"];

console.log(counts);
