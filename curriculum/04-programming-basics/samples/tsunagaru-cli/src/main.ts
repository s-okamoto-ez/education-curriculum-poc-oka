// 「つながるノート」運用ツールの入口。
// 使い方:  node --experimental-strip-types src/main.ts [summary|top|suspended]

import { loadPosts, loadUsers } from "./load.ts";
import { formatPostLine, formatSummaryLine, heading, displayNameOf } from "./format.ts";
import { overallStats, suspendedUsers, summarizeUsers, topPosts } from "./report.ts";

async function showSummary(): Promise<void> {
  const users = await loadUsers();
  const posts = await loadPosts();

  const stats = overallStats(posts);
  console.log(heading("サービス全体"));
  console.log(`投稿 ${stats.postCount}件 / いいね ${stats.totalLikes}`);

  console.log(heading("利用者ごと"));
  for (const summary of summarizeUsers(users, posts)) {
    console.log(formatSummaryLine(summary));
  }
}

async function showTop(): Promise<void> {
  const users = await loadUsers();
  const posts = await loadPosts();

  console.log(heading("いいねの多い投稿"));
  for (const post of topPosts(posts, 5)) {
    const author = users.find((u) => u.id === post.authorId);
    console.log(formatPostLine(post, author));
  }
}

async function showSuspended(): Promise<void> {
  const users = await loadUsers();

  console.log(heading("停止中の利用者"));
  const targets = suspendedUsers(users);
  if (targets.length === 0) {
    console.log("(該当なし)");
    return;
  }
  for (const user of targets) {
    console.log(`${user.id}  ${displayNameOf(user)}`);
  }
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? "summary";

  try {
    if (command === "summary") {
      await showSummary();
    } else if (command === "top") {
      await showTop();
    } else if (command === "suspended") {
      await showSuspended();
    } else {
      console.log(`知らないコマンドです: ${command}`);
      console.log("使えるのは summary / top / suspended です");
    }
  } catch (error) {
    console.log("処理に失敗しました:", (error as Error).message);
  }
}

main();
