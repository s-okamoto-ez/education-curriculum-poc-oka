// ============================================================
// 演習04・05・06で使う、架空のSNS「つながるノート」のAPIサーバーです。
// 本物のサーバーの動きを、いちばん小さい形で再現しています。
//
// 起動:  node server.js
// 停止:  Ctrl + C
// ============================================================

const http = require("http");

const posts = [
  { id: "p001", body: "はじめまして。", likes: 12 },
  { id: "p002", body: "今日はいい天気。", likes: 3 },
];

const comments = {
  p001: [{ id: "c001", body: "いいね！" }],
  p002: [],
};

const VALID_TOKEN = "tsunagaru-secret-token";

const PAGE = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>つながるノート — 演習05</title>
</head>
<body>
  <h1>つながるノート</h1>
  <button id="load-posts">投稿を読み込む</button>
  <button id="load-me">プロフィールを読み込む(未ログイン)</button>
  <ul id="posts"></ul>

  <script>
    document.getElementById("load-posts").addEventListener("click", async () => {
      const res = await fetch("/api/posts");
      const posts = await res.json();
      const ul = document.getElementById("posts");
      ul.innerHTML = "";
      for (const p of posts) {
        const li = document.createElement("li");
        li.textContent = p.body + "(いいね " + p.likes + ")";
        ul.appendChild(li);
      }
    });

    document.getElementById("load-me").addEventListener("click", async () => {
      const res = await fetch("/api/me");
      console.log("プロフィール取得:", res.status);
    });
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  if (req.url === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(PAGE);
    return;
  }

  if (req.url === "/api/posts" && req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "X-RateLimit-Remaining": "42",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(posts));
    return;
  }

  if (req.url && req.url.startsWith("/api/posts/") && req.url.endsWith("/like") && req.method === "GET") {
    const id = req.url.replace("/api/posts/", "").replace("/like", "");
    const post = posts.find((p) => p.id === id);
    if (!post) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "投稿が見つかりません" }));
      return;
    }
    post.likes++;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(post));
    return;
  }

  if (req.url && req.url.startsWith("/api/posts/") && req.method === "GET") {
    const id = req.url.replace("/api/posts/", "");
    const post = posts.find((p) => p.id === id);
    if (!post) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "投稿が見つかりません" }));
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(post));
    return;
  }

  if (req.url && req.url.startsWith("/api/comments") && req.method === "GET") {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const postId = url.searchParams.get("postId");
    const list = comments[postId];
    if (!list) {
      res.writeHead(404);
      res.end("コメントが見つかりません");
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(list));
    return;
  }

  if (req.url === "/old-page" && req.method === "GET") {
    res.writeHead(301, { Location: "/new-page" });
    res.end();
    return;
  }

  if (req.url === "/new-page" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("新しいページです。");
    return;
  }

  if (req.url === "/login" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("ログインページです。ここでログインしてください。");
    return;
  }

  if (req.url && req.url.startsWith("/mypage") && req.method === "GET") {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const token = url.searchParams.get("token");
    if (token !== VALID_TOKEN) {
      res.writeHead(302, { Location: "/login" });
      res.end();
      return;
    }
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("マイページです。ようこそ、田中さん。");
    return;
  }

  if (req.url === "/api/me" && req.method === "GET") {
    const auth = req.headers["authorization"];
    if (!auth) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "ログインしてください" }));
      return;
    }
    if (auth !== `Bearer ${VALID_TOKEN}`) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "権限がありません" }));
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ id: "u1043", name: "田中" }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
});

const PORT = 3300;
server.listen(PORT, () => {
  console.log(`つながるノート API サーバー: http://localhost:${PORT}`);
  console.log("止めるときは Ctrl + C");
});
