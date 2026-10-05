import { posts } from "./data.ts";
import { renderPost } from "./post.ts";

// タイムライン全体を組み立てる
export function renderTimeline(): string {
  const lines = posts.map((post) => renderPost(post));
  return lines.join("\n");
}
