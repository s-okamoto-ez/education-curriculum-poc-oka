# 入門フェーズ 制作ガイド

入門フェーズの教材を作る人・直す人・教える人のためのガイドです。事業計画リポジトリ([education-ai-engineer-wayfinder](https://github.com/ezorise-labs/education-ai-engineer-wayfinder))で決めたことのうち、**入門の教材づくりに要るものだけ**を抜き出しています。決定の理由や経緯は、各節のリンク先のチケットにあります。

研修全体の流れは、先に [カリキュラムの全体像](https://github.com/ezorise-labs/education-ai-engineer-wayfinder/blob/main/.scratch/new-engineer-education/curriculum-overview.md) で確かめてください。やることの一覧は [タスク一覧](backlog.md) にあります。教材の生成はClaude Codeに任せてかまいません。

> [!NOTE]
> 本編(共通導入・AI導入モジュールを含む)の教材は [education-main-phase-poc](https://github.com/ezorise-labs/education-main-phase-poc) 側にあり、制作ガイドも別にあります。

## このガイドの使い方

全部を読む必要はありません。これからやる作業に合わせて、次の節だけを読んでください。

| これからやる作業 | 読む節 |
|---|---|
| 演習を新しく作る・直す | §2 作り方の決まり、§3 AIの扱い、その単元の節(§4・§5) |
| ストレッチを作る | §6 |
| コラムを書く | §7 |
| 教材を自分で解いて確かめる(自己検証・試行) | §8 |
| 教える準備をする | §10 |

判断に迷ったときは、末尾の「[迷ったときの判断](#迷ったときの判断)」を見てください。

## 1. 入門フェーズの全体像

**約120時間・7単元。**順序は変えません(道具 → 見た目 → ロジック → バックエンド → つなぐ)。

| # | 単元 | 必修の時間 | ストレッチ |
|---|---|---|---|
| 1 | コマンドライン基礎 | 6h | 約1h |
| 2 | Git基礎 | 10h | 約2h |
| 3 | HTML/CSS基礎 | 20h | 約4h |
| 4 | プログラミング基礎 | 50h | 約10h |
| 5 | HTTP基礎 | 8h | 約2h |
| 6 | SQL基礎 | 10h | 約2h |
| 7 | つなぐ(ミニつながるノート) | 約10h | 約2h |
| | バッファ | 6h | |
| | 合計 | 約120h | 約23h(必修の時間に含まれる。計画届には書かない) |

- 時間はすべて未実測の推定値です。12月末に試行の実測で1回見直します(プログラミング基礎が約65hを超えたら、入門を約150hに延ばす案Bに切り替えます)
- 1日の訓練時間は6時間です。演習の目安時間は、この6時間に収まるように設計してください。自習前提の分量にすると、助成金で「予習・復習が主目的」とみなされるおそれがあります

**入門の出口**は「本編のコードを読めて、立ち上げられ、エラーがどの層で起きているかを切り分けられる」状態です。プログラミング基礎だけは「小さく書ける」まで求めます(下記4)。

→ [入門フェーズの週次/日次コンテンツ構成](https://github.com/ezorise-labs/education-ai-engineer-wayfinder/blob/main/.scratch/new-engineer-education/issues/16-intro-phase-content.md)、[本編で躓く要素を入門で消化する](https://github.com/ezorise-labs/education-ai-engineer-wayfinder/blob/main/.scratch/new-engineer-education/issues/18-intro-main-seam.md)、[入門フェーズのプログラミング基礎の時間](https://github.com/ezorise-labs/education-ai-engineer-wayfinder/blob/main/.scratch/new-engineer-education/issues/24-programming-basics-hours.md)

## 2. 教材の作り方の決まり

### 型

- READMEの冒頭は必ず「何を学ぶか・どう進めるか」の概要から始める
- 型は単元の性質で使い分ける。画面に結果がすぐ出る単元(HTML/CSSなど)は実践寄り、挙動が目に見えない単元(Gitなど)は概念を先に説明する
- 配り方はGitHub Issue(チェックリスト付き)+ Markdown + 「予測してから実行する」演習。演習ファイルは `curriculum/*/exercises/*.md` に置けばIssueとして自動発行される
- 各単元に「確かめる道具」を必ず置く(開発者ツール、`EXPLAIN ANALYZE`、`console.log`、`git status` など)。推測させず、見させる

### 扱うもの・扱わないもの

| 扱う | 扱わない(本編で実物と一緒に扱う) |
|---|---|
| ツールを入れて、バージョン確認で動作を確かめるところまで(各単元の冒頭に「入れる→確かめる」) | インストールが失敗したときの環境ごとのトラブル対応、複数バージョンの共存、エディタの込み入った設定 |
| | テストの書き方、デバッグ手法、検索操作 |
| | React(必修では扱わない。「つなぐ」のストレッチでのみ扱う) |

### 題材

- 全単元を架空のSNS「つながるノート」と共通の登場人物(`u1043` 田中、退会済みの `u9021` など)で貫く
- 仕込む「闇」は本物らしく(退会ユーザーの残存投稿、インデックスのない列、コメントアウトされた旧CSS、`as` による型チェックの迂回など)。AIに「レガシーっぽく」と頼むと教科書的に不自然な汚さが出るので、現場にありそうかを人が判定する
- 6単元のうち5つは言語に依存しない。受講者に残すのは、配属先の言語が変わっても持ち越せるもの(言語は教材の素材であって商品ではない)

### 本編とつながっている箇所(壊さないこと)

入門の題材の一部は、本編のチケットで回収されます。次の箇所を変えるときは、本編の教材と食い違わないか確認してください。

| 入門側 | 本編での回収 |
|---|---|
| SQL基礎 演習04: `posts.likes`(非正規化列)と `likes` テーブルの件数の食い違い | 本編チケット#12「なぜ食い違ったままなのか」 |
| SQL基礎の「2019年以前に登録したユーザー」という区切り | 本編チケット#2(プレミアム会員の投稿上限の例外)、後半の予約投稿 |
| 使われていない `nickname` 列 | 本編チケット#1(実は新機能で使われ始めている) |
| `posts.author_id` にFK/インデックスがない(旧システムからの移行で落ちた、という設定) | 本編の由来不明コードの原型 |
| 退会済みの `u9021` | 本編の通知まわりでも同じ人物が壊れる |
| HTTP基礎の `server.js`(演習07〜11) | 「つなぐ」単元の出発点(下記5) |

→ [本編(保守改修フェーズ)のコンテンツ構成](https://github.com/ezorise-labs/education-ai-engineer-wayfinder/blob/main/.scratch/new-engineer-education/issues/17-main-phase-content.md)

## 3. AIの扱い

**入門のルール: コーディングエージェント(Claude Code等)は不可。チャットで聞くのは可。**全員に適用します(経験者も含む)。

- 用語や概念、エラーの意味をAIに聞くのは調査であり、推奨する
- ルールは守らせられない前提で、禁止ではなく課題の作り方でAIに投げる動機を消す
  - 「書け」ではなく「実行前に出力を予測せよ」「1行ずつ説明せよ」「バグを1つ埋めた。どこが悪いか指摘せよ」
  - 書かせる場合は5〜10行の粒度に刻む(AIに投げるより自分で書いたほうが速い粒度)
- コードを貼って直したコードをもらう抜け道は残る。拾うのは入門末の口頭確認と「空のファイルから書く」課題。受講者には「直したコードを受け取っても、説明できなければ口頭確認で分かる」と伝える
- 合流後の扱い: 共通導入2日間もエージェント不可・チャット可。AI導入モジュールの後に全面解禁する。教材に「本編に入ったら全面解禁」と書いている箇所は、この順序に直す

→ [AI活用の指針](https://github.com/ezorise-labs/education-ai-engineer-wayfinder/blob/main/.scratch/new-engineer-education/issues/06-ai-usage-policy.md) 3・4、[PR前にClaudeが理解度を問うゲートの導入](https://github.com/ezorise-labs/education-ai-engineer-wayfinder/blob/main/.scratch/new-engineer-education/issues/20-pr-comprehension-gate.md) 8

## 4. プログラミング基礎(50h)

- 中身はTypeScript + 素のDOM操作。JavaScriptは経由せず、最初からTypeScriptで教える。冒頭で「TSはJSに型を足したもの」と一言つなぐ
- Reactは扱わない(素のDOMを知らないと、Reactが何を解決しているのか分からないため)
- 到達水準は「読める」+「小さく書ける」。数十行の関数や条件分岐の追加を自力で書け、型エラーを自分で直せること。「素のDOMで小さなアプリを1本書き切る」までは求めない
- 非同期は「読める」水準。`async/await` の実行順序、`await` を忘れたときの症状(`Promise { <pending> }`)、Promiseが何を返すか。ソースを追って何が起きているかを判断できればよい。Promiseは図解でかみ砕く
- 最後の8〜10hは「空のファイルから書く」必修課題。題材は `tsunagaru-cli` の機能1つ。AIにコードを生成させないルールはそのまま

→ [入門フェーズのプログラミング基礎の時間](https://github.com/ezorise-labs/education-ai-engineer-wayfinder/blob/main/.scratch/new-engineer-education/issues/24-programming-basics-hours.md)

## 5. 「つなぐ」単元(約10h)

題材は**ミニつながるノート**(投稿の一覧表示と投稿の追加だけ)。TODOリストにはしない(題材の線が切れるため)。

| 区分 | 内容 | 時間 |
|---|---|---|
| 導入 | ミニつながるノートの完成形を触る | 1h |
| 必修 | 直書きの `posts` 配列を、DBへの問い合わせに置き換える(`pg`、`DATABASE_URL`) | 3〜4h |
| 必修 | 既存のデモ画面に投稿フォームを足し、POST → INSERTを通す | 3〜4h |
| 必修 | DBとAPIをDocker Composeでまとめる | 2h |
| ストレッチ | 画面をReactで書き直す / 同じものを空のファイルから書き直す | 計上しない |

- 単元の開始時に「HTTP基礎の演習07〜11を直し終えた版」の `server.js` を配り直す(全員を同じ出発点にそろえる)
- JavaScript(CommonJS)のまま育てる。冒頭で「なぜここはJavaScriptなのか」を一言説明する(サーバー側のTypeScriptとDrizzleは本編の共通導入で扱う)
- 手順は5〜10行の粒度に刻む
- 入門初日には、ミニつながるノートの完成形を見せ、7単元がどこに効くかを1枚の図で示す
- この単元は、合流から受ける経験者の事前学習と事前確認にも使う。経験者は `server.js` を持っていないので、渡すのは入門の教材すべて(知っている部分は飛ばしてもらう)。教材だけで完結するように書く

→ [本編で躓く要素を入門で消化する](https://github.com/ezorise-labs/education-ai-engineer-wayfinder/blob/main/.scratch/new-engineer-education/issues/18-intro-main-seam.md) 3〜5・9、[受講者の受け入れ方(入口を1つにするか)](https://github.com/ezorise-labs/education-ai-engineer-wayfinder/blob/main/.scratch/new-engineer-education/issues/32-single-entry-point.md)

## 6. ストレッチ(Extra credit)

### 置き方と扱い

- 各単元の演習の末尾に「Extra credit」節を置き、同じ題材を広げる。別の題材にはしない。難易度の違う2つの版から選ばせる形にもしない
- 冒頭に「ストレッチはやらなくても何も困らない」と書く
- 分量は必修の時間の約2割(上の表)。早い受講者が必修を8割の時間で終えるという仮置きの数字で、春期の実施で置き換える
- 評価には入れない。計画届にも書かない
- ストレッチが尽きたら、次の単元の演習に前倒しで進んでよい

### 問いの作り方

- 難易度の順に並べ、最後の節はあえて難しくする。教材に「ここから先は解けなくて当たり前」と書く
- 後半の節は答えが受講者の手元にしかない問いにする(自分の環境で実行して計測する / ログや挙動を観察して説明する / 題材のコード固有の不自然な点を探す / わざと壊して何が起きるかを予測してから確かめる)。防げるのは「問題文をそのまま貼るだけで解ける」ことまでで、それ以上の対策はしない
- ひねくれた課題にはしない

→ [入門フェーズのストレッチ教材](https://github.com/ezorise-labs/education-ai-engineer-wayfinder/blob/main/.scratch/new-engineer-education/issues/23-intro-stretch-content.md)

## 7. コラム

訓練時間の外で読む、興味を持たせるための読み物です。

| 種類 | 置き場所 | 分量 |
|---|---|---|
| インラインコラム | 教材README内の `[!NOTE]` | 3〜6行 |
| 独立コラム | `curriculum/columns/*.md` | 800〜1500字 |

1. 冒頭に必ず「読まなくても演習は完了できます」と書く
2. 各単元READMEの末尾に「もっと知りたい人へ」節を置き、関連コラムへリンクする
3. 末尾に「AIへの質問例」を1〜2個添える
4. 訓練時間には計上しない

わくわく感は解説ではなく「見せる」ことで作る(例: 100万件のテーブルでインデックスの有無を実測する)。外部サイトは「さらに詳しく」の位置にとどめる。初年度は全体で15本程度。以降は受講者の実際の質問から増やす。

→ [言語・フレームワークの確定](https://github.com/ezorise-labs/education-ai-engineer-wayfinder/blob/main/.scratch/new-engineer-education/issues/14-language-selection.md) 13

## 8. 完成の条件と、教材1本を仕上げる手順

### 仕上げる手順

1. [タスク一覧](backlog.md)で、そのタスクの「埋める穴」と「完了条件」を確かめる
2. このガイドの該当する節を読み、Claude Codeで生成する
3. 生成したものを点検する。仕込んだ闇が現場にありそうか(§2)、AIに投げるだけで解けてしまわないか(§3)を見て、`node scripts/verify.mjs` を回す(SQL基礎は `node scripts/verify-db.mjs` も)
4. 教える講師がAIを使わずに解き、かかった時間と詰まった箇所をIssueに記録する(自己検証。下記)
5. 見つかった問題を直す(下記「自己検証の後に直すとき」)

### 完成の条件

教材1本が「完成」といえるのは、次の2つを満たしたときです。

1. 自己検証: その教材を教える講師が、AIを使わずに演習を自分で解き、クリアできることを確かめる(作った人ではなく教える人が行う)。ストレッチにも当てはめる(受講者は解けなくてよいが、解けない課題を出さないための条件)。優先度は必修より下
2. 試行(入門のみ): 未経験者に近い人が通しでやってみる。自己検証と1回の通しで兼ねてよい

**自己検証・試行では、かかった時間と詰まった箇所を、その演習のIssueに1行ずつ記録してください。**12月末の見直しと、残りの見積もりに使うためです。試行する人にプログラミング経験がある場合、構文部分の実測は短めに出ます。その場合は**非同期・DOM・TypeScriptの型の部分**を、未経験者が詰まる箇所を推し量る主な手がかりとして読みます。

### 自己検証の後に直すとき

| 修正の種類 | 例 | 自己検証のやり直し |
|---|---|---|
| 説明の修正(解く中身は変わらない) | 言い換え、図の追加、手順の補足 | 不要。自由に直してよい |
| 中身の修正(解く内容・答え・仕込みが変わる) | 演習の差し替え、闇の仕込み直し | 必要。中身の修正は確認点(11月末・12月末・1月末)にまとめて行う |

迷ったら中身の修正として扱います。

### 問題の報告先

- 教材そのものの不具合(演習が解けない、説明の誤り、時間の大きなずれ) → このリポジトリのIssue
- 決定の見直しにつながるもの(時間配分の変更、範囲の削減) → 事業計画リポジトリ

→ [教材制作量の棚卸しと初年度のスコープ](https://github.com/ezorise-labs/education-ai-engineer-wayfinder/blob/main/.scratch/new-engineer-education/issues/27-material-production-scope.md)、[教材の残り工数の見積もり(検証込み)](https://github.com/ezorise-labs/education-ai-engineer-wayfinder/blob/main/.scratch/new-engineer-education/issues/31-material-effort-estimate.md) 8〜10

## 9. 事前学習

- カリキュラムは事前学習なしを前提に組む。時間の見積もりも、事前学習をしていない人を基準にする
- 推奨としてのみ案内する。範囲はTSの基礎に相当するところ(変数・条件分岐・ループ・関数・配列、20〜30h目安)で、教材は外部の無料のJavaScript教材でよい(1本選ぶ)
- 受講料・契約の中身には含めない(含めると「料金に含まれるが計画届にない訓練」になる)

→ [入門フェーズのプログラミング基礎の時間](https://github.com/ezorise-labs/education-ai-engineer-wayfinder/blob/main/.scratch/new-engineer-education/issues/24-programming-basics-hours.md) 6

## 10. 教え方に関わる決まり(教材の外)

教材の書き方には直接効きませんが、教える準備で知っておくことです。

- 単元の開始時に講師が口頭で概要を話し、その後は受講者が各自のペースで進める。講師は同じ内容を講義し直さず、巡回と質問対応に時間を使う
- 演習のCloseは受講者の判断。講師はCloseされたIssueのコメントに後から目を通す
- 入門末チェックポイント: 全IssueのClose状況の確認と、1人5〜10分の口頭確認。合否の判定にはせず、本編の講師への申し送りに使う
- 講師との1on1を毎日(1人最大30分、午後)
- 教え合いは期待するが、役割としては課さない。決まりは「直接の答えを教えない」だけ

→ [入門フェーズの週次/日次コンテンツ構成](https://github.com/ezorise-labs/education-ai-engineer-wayfinder/blob/main/.scratch/new-engineer-education/issues/16-intro-phase-content.md) 6〜9、[講師から働きかける定期的な対話の枠](https://github.com/ezorise-labs/education-ai-engineer-wayfinder/blob/main/.scratch/new-engineer-education/issues/21-scheduled-dialogue.md)

## 迷ったときの判断

| 迷う場面 | 判断 | 詳しくは |
|---|---|---|
| 直したい箇所が「説明の修正」か「中身の修正」か分からない | 中身の修正として扱い、教える講師が解き直す | §8 |
| ある内容を入門で扱うか、本編に回すか分からない | 「扱うもの・扱わないもの」の表に従う。表にない内容なら、事業計画リポジトリに起票して決める | §2 |
| 課題がAIに投げるだけで解けてしまいそう | 「予測せよ」「説明せよ」「どこが悪いか指摘せよ」の形に変えるか、5〜10行の大きさに刻む | §3 |
| 本編とつながっている箇所を変えたい | 本編の教材と食い違わないかを確かめてから変える | §2 |
| 見つけた問題を、どこに書けばよいか分からない | 教材の不具合ならこのリポジトリのIssue、時間配分や範囲の変更につながるなら事業計画リポジトリ | §8 |

## まだ決まっていないこと

事業計画のマップは2026-10-02から凍結しています。入門の教材に関係しそうな未決定の論点は次のとおりです。必要になったら事業計画リポジトリで再開します。

- 進度が遅れた受講者の扱い(補習用の教材を作るか、など): [28番](https://github.com/ezorise-labs/education-ai-engineer-wayfinder/blob/main/.scratch/new-engineer-education/issues/28-struggling-learners.md)
- 受講環境の方針(ローカルかCodespacesか。WSL2を有効化できない、社内プロキシで止まる、などへの対処)。[29番](https://github.com/ezorise-labs/education-ai-engineer-wayfinder/blob/main/.scratch/new-engineer-education/issues/29-learner-environment-policy.md)。`00-getting-started.md` の書き方に効く
