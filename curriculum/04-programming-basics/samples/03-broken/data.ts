// 架空のSNS「つながるノート」のデータ。
// 本来はデータベースから取ってくるものを、ここでは手で書いています。

export type User = {
  id: string;
  name: string;
  isPremium: boolean;
};

export type Post = {
  id: string;
  authorId: string;
  body: string;
  likes: number;
};

export const users: User[] = [
  { id: "u1043", name: "田中", isPremium: true },
  { id: "u2287", name: "佐藤", isPremium: false },
  { id: "u3391", name: "鈴木", isPremium: true },
];

export const posts: Post[] = [
  { id: "p001", authorId: "u1043", body: "はじめまして。", likes: 12 },
  { id: "p002", authorId: "u2287", body: "今日はいい天気。", likes: 3 },
  { id: "p003", authorId: "u3391", body: "新機能が出たらしい。", likes: 41 },
  // 2019年に退会したユーザーの投稿。ユーザー情報はもう残っていない
  { id: "p004", authorId: "u9021", body: "この投稿は残っています。", likes: 7 },
  { id: "p005", authorId: "u1043", body: "また来ます。", likes: 1 },
];
