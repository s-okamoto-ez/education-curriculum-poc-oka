# 教材の検証スクリプト

教材を書き換えたら、**コミットする前にこれを実行してください。**

```bash
node scripts/verify.mjs        # Docker不要。数十秒
node scripts/verify-db.mjs     # Dockerが要る。数分
```

どちらも問題があれば終了コード 1 を返します。

> [!IMPORTANT]
> **このスクリプトが存在する理由は、「教材にこう書いた」と「実際にこう動く」がズレるからです。**
>
> 実際に、SQL基礎の初版では次のズレが起きていました。すべて**書いた本人は気づいておらず、実機で回して初めて発覚**しました。
>
> - 図に「約4000倍速くなる」と書いたが、実測は約130倍だった
> - 演習で「`Seq Scan` が `Index Scan` に変わる」と書いたが、実際に出るのは `Bitmap Index Scan` だった
> - 「インデックスを張っても使われない」ことを見せる演習が、**実際には使われてしまい成立していなかった**
>
> **人間の目視レビューでは、この種のズレは見つかりません。** 動かして突き合わせるしかありません。

## verify.mjs — 静的な検証(Docker不要)

| 見るもの | 何を防ぐか |
|---|---|
| 相対リンク・画像の実在 | ファイルを動かしたときのリンク切れ |
| SVGのタグ対応 | 図が表示されない |
| SVGの `aria-label` / `role="img"` | 読み上げ環境で図が伝わらない |
| SVGのダークモード指定 | ダークテーマで文字が読めなくなる |
| SVGの背景と `viewBox` の一致 | 背景が欠ける |
| SVG内への Markdown 記法の混入 | `**太字**` がそのまま文字として出る |
| 要素が `viewBox` の外に出ていないか | 図の一部が切れる |
| Issue自動発行のドライラン | 見出し欠落・タイトル重複・cheatsheet 欠落 |
| HTML/CSSサンプルのタグ・ブレース対応 | 演習中に閉じタグや `}` を消してしまう編集ミス |
| **サンプルコードの実行結果** | **教材が予測させている出力と、実物のズレ** |

オプション:

```bash
node scripts/verify.mjs --skip-samples   # サンプル実行を飛ばす(速い)
node scripts/verify.mjs --list-issues    # 発行されるIssueのタイトル一覧を出す
```

サンプルの型チェックには、事前に一度だけ準備が要ります。

```bash
cd curriculum/04-programming-basics/samples && npm install
```

## verify-db.mjs — DBを使った検証

**SQL基礎の教材が「こうなる」と書いている内容を、実物のPostgreSQLで確かめます。**

検証する内容は [`claims-db.json`](claims-db.json) にあります。件数、実行計画、そして**その主張が教材のどこに書かれているか**(`where`)がセットで書いてあります。

- DBが起動していなければ自動で起動し、終わったら停止します(データは残ります)
- 検証の前後でインデックスを消し、**受講者が始める状態に戻します**
- Windowsで `docker` が WSL の中にしか無い場合、**自動的に wsl 経由で実行します**
- Dockerが見つからない場合は、失敗ではなく**スキップ**して終了します

```bash
node scripts/verify-db.mjs --keep-up   # 終了後もDBを起動したままにする
```

### 教材を書き換えたときは

**教材の数字を変えたら、`claims-db.json` も一緒に直してください。** 逆に、このスクリプトが落ちたら、**教材が間違っているか、claims が古いかのどちらか**です。どちらなのかを必ず確かめてください。

新しい主張を足すときは、`claims-db.json` に1件足すだけです。

```json
{
  "kind": "scalar",
  "where": "どの教材のどこに書いてあるか",
  "desc": "人間が読む説明",
  "sql": "SELECT count(*) FROM ...",
  "expect": "42"
}
```

実行計画を確かめたいときは `kind: "plan"` を使います。`contains` に `"Index Scan"` と書くと、**`Bitmap Index Scan` と `Index Only Scan` も一致とみなします**(PostgreSQLがどの形を選ぶかはデータ量で変わるため)。

## build-issue-body.mjs — 演習Markdown → Issueのタイトルと本文

`seed-issues.yml` が演習Issueを発行するときに使います。単体でも動かせます。

```bash
node scripts/build-issue-body.mjs curriculum/01-command-line-basics/exercises/01-where-am-i.md
node scripts/build-issue-body.mjs curriculum/01-command-line-basics/exercises/01-where-am-i.md --title
```

> [!IMPORTANT]
> **Issue本文の相対パスは、ファイルビューとは基準が変わります。**
>
> `curriculum/01-command-line-basics/exercises/01-where-am-i.md` に書いた `../assets/diagrams/x.svg` は、ファイルとして見れば正しく解決されます。しかしIssueに転記されると `/OWNER/REPO/issues/1` が基準になり、`/OWNER/REPO/assets/diagrams/x.svg` を指して404になります。
>
> このスクリプトが、教材内の相対パスを絶対URLへ直してからIssueにします。**演習ファイル側は相対パスのままで構いません。**

行き先はリンクと画像で変えています。**ここを取り違えると図が出ません。**

| 対象 | 行き先 | |
|---|---|---|
| リンク(`.md` など) | `/blob/` | ファイルのページ |
| 画像(`<img>`, `![]()`) | `/raw/` | 画像の実体 |

