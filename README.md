# education-curriculum-poc

新人エンジニア教育事業の**入門フェーズ(4週間・約108時間)の教材**です。「専用プラットフォームを作らず、GitHub Issue + Markdown だけで展開・進捗管理できるか」を検証する試作として始まり、現在は**6トピック全体が揃った状態**になっています。

検討の経緯は事業計画リポジトリ側を参照。
[ai-engineer-education](https://github.com/k-kubo-ez/ai-engineer-education) の `.scratch/new-engineer-education/` に決定事項がある。

## 教材を作る・直す人へ

研修全体の流れは [カリキュラムの全体像](https://github.com/ezorise-labs/education-ai-engineer-wayfinder/blob/main/.scratch/new-engineer-education/curriculum-overview.md) を先に読んでください。作り方の決まりは [docs/production-guide.md](docs/production-guide.md)(制作ガイド)、やることの一覧と担当は [docs/backlog.md](docs/backlog.md)(タスク一覧)にあります。

## はじめかた

**受講者の方は [curriculum/00-getting-started.md](curriculum/00-getting-started.md)(最初の準備)から読み始めてください。** パソコンの準備ができたら [curriculum/README.md](curriculum/README.md)(トピック一覧)に進みます。

## 構成

```
curriculum/
  README.md                  トピック一覧(ロードマップ)
  01-command-line-basics/     8h
  02-git-basics/             10h
  03-html-css-basics/        26h
  04-programming-basics/     34h  ← TypeScript
  05-http-basics/            10h
  06-sql-basics/             10h
  columns/                   読み物(訓練時間には含まない)
```

トピックごとの内部構成は共通です(`curriculum/README.md` に記載)。

## 何を検証しているか

- 座学の各トピックを GitHub Issue(チェックリスト付き)として発行し、進捗を Open/Closed で可視化できるか
- 「実行前に出力を予測せよ」型の課題を Issue のコメントでやり取りする運用が回るか
- 教材本文を Markdown としてリポジトリに置き、受講者がそのまま読める形で成立するか
- 保守改修フェーズ(PR ベースのレビュー)に自然に接続する体験になっているか

Git基礎・HTTP基礎の2トピックで型が機能することを実地で確認済みです。その型を、残る4トピック(コマンドライン・HTML/CSS・プログラミング・SQL)にも展開しました。

## 教材としての設計方針

事業計画側の決定([到達水準の定義](https://github.com/k-kubo-ez/ai-engineer-education/blob/main/.scratch/new-engineer-education/issues/03-competency-bar.md)、[言語・フレームワークの確定](https://github.com/k-kubo-ez/ai-engineer-education/blob/main/.scratch/new-engineer-education/issues/14-language-selection.md))に従い、以下を全トピックで貫いています。

| 方針 | 具体 |
|---|---|
| **推測せず、見る** | 開発者ツール、`EXPLAIN ANALYZE`、`console.log`、`git status` — 各トピックに「確かめる道具」を必ず置く |
| **予測してから実行する** | AIへの丸投げを課題設計で無効化する。予測を書く欄が全演習にある |
| **言語非依存のものを厚くする** | 6トピック中5つ(64h)は言語に依存しない。TypeScript依存はプログラミング基礎のみ |
| **仕込まれた「闇」は本物らしく** | 退会ユーザーの残存投稿、インデックスの無い列、コメントアウトされた旧CSS、`as` による型チェックの迂回 |
| **1本の経路としてつなぐ** | 画面 → 通信 → コード → SQL → DB。全トピックが同じ調査経路の一区間を担当する |

同じ題材(架空SNS「つながるノート」)と同じ登場人物(`u1043` 田中、退会済みの `u9021` など)が全トピックを貫通しており、**プログラミング基礎とSQL基礎では同じ `u9021` が別の壊れ方をします。**

## 演習Issueの自動発行

このリポジトリをテンプレートとして複製すると、`curriculum/*/exercises/*.md` が**全トピック分まとめて Issue として自動発行されます**(`.github/workflows/seed-issues.yml`)。受講者ごとに個別のプライベートリポジトリを持たせ、講師は Organization Owner 権限で招待なしに閲覧できます。

各トピックのREADMEの演習表は、**このリポジトリでは `exercises/` のファイルへの相対リンク**です。Issue番号は複製先ごとに変わるため、テンプレートに焼き込むと壊れるからです。複製先では、Issueを発行し終えた直後にワークフローが**その複製のIssue URLへ書き換えてコミットします**(`scripts/link-readmes-to-issues.mjs`)。受講者は表から自分のIssueへ直接飛べます。

## 図・アイコンについて

概念の説明には、可能な範囲で図(SVG)を添えています。`curriculum/*/assets/diagrams/` にトピックごとに置いてあり、ダークモード・アクセシビリティ(`aria-label`)に対応しています。作り方の実例は [scripts/README.md](scripts/README.md) を参照してください。

図中のアイコンは、[デジタル庁が提供するイラストレーション・アイコン素材](https://www.digital.go.jp/policy-making/servicedesign/designsystem)(`designsystem-assets.zip`、CC相当の緩い利用規約で商用・改変可)を元に、各図のテーマに合わせて配色・サイズを調整し、SVGパスを個別に組み込んで使用しています。素材そのものの著作権はデジタル庁に帰属します。

## 教材を書き換えるときは

**コミット前に検証スクリプトを回してください。**

```bash
node scripts/verify.mjs        # Docker不要。リンク・図・Issue・サンプル実行
node scripts/verify-db.mjs     # Dockerが要る。SQL基礎の数字と実行計画
```

**教材に書いた「こうなる」と、実物の挙動を突き合わせます。** 実際に初版では「約4000倍速くなる」(実測130倍)、「`Index Scan` に変わる」(実際は `Bitmap Index Scan`)といったズレが起きており、いずれも**実機で回して初めて発覚**しました。目視レビューでは見つかりません。

詳細と、教材を足すときのチェックリストは [scripts/README.md](scripts/README.md) にあります。

## 現状の充足率

**枠の5〜7割です。** [`16-intro-phase-content.md`](https://github.com/k-kubo-ez/ai-engineer-education/blob/main/.scratch/new-engineer-education/issues/16-intro-phase-content.md) が定めた98時間に対し、現在の教材は52〜72時間分(2026-09-25時点、演習56本)。

下の「現状」は、各トピックREADMEの演習表にある目安時間の合計です。**幅があるのは、演習ごとの目安が「90〜120分」のように幅で書かれているため**で、下限と上限をそれぞれ足しています。

| トピック | 枠 | 現状 | 演習 |
|---|---|---|---|
| コマンドライン基礎 | 8h | 2.7〜3.8h | 6本 |
| Git基礎 | 10h | 3.0〜4.4h | 6本 |
| HTML/CSS基礎 | 26h | 10.9〜15.7h | 12本 |
| プログラミング基礎 | 34h | 25.5〜33.5h | 16本 |
| HTTP基礎 | 10h | 5.4〜7.6h | 10本 |
| SQL基礎 | 10h | 4.8〜6.9h | 6本 |

**プログラミング基礎は上限側でほぼ枠を使い切っています。** ここに演習を足すときは、先に枠の配分そのものを見直してください。

「型が通用するか」と「6トピックが1本の道になっているか」の確認という当初の目的は、環境構築・演習6〜7本・図解・トピック横断の一貫性(`u9021`の複数トピックでの再登場、秘密情報の扱いなど)がすべてのトピックで揃ったことで達成できています。本番ボリューム(98h)への拡充は引き続き進行中です。

なお **98時間という数字自体が未実測の推定値**(16番の記載)であり、私が書いた所要時間もすべて見積もりです。実施して測るまでは、どちらも暫定です。

## 位置づけ

計画フェーズの成果物であり、実施を通じて改善していく前提。**所要時間はすべて未実測の見積もり**です。
