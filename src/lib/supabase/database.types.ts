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
export type BillingPlanStatus =
  | "active"
  | "trialing"
  | "expired"
  | "payment_failed"
  | "canceled";
export type SupportClaimStatus = "pending" | "approved" | "rejected";
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
  stripe_subscription_id: string | null;
  stripe_subscription_status: string | null;
  stripe_subscription_cancel_at: string | null;
  stripe_first_invoice_paid_at: string | null;
  plan_updated_at: string;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  trial_used_at: string | null;
  trial_plan: BillingPlan | null;
  support_claim_used_at: string | null;
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
  stripe_subscription_id?: string | null;
  stripe_subscription_status?: string | null;
  stripe_subscription_cancel_at?: string | null;
  stripe_first_invoice_paid_at?: string | null;
  plan_updated_at?: string;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  trial_used_at?: string | null;
  trial_plan?: BillingPlan | null;
  support_claim_used_at?: string | null;
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
  stripe_subscription_id?: string | null;
  stripe_subscription_status?: string | null;
  stripe_subscription_cancel_at?: string | null;
  stripe_first_invoice_paid_at?: string | null;
  plan_updated_at?: string;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  trial_used_at?: string | null;
  trial_plan?: BillingPlan | null;
  support_claim_used_at?: string | null;
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
  confidence: "high" | "mid" | "guess" | null;
  duration_ms: number | null;
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
  confidence?: "high" | "mid" | "guess" | null;
  duration_ms?: number | null;
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
  confidence?: "high" | "mid" | "guess" | null;
  duration_ms?: number | null;
};

export type StudyGoalSettingsRow = {
  user_id: string;
  config: Json;
  updated_at: string;
};

export type StudyGoalSettingsInsert = {
  user_id: string;
  config?: Json;
  updated_at?: string;
};

export type StudyGoalSettingsUpdate = {
  config?: Json;
  updated_at?: string;
};

export type UserDevicesRow = {
  id: string;
  user_id: string;
  device_fingerprint: string;
  user_agent: string | null;
  device_label: string | null;
  last_seen_at: string;
  created_at: string;
  revoked_at: string | null;
  revoked_reason: string | null;
  revoked_by_device_fingerprint: string | null;
};

export type UserDevicesInsert = {
  id?: string;
  user_id: string;
  device_fingerprint: string;
  user_agent?: string | null;
  device_label?: string | null;
  last_seen_at?: string;
  created_at?: string;
  revoked_at?: string | null;
  revoked_reason?: string | null;
  revoked_by_device_fingerprint?: string | null;
};

export type UserDevicesUpdate = {
  device_fingerprint?: string;
  user_agent?: string | null;
  device_label?: string | null;
  last_seen_at?: string;
  revoked_at?: string | null;
  revoked_reason?: string | null;
  revoked_by_device_fingerprint?: string | null;
};

export type SupportClaimsRow = {
  id: string;
  user_id: string;
  status: SupportClaimStatus;
  evidence_url: string;
  user_comment: string | null;
  reject_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

export type SupportClaimsInsert = {
  id?: string;
  user_id: string;
  status?: SupportClaimStatus;
  evidence_url: string;
  user_comment?: string | null;
  reject_reason?: string | null;
  submitted_at?: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
};

export type SupportClaimsUpdate = {
  status?: SupportClaimStatus;
  evidence_url?: string;
  user_comment?: string | null;
  reject_reason?: string | null;
  submitted_at?: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
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
      study_goal_settings: {
        Row: StudyGoalSettingsRow;
        Insert: StudyGoalSettingsInsert;
        Update: StudyGoalSettingsUpdate;
        Relationships: [];
      };
      user_devices: {
        Row: UserDevicesRow;
        Insert: UserDevicesInsert;
        Update: UserDevicesUpdate;
        Relationships: [];
      };
      support_claims: {
        Row: SupportClaimsRow;
        Insert: SupportClaimsInsert;
        Update: SupportClaimsUpdate;
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
      support_claim_status: SupportClaimStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
