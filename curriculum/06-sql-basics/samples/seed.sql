-- ============================================================
-- つながるノート — SQL基礎の演習用データ
-- ------------------------------------------------------------
-- このファイルは docker compose up -d のときに自動で読み込まれます。
-- 手で実行する必要はありません。
--
-- 実務のデータベースに近づけるため、以下を意図的に含めています:
--   * 退会したユーザーの投稿が残っている(参照先が無い行)
--   * 一部の列にインデックスが張られていない
--   * 使われていない列がある
-- ============================================================

-- --- ユーザー -----------------------------------------------

CREATE TABLE users (
  id            TEXT        PRIMARY KEY,
  name          TEXT        NOT NULL,
  is_premium    BOOLEAN     NOT NULL DEFAULT false,
  registered_at DATE        NOT NULL,
  -- 2020年に追加されたが、結局使われていない列
  nickname      TEXT
);

INSERT INTO users (id, name, is_premium, registered_at) VALUES
  ('u1043', '田中', true,  '2021-04-02'),
  ('u2287', '佐藤', false, '2019-11-30'),
  ('u3391', '鈴木', true,  '2024-06-15'),
  ('u4415', '高橋', false, '2018-02-08'),
  ('u5560', '伊藤', true,  '2023-09-21'),
  ('u7712', '渡辺', false, '2025-01-12'),
  ('u8834', '山本', true,  '2018-07-04');

-- --- 投稿 ---------------------------------------------------

CREATE TABLE posts (
  id          TEXT        PRIMARY KEY,
  author_id   TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  likes       INTEGER     NOT NULL DEFAULT 0,
  posted_at   TIMESTAMP   NOT NULL
);

-- ⚠ author_id に外部キー制約もインデックスも張られていません。
--    実務では「昔のシステムから移行したときに落ちた」といった経緯でこうなります。

INSERT INTO posts (id, author_id, body, likes, posted_at) VALUES
  ('p001', 'u1043', 'はじめまして。よろしくお願いします。',      12, '2026-08-01 09:12:00'),
  ('p002', 'u2287', '今日はいい天気ですね。',                      3, '2026-08-01 10:40:00'),
  ('p003', 'u3391', '新機能が出たらしい。使ってみます。',         41, '2026-08-02 14:05:00'),
  -- 投稿者はすでに退会しており、users テーブルに存在しません
  ('p004', 'u9021', 'この投稿だけが残っています。',                7, '2026-08-02 18:33:00'),
  ('p005', 'u1043', 'また来ます。',                                1, '2026-08-03 08:01:00'),
  ('p006', 'u5560', 'プレミアムにしてみました。',                 25, '2026-08-03 12:22:00'),
  ('p007', 'u8834', '投稿上限が変わったんですね。',               18, '2026-08-04 19:47:00'),
  ('p008', 'u3391', '写真を上げるのが楽しい。',                   63, '2026-08-05 07:30:00'),
  ('p009', 'u2287', 'メンテナンスお疲れさまです。',                2, '2026-08-05 21:15:00'),
  ('p010', 'u1043', 'そろそろ1年になります。',                     9, '2026-08-06 11:58:00'),
  -- こちらも退会済みユーザー
  ('p011', 'u9021', '退会しても投稿は消えないんですね。',          4, '2026-08-06 16:20:00'),
  ('p012', 'u7712', 'はじめて投稿します。',                        0, '2026-08-07 13:09:00');

-- --- いいね -------------------------------------------------

CREATE TABLE likes (
  user_id   TEXT        NOT NULL,
  post_id   TEXT        NOT NULL,
  liked_at  TIMESTAMP   NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

INSERT INTO likes (user_id, post_id) VALUES
  ('u1043', 'p003'), ('u1043', 'p008'), ('u1043', 'p006'),
  ('u2287', 'p003'), ('u2287', 'p008'),
  ('u3391', 'p001'), ('u3391', 'p007'),
  ('u5560', 'p008'), ('u5560', 'p003'), ('u5560', 'p001'),
  ('u7712', 'p008'),
  ('u8834', 'p003'), ('u8834', 'p008');

-- --- アクセスログ(インデックスの演習用に大量に入れます) ----

CREATE TABLE access_logs (
  id          BIGSERIAL   PRIMARY KEY,
  user_id     TEXT        NOT NULL,
  path        TEXT        NOT NULL,
  status      INTEGER     NOT NULL,
  duration_ms INTEGER     NOT NULL,
  accessed_at TIMESTAMP   NOT NULL
);

-- 100万行を機械的に作ります。初回起動時に時間がかかります(1〜3分程度)。
INSERT INTO access_logs (user_id, path, status, duration_ms, accessed_at)
SELECT
  'u' || LPAD(((n::BIGINT * 7919) % 9999)::TEXT, 4, '0'),
  (ARRAY['/api/posts', '/api/timeline', '/api/users/me', '/login', '/api/search'])[1 + (n % 5)],
  (ARRAY[200, 200, 200, 200, 304, 404, 500])[1 + (n % 7)],
  8 + (n % 190),
  TIMESTAMP '2026-08-01 00:00:00' + (n % 604800) * INTERVAL '1 second'
FROM generate_series(1, 1000000) AS n;

-- ⚠ access_logs.user_id にはインデックスがありません。
--    演習3で、この状態と、インデックスを張った状態を比べます。

ANALYZE;
