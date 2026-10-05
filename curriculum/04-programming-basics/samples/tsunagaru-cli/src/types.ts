// 「つながるノート」運用ツールで扱うデータの形。
// data/ 配下のJSONと1対1で対応している。

export type User = {
  id: string;
  /** 画面に出す名前。設定していない利用者もいる */
  displayName: string;
  joinedAt: string;
  isSuspended: boolean;
};

export type Post = {
  id: string;
  /** 投稿した利用者のid。User.id を指す */
  authorId: string;
  body: string;
  likes: number;
  postedAt: string;
  isDeleted: boolean;
};

/** 利用者ごとの集計結果 */
export type UserSummary = {
  userId: string;
  displayName: string;
  postCount: number;
  totalLikes: number;
};
