// ============================================================
// 演習04 — 配列を操作する
// ------------------------------------------------------------
// 「つながるノート」の投稿一覧に対して、よくある処理を書きます。
// 空いている関数を、あなたが実装してください。
//
// 実行方法:  node 04-arrays.ts
// 型チェック: npm run typecheck(親フォルダで)
// ============================================================
// このファイル単独でトップレベルの型・変数を持てるよう、`export {}` でモジュール化しています。
// (中身が無いのは意図的です。書く必要はありません)
export {};

type Post = {
  id: string;
  authorId: string;
  body: string;
  likes: number;
  isDeleted: boolean;
};

const posts: Post[] = [
  { id: "p001", authorId: "u1043", body: "はじめまして。", likes: 12, isDeleted: false },
  { id: "p002", authorId: "u2287", body: "今日はいい天気。", likes: 3, isDeleted: false },
  { id: "p003", authorId: "u3391", body: "新機能が出たらしい。", likes: 41, isDeleted: false },
  { id: "p004", authorId: "u9021", body: "退会前の投稿。", likes: 7, isDeleted: true },
  { id: "p005", authorId: "u1043", body: "また来ます。", likes: 1, isDeleted: false },
  { id: "p006", authorId: "u5560", body: "プレミアムにしてみました。", likes: 25, isDeleted: false },
];

// --- パート1: filter — 条件に合うものだけ残す ------------------
//
// このままだと、削除済み(isDeleted: true)の投稿も表示されてしまいます。
// filter を使って直してください。

function visiblePosts(posts: Post[]): Post[] {
  return posts; // ← ここを直す
}

console.log("表示すべき投稿数:", visiblePosts(posts).length);

// --- パート2: map — 形を変える ----------------------------------
//
// 投稿の配列から、本文(body)だけの配列を作ってください。

function bodies(posts: Post[]): string[] {
  return []; // ← ここを実装する
}

console.log("本文一覧:", bodies(posts));

// --- パート3: find — 1件だけ探す ---------------------------------
//
// すでに実装されています。まず読んで、動きを確認してください。

function findPost(id: string): Post | undefined {
  return posts.find((p) => p.id === id);
}

console.log("p003 を探す:", findPost("p003"));
console.log("存在しないIDを探す:", findPost("p999"));

// --- パート4: reduce — 集計する -----------------------------------
//
// 全投稿の いいね(likes)の合計を求めてください。

function totalLikes(posts: Post[]): number {
  return 0; // ← ここを実装する
}

console.log("いいねの合計:", totalLikes(posts));

// --- パート5: 組み合わせる ----------------------------------------
//
// 「削除されておらず、いいねが10件以上の投稿」の本文だけを、
// 配列で返してください。パート1〜2で書いた関数を組み合わせても、
// 新しく filter と map をつなげて書いても構いません。

function popularBodies(posts: Post[]): string[] {
  return []; // ← ここを実装する
}

console.log("人気投稿の本文:", popularBodies(posts));
