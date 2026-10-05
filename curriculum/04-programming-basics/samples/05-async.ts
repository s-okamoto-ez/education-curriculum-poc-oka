// ============================================================
// 演習05 — 非同期処理を読み、エラーを受け止める
// ------------------------------------------------------------
// 実行方法:  node 05-async.ts
// ============================================================
// このファイル単独でトップレベルの型・変数を持てるよう、`export {}` でモジュール化しています。
// (中身が無いのは意図的です。書く必要はありません)
export {};

type Post = { id: string; body: string };

// 実際のAPI呼び出しを、setTimeout で再現したものです。
// shouldFail を true にすると、失敗する場合を再現できます。
function fetchTimeline(shouldFail: boolean): Promise<Post[]> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error("タイムラインの取得に失敗しました(サーバーが混み合っています)"));
      } else {
        resolve([
          { id: "p001", body: "はじめまして。" },
          { id: "p002", body: "今日はいい天気。" },
        ]);
      }
    }, 300);
  });
}

// --- パート1: 成功する場合 --------------------------------------

async function loadSuccess(): Promise<void> {
  console.log("[パート1] 読み込み中...");
  const posts = await fetchTimeline(false);
  console.log("[パート1] 取得できた投稿数:", posts.length);
}

// --- パート2: 失敗する場合(try/catchで受け止める) ---------------

async function loadWithTryCatch(): Promise<void> {
  console.log("[パート2] 読み込み中...");
  try {
    const posts = await fetchTimeline(true);
    console.log("[パート2] 取得できた投稿数:", posts.length);
  } catch (error) {
    console.log("[パート2] 失敗しました:", (error as Error).message);
  }
  console.log("[パート2] ここは、成功でも失敗でも必ず実行される");
}

// --- パート3: 失敗する場合(まだtry/catchが無い) ------------------
//
// 演習の指示があるまで、この関数は呼び出さないでください。

async function loadWithoutTryCatch(): Promise<void> {
  console.log("[パート3] 読み込み中...");
  const posts = await fetchTimeline(true);
  console.log("[パート3] ここには来ないはず:", posts.length);
}

// --- 実行順 --------------------------------------------------------

async function main() {
  await loadSuccess();
  console.log("---");
  await loadWithTryCatch();
  console.log("---");
  // 演習の指示があるまで、次の行はコメントアウトのままにしてください。
  // await loadWithoutTryCatch();
}

main();
console.log("[mainの外にある、この行の実行タイミングに注目してください]");
