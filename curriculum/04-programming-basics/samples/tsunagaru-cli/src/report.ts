// 集計する層。表示はしない。
// 「削除された投稿は数えない」というのが運用上の決まり。

import type { Post, User, UserSummary } from "./types.ts";
import { displayNameOf } from "./format.ts";

/** 利用者ごとに、投稿数といいねの合計を出す */
export function summarizeUsers(users: User[], posts: Post[]): UserSummary[] {
  return users.map((user) => {
    const mine = posts.filter((p) => p.authorId === user.id);

    return {
      userId: user.id,
      displayName: displayNameOf(user),
      postCount: mine.filter((p) => !p.isDeleted).length,
      totalLikes: mine.reduce((sum, p) => sum + p.likes, 0),
    };
  });
}

/** サービス全体の件数 */
export function overallStats(posts: Post[]): { postCount: number; totalLikes: number } {
  const alive = posts.filter((p) => !p.isDeleted);

  return {
    postCount: alive.length,
    totalLikes: alive.reduce((sum, p) => sum + p.likes, 0),
  };
}

/** いいねの多い順に並べて、上から count 件を返す */
export function topPosts(posts: Post[], count: number): Post[] {
  return posts
    .filter((p) => !p.isDeleted)
    .sort((a, b) => b.likes - a.likes)
    .slice(0, count);
}

/** 停止中の利用者を抜き出す */
export function suspendedUsers(users: User[]): User[] {
  return users.filter((u) => u.isSuspended);
}
