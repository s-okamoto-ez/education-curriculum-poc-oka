// ============================================================
// 演習06 — 見つからないかもしれないデータを、安全に読む
// ------------------------------------------------------------
// 「つながるノート」のユーザー検索窓を実装します。
// 名前の一部で検索し、見つかったユーザーのプロフィールを表示します。
//
// 実行方法:  node 06-search-and-render.ts
// 型チェック: npm run typecheck(親フォルダで)
// ============================================================
// このファイル単独でトップレベルの型・変数を持てるよう、`export {}` でモジュール化しています。
// (中身が無いのは意図的です。書く必要はありません)
export {};

type Profile = {
  bio: string;
};

type User = {
  id: string;
  name: string;
  profile?: Profile; // プロフィールを設定していないユーザーはundefined
};

const users: User[] = [
  { id: "u1043", name: "田中太郎", profile: { bio: "エンジニアです。" } },
  { id: "u2287", name: "佐藤花子", profile: { bio: "デザイン担当。" } },
  { id: "u3391", name: "鈴木一郎" }, // 登録したばかりで、プロフィールをまだ設定していない
  { id: "u9021", name: "退会済みユーザー" }, // 退会処理でプロフィールが削除された(投稿はp004として残っている。演習03参照)
];

// --- パート1: search — 名前の一部で検索する -------------------------------
//
// 検索ボックスの入力には、前後の余計な空白が入ることがあります。
// 今のままだと、名前が1文字でも完全に一致しない限り何もヒットしません。

function searchUsers(users: User[], keyword: string): User[] {
  return users.filter((u) => u.name === keyword); // ← ここを直す(trim + 部分一致)
}

console.log("「 太郎 」で検索:", searchUsers(users, " 太郎 "));

// --- パート2: render — 見つかったユーザーを安全に表示する ---------------------
//
// プロフィールを設定していないユーザーもいます。
// そのまま `.bio` を読むと、演習03で見たのと同じ種類のエラーになります。

function renderProfile(user: User): string {
  return `${user.name}: ${user.profile.bio}`; // ← ここを直す(?. と ?? を使う)
}

for (const user of users) {
  console.log(renderProfile(user));
}
