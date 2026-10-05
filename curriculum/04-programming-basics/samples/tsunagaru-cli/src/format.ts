// 画面に出す文字列を組み立てる層。
// 数字やデータの加工はここではやらず、report.ts の結果を受け取って並べるだけ。

import type { Post, User, UserSummary } from "./types.ts";

/** 名前を設定していない利用者がいるので、その場合は代わりの表示にする */
export function displayNameOf(user: User): string {
  return user.displayName || "(名前未設定)";
}

/** 2025-04-02 → 2025/04/02 */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${year}/${month}/${day}`;
}

export function formatPostLine(post: Post, author: User): string {
  const name = displayNameOf(author);
  const date = formatDate(post.postedAt);
  const body = post.body.length > 24 ? `${post.body.slice(0, 24)}…` : post.body;
  return `${date}  ${name.padEnd(12)} ${String(post.likes).padStart(3)}♥  ${body}`;
}

export function formatSummaryLine(summary: UserSummary): string {
  return [
    summary.userId.padEnd(8),
    summary.displayName.padEnd(12),
    `投稿 ${String(summary.postCount).padStart(3)}件`,
    `いいね ${String(summary.totalLikes).padStart(4)}`,
  ].join("  ");
}

export function heading(title: string): string {
  return `\n=== ${title} ===`;
}
