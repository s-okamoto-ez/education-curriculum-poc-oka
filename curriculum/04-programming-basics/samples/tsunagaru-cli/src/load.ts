// data/ 配下のJSONを読み込む。
// ファイルを読むのは時間のかかる処理なので、この層はすべて async になっている。

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Post, User } from "./types.ts";

const DATA_DIR = join(import.meta.dirname, "..", "data");

async function readJson<T>(fileName: string): Promise<T> {
  const path = join(DATA_DIR, fileName);
  const text = await readFile(path, "utf-8");
  return JSON.parse(text) as T;
}

export async function loadUsers(): Promise<User[]> {
  return readJson<User[]>("users.json");
}

export async function loadPosts(): Promise<Post[]> {
  return readJson<Post[]>("posts.json");
}
