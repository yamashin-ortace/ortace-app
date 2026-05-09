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
export type BillingPlan = "free" | "low" | "exam";
export type BillingPlanStatus = "active" | "expired" | "payment_failed";

export type ProfilesRow = {
  id: string;
  nickname: string | null;
  grade: Grade | null;
  goal: Goal | null;
  plan: BillingPlan;
  plan_status: BillingPlanStatus;
  plan_expires_at: string | null;
  stripe_customer_id: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  plan_updated_at: string;
  created_at: string;
  updated_at: string;
};

export type ProfilesInsert = {
  id: string;
  nickname?: string | null;
  grade?: Grade | null;
  goal?: Goal | null;
  plan?: BillingPlan;
  plan_status?: BillingPlanStatus;
  plan_expires_at?: string | null;
  stripe_customer_id?: string | null;
  stripe_checkout_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  plan_updated_at?: string;
};

export type ProfilesUpdate = {
  nickname?: string | null;
  grade?: Grade | null;
  goal?: Goal | null;
  plan?: BillingPlan;
  plan_status?: BillingPlanStatus;
  plan_expires_at?: string | null;
  stripe_customer_id?: string | null;
  stripe_checkout_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  plan_updated_at?: string;
};

export type DailyLimitsRow = {
  user_id: string;
  date: string;
  count: number;
  updated_at: string;
};

export type DailyLimitsInsert = {
  user_id: string;
  date: string;
  count?: number;
  updated_at?: string;
};

export type DailyLimitsUpdate = {
  date?: string;
  count?: number;
  updated_at?: string;
};

export type BookmarksRow = {
  user_id: string;
  question_id: string;
  categories: string[];
  added_at: string;
  updated_at: string;
};

export type BookmarksInsert = {
  user_id: string;
  question_id: string;
  categories?: string[];
  added_at?: string;
  updated_at?: string;
};

export type BookmarksUpdate = {
  question_id?: string;
  categories?: string[];
  added_at?: string;
  updated_at?: string;
};

export type NotesRow = {
  user_id: string;
  question_id: string;
  text: string;
  updated_at: string;
};

export type NotesInsert = {
  user_id: string;
  question_id: string;
  text: string;
  updated_at?: string;
};

export type NotesUpdate = {
  question_id?: string;
  text?: string;
  updated_at?: string;
};

export type AnswerHistoryRow = {
  id: string;
  user_id: string;
  entry_key: string;
  question_id: string;
  answered_at: string;
  result: "correct" | "incorrect" | "no_answer";
  selected_answers: string[];
  round: number;
  session: "am" | "pm";
  display_number: number;
  major_category: string;
  created_at: string;
};

export type AnswerHistoryInsert = {
  id?: string;
  user_id: string;
  entry_key: string;
  question_id: string;
  answered_at: string;
  result: "correct" | "incorrect" | "no_answer";
  selected_answers?: string[];
  round: number;
  session: "am" | "pm";
  display_number: number;
  major_category?: string;
  created_at?: string;
};

export type AnswerHistoryUpdate = {
  entry_key?: string;
  question_id?: string;
  answered_at?: string;
  result?: "correct" | "incorrect" | "no_answer";
  selected_answers?: string[];
  round?: number;
  session?: "am" | "pm";
  display_number?: number;
  major_category?: string;
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
      daily_limits: {
        Row: DailyLimitsRow;
        Insert: DailyLimitsInsert;
        Update: DailyLimitsUpdate;
        Relationships: [];
      };
      bookmarks: {
        Row: BookmarksRow;
        Insert: BookmarksInsert;
        Update: BookmarksUpdate;
        Relationships: [];
      };
      notes: {
        Row: NotesRow;
        Insert: NotesInsert;
        Update: NotesUpdate;
        Relationships: [];
      };
      answer_history: {
        Row: AnswerHistoryRow;
        Insert: AnswerHistoryInsert;
        Update: AnswerHistoryUpdate;
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
