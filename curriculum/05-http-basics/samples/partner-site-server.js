// ============================================================
// 演習10で使う、「つながるノート」とは別の会社が運営する
// 「お知らせ集約サイト」のサーバーです。まったく別のオリジン
// (http://localhost:3400)から、つながるノートのAPI(3300番)を
// 呼び出そうとします。
//
// 起動:  node partner-site-server.js
// 停止:  Ctrl + C
// ============================================================

const http = require("http");

const PAGE = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>お知らせ集約サイト(別会社運営)</title>
</head>
<body>
  <h1>お知らせ集約サイト</h1>
  <p>つながるノートの投稿を、このサイトにも埋め込んで表示したい。</p>
  <button id="load">つながるノートの投稿を読み込む</button>
  <ul id="posts"></ul>
  <p id="error" style="color:red;"></p>

  <script>
    document.getElementById("load").addEventListener("click", async () => {
      const errorEl = document.getElementById("error");
      const ul = document.getElementById("posts");
      errorEl.textContent = "";
      ul.innerHTML = "";
      try {
        const res = await fetch("http://localhost:3300/api/posts");
        const posts = await res.json();
        for (const p of posts) {
          const li = document.createElement("li");
          li.textContent = p.body;
          ul.appendChild(li);
        }
      } catch (err) {
        errorEl.textContent = "読み込みに失敗しました。コンソールを確認してください。";
        console.error(err);
      }
    });
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(PAGE);
});

const PORT = 3400;
server.listen(PORT, () => {
  console.log(`お知らせ集約サイト: http://localhost:${PORT}`);
  console.log("止めるときは Ctrl + C");
});
