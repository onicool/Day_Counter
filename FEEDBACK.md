
---

## 1. UX 全体像

### 1-1. コンポーネント配置

各ページの一番下に、こんなブロックを共通で置くイメージです。

> このページについて教えてください
> [👍 役に立った] [😐 ふつう] [👎 いまいち]
> （クリック後に）
> よければ一言だけご意見をください：
> [テキストエリア]
> [送信ボタン]
> 「もっと詳しいご意見はこちら →」リンク（/feedback ページ）

特徴：

* 「ボタンを押すだけ」で最低限のフィードバックが取れる
* 押した人にだけ「ひとことフォーム」を出すので、邪魔にならない
* 詳しい意見を書きたい人は、専用の /feedback ページへ誘導

### 1-2. リアクション 3 種類

リアクションはこれくらいシンプルで十分です。

* 👍 役に立った（`good`）
* 😐 ふつう（`neutral`）
* 👎 いまいち（`bad`）

ボタンを押したら：

* 即座に見た目を変える（たとえば選択済みのボタンだけ強調）
* そのタイミングで API に POST（リアクション単体）
* 同時に、テキストエリア＋送信ボタンを表示

---

## 2. 画面レベルの設計

### 2-1. 共通フッター用フィードバック UI

ざっくり HTML イメージ：

```html
<section id="feedback" class="mt-8 border-t pt-4 text-sm">
  <h2 class="font-semibold mb-2">このページについて教えてください</h2>

  <div class="flex gap-2 mb-3">
    <button data-reaction="good"   class="feedback-btn">👍 役に立った</button>
    <button data-reaction="neutral" class="feedback-btn">😐 ふつう</button>
    <button data-reaction="bad"    class="feedback-btn">👎 いまいち</button>
  </div>

  <div id="feedback-comment" class="hidden">
    <p class="mb-1">よければ一言だけご意見をください（任意）：</p>
    <textarea class="w-full border rounded p-2 text-sm" rows="3"
      placeholder="例）ここが分かりにくかった、こういう機能が欲しい など"></textarea>
    <div class="mt-2 flex items-center gap-2">
      <input type="email" class="border rounded p-1 text-xs"
        placeholder="返信が必要な方はメールアドレス（任意）">
      <button class="px-3 py-1 text-xs rounded bg-slate-900 text-white">
        送信
      </button>
    </div>
    <p class="mt-1 text-xs text-slate-500">
      ※ 個別に返信できない場合がありますが、必ず目を通します。
    </p>
  </div>

  <p class="mt-2 text-xs">
    もっと詳しいご意見は
    <a href="/feedback" class="underline">こちらの意見フォーム</a>からどうぞ。
  </p>
</section>
```

フロントの動き（ざっくり）：

* ボタンを押したら

  * `/api/feedback` に `{type: 'reaction', path, reaction}` を POST
  * 成功したらボタンの状態更新（選択済み表示）
  * `#feedback-comment` を表示（hidden → block）
* コメント送信時：

  * `/api/feedback` に `{type: 'comment', path, reaction, comment, email}` を POST
  * 終わったら「ありがとうございます！」と短いメッセージに差し替え

### 2-2. 意見板（/feedback ページ）

トップからリンクできる「意見フォームページ」はシンプルに：

* 用途：長めの意見・改善案などを送りたい人向け
* フィールド：

  * 利用状況（セレクト）

    * 「実際に使ってみた」「まだ使っていない」「たまたま見つけた」など
  * 匿名で意見本文（テキストエリア）
  * 任意のメールアドレス

これも実態は `/api/feedback` に POST するだけでよいです（`type: 'detail'` 等で区別）。

---

## 3. バックエンド（Hono / Cloudflare Workers）設計

### 3-1. エンドポイント構成

* `POST /api/feedback`
  1 本で、以下の 3 種類を受け付けるイメージ：

```ts
type FeedbackBase = {
  path: string;          // どのページから送られたか（location.pathname）
  ua?: string;           // 必要なら user-agent（サーバー側で付与してもよい）
};

type ReactionPayload = FeedbackBase & {
  kind: 'reaction';
  reaction: 'good' | 'neutral' | 'bad';
};

type CommentPayload = FeedbackBase & {
  kind: 'comment';
  reaction?: 'good' | 'neutral' | 'bad'; // リアクションと紐付けたい場合
  comment: string;
  email?: string;
};

type DetailPayload = FeedbackBase & {
  kind: 'detail';
  usage: 'used' | 'not_yet' | 'random';
  comment: string;
  email?: string;
};

type FeedbackPayload = ReactionPayload | CommentPayload | DetailPayload;
```

レスポンスはシンプルでよく：

```json
{ "ok": true }
```

エラー時は、`{ok:false, error:"..."}` + 適切なステータス。

### 3-2. 保存先（最小構成）

一番シンプルにいくなら：

* Cloudflare D1 か KV のどちらかに 1 テーブルで保存

#### 最低限のテーブル設計例（D1 の場合）

`feedback` テーブル：

| カラム名       | 型                        | 説明                                  |
| ---------- | ------------------------ | ----------------------------------- |
| id         | INTEGER PK AUTOINCREMENT | 通し番号                                |
| created_at | TEXT                     | ISO 文字列（`new Date().toISOString()`） |
| path       | TEXT                     | `/` `/tool/day-counter` など          |
| kind       | TEXT                     | `reaction` / `comment` / `detail`   |
| reaction   | TEXT NULL                | `good` / `neutral` / `bad`          |
| usage      | TEXT NULL                | `used` / `not_yet` / `random`       |
| comment    | TEXT NULL                | 自由入力コメント                            |
| email      | TEXT NULL                | 任意のメール。ハッシュして保存でもよい                 |
| ip_hash    | TEXT NULL                | IP のハッシュ値（簡易なスパム検知用）                |

集計用に別の構造を用意せず、まずは「全部 D1 に溜めておいて、後で管理画面や集計スクリプトを書く」という運用で十分です。

### 3-3. バリデーションと簡易スパム対策

* バリデーション：

  * `path` は必須
  * `kind` は `reaction/comment/detail` のどれか
  * `comment` は 1000 文字くらいで制限
  * メールは形式チェックだけする or そのまま保存しないでハッシュだけでもよい
* スパム軽減（最低限）：

  * 同一 IP + path + kind で短時間に何十件も来たら弾く
  * Cloudflare Turnstile を /feedback ページだけに仕込む、など

---
