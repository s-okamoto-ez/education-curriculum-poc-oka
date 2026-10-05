# つながるノート 運用ツール

SNS「つながるノート」の運用担当が、日々の状況を確認するために使っているコマンドラインツールです。

**このツールは、前任の担当者が書いて、すでに1年ほど動いています。** これからあなたが引き継ぎます。

## 使い方

```
cd curriculum/04-programming-basics/samples/tsunagaru-cli
node --experimental-strip-types src/main.ts summary
```

| コマンド | やること |
|---|---|
| `summary` | サービス全体と、利用者ごとの投稿数・いいね数を出す(省略時はこれ) |
| `top` | いいねの多い投稿を上位5件出す |
| `suspended` | 停止中の利用者を一覧する |

## 構成

```
data/          運用データ(JSON)
  users.json     利用者
  posts.json     投稿
src/
  types.ts       データの形の定義
  load.ts        JSONを読み込む
  report.ts      集計する(表示はしない)
  format.ts      表示用の文字列を組み立てる
  main.ts        入口。コマンドを振り分ける
```

## 運用上の決まり

- **削除された投稿(`isDeleted: true`)は、件数にも、いいねの集計にも含めない**
- 表示名を設定していない利用者がいる。その場合は `(名前未設定)` と表示する
- 停止中の利用者(`isSuspended: true`)も、投稿は残る
