import { users, type Post, type User } from "./data.ts";

// 投稿者のIDから、ユーザー情報を探す
function findUser(authorId: string): User {
  return users.find((u) => u.id === authorId) as User;
}

// 投稿者の表示名を作る
export function formatAuthor(post: Post): string {
  const user = findUser(post.authorId);
  const mark = user.isPremium ? "★" : "";
  return `${mark}${user.name}`;
}

// 投稿1件を、表示用の文字列にする
export function renderPost(post: Post): string {
  const author = formatAuthor(post);
  return `${author}: ${post.body} (${post.likes})`;
}
