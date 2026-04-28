/**
 * Supabase の DB スキーマ型定義（手書き・最小構成）。
 * テーブル追加時はここに型を加える。将来 supabase gen types に切替予定。
 *
 * 注：Row/Insert/Update は `type` で定義する。`interface` だと
 * Supabase 側の `Record<string, unknown>` 制約を満たせず
 * `update()` の引数型が never になる（TS 5.x の挙動）。
 */

export type Grade = "1年" | "2年" | "3年" | "4年" | "受験生";
export type Goal = "基礎固め" | "苦手克服" | "本番対策";

export type ProfilesRow = {
  id: string;
  nickname: string | null;
  grade: Grade | null;
  goal: Goal | null;
  created_at: string;
  updated_at: string;
};

export type ProfilesInsert = {
  id: string;
  nickname?: string | null;
  grade?: Grade | null;
  goal?: Goal | null;
};

export type ProfilesUpdate = {
  nickname?: string | null;
  grade?: Grade | null;
  goal?: Goal | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfilesRow;
        Insert: ProfilesInsert;
        Update: ProfilesUpdate;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