Privateリポジトリでも、`/raw/` なら図はIssue上に**そのまま表示されます**。`github.com` と同一オリジンなので、閲覧者のセッションでそのまま取得でき、画像プロキシを経由しないためです。`/blob/` はHTMLページ、`raw.githubusercontent.com` は認証が通らず、どちらも表示されません。**Issueのコメント欄のPreviewで実測して確かめた結果です。**

演習ファイルにこう書いてあれば、

```markdown
<img src="../assets/diagrams/at-a-glance-where-am-i.svg" alt="今日やること: …" width="100%">

コラム「[なぜWebページは崩れるのか](../../columns/why-layouts-break.md)」で読んだ…
```

Issueにはこうなります。

```markdown
<img src="https://github.com/OWNER/REPO/raw/main/curriculum/01-command-line-basics/assets/diagrams/at-a-glance-where-am-i.svg" alt="今日やること: …" width="100%">

コラム「[なぜWebページは崩れるのか](https://github.com/OWNER/REPO/blob/main/curriculum/columns/why-layouts-break.md)」で読んだ…
```

`alt` や `width` はそのまま残るので、見た目はファイルビューと変わりません。リポジトリの外を指す相対パスは、書き換えずに警告を出して残します。黙って壊さないためです。

## link-readmes-to-issues.mjs — トピックREADMEの演習リンクをIssueへ向ける

トピックREADMEの演習表は、テンプレート側では `exercises/NN-*.md` への相対リンクです。**Issue番号は複製先ごとに変わるため、テンプレートに番号を焼き込めません。** 代わりに、複製先でIssueを発行し終えた直後にこのスクリプトが走り、その複製のIssue URLへ書き換えます(`seed-issues.yml` が呼びます)。受講者は表から自分のIssueへ直接飛べます。

```bash
node scripts/link-readmes-to-issues.mjs --map <ファイル>   # 発行直後(ワークフロー用)
node scripts/link-readmes-to-issues.mjs --repo OWNER/REPO  # 発行済みリポジトリの後追い修正
node scripts/link-readmes-to-issues.mjs --repo OWNER/REPO --dry-run
```

`--map` は「演習ファイルのパス（タブ）Issue URL」が並んだファイルで、`gh issue create` の出力からワークフローが作ります。`--repo` はタイトルで突き合わせるので、既に発行済みのリポジトリを後から直すときに使えます。

対応の取れなかったリンクは**相対パスのまま据え置き**、終了コード1で知らせます。黙って壊さないためです。

> [!IMPORTANT]
> **このリポジトリ(テンプレート本体)でこのスクリプトを実行しないでください。** 表が本体のIssue番号に固定され、複製先で誤ったリンクが配られます。相対リンクのままが正しい状態です。

## fix-seeded-issues.mjs — 発行済みIssueの貼り直し

既に発行された演習Issueの本文を、いまの演習Markdownから作り直して貼り直します。**一度きりの後始末用**で、通常の教材更新では使いません。

```bash
node scripts/fix-seeded-issues.mjs           # 何が変わるか出すだけ
node scripts/fix-seeded-issues.mjs --apply   # 実際に貼り直す
```

`gh` CLI が認証済みである必要があります(`gh auth status` で確認)。Issueと演習ファイルは**タイトルで突き合わせ**、一致しないものと重複するものは触りません。

## 教材を足すときのチェックリスト

新しい演習やトピックを作ったら、以下を満たしているか確認してください。**`verify.mjs` が機械的に見てくれる項目には ✓ を付けています。**

- ✓ 演習ファイルの1行目が `# NN. タイトル` の形式になっている
- ✓ トピックに `README.md` と `cheatsheet.md` の両方がある
- ✓ 図に `aria-label`(20文字以上の説明)とダークモード指定がある
- ✓ 相対リンクがすべて実在する
- ✓ HTML/CSSサンプルのタグ・ブレースが対応している
- **サンプルコードを追加したら、`verify.mjs` に実行確認を足す**
- **SQLの数字を教材に書いたら、`claims-db.json` に足す**
- トピックREADMEの演習表は、**Issue番号ではなく `exercises/` への相対パス**で書く(複製先で番号が変わるため。複製先のIssue URLへの差し替えは `link-readmes-to-issues.mjs` が自動で行う)
- 演習ファイルの中のリンクや図も**相対パスのまま書く**。Issue発行時に `build-issue-body.mjs` が絶対URLへ直すので、手で絶対URLを書かない(所有者が変わると壊れるため)
- **TypeScriptのサンプルファイルには、冒頭に `export {};` を1行入れる**(下記参照)

最後の5つは自動では検出できません。**教材に新しい「主張」を書いたら、それを検証する行を足す**、と覚えてください。

### なぜ `export {};` が要るのか

`tsconfig.json` は `samples/` 直下の `*.ts` を全部まとめてコンパイルします。`import` も `export` も無いファイルは、TypeScriptに「グローバルスクリプト」として扱われ、**トップレベルの型名・変数名が全ファイルで共有されます。** 別々の演習ファイルがどちらも `type Post` のような同じ名前を使うと、`Duplicate identifier` エラーで両方とも壊れます(プログラミング基礎の04・05を追加したときに実際に発生し、`verify.mjs` の型チェックで検出しました)。

**新しいサンプル `.ts` ファイルを作るときは、必ずヘッダーコメントの直後に `export {};` を1行入れてください。** これでファイルが独立した「モジュール」として扱われ、他のファイルと型名が衝突しなくなります(中身が空でも構いません。書く必要はありません)。
