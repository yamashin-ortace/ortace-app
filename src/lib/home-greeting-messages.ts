export type HomeGreetingLines = {
  eyebrow: string;
  headline: string;
};

/**
 * 挨拶の趣旨（企画用・同じ行に複数付与可。選定は主に日付シード＋スロット）
 * トーン: 受験生の年齢帯向け、重くなりすぎない・手軽に続けられる雰囲気
 * - encourage_exam: 国試に向けた軽い前向き
 * - relax: 焦りをほぐす
 * - motivation: 短い背中押し
 * - progress: ちょっとした積み上げ
 * - trust: 安心・配慮（※医療判断や合否の保証は書かない）
 */
export const GREETING_TAG = {
  encourage_exam: "encourage_exam",
  relax: "relax",
  motivation: "motivation",
  progress: "progress",
  trust: "trust",
} as const;

export type GreetingTag = (typeof GREETING_TAG)[keyof typeof GREETING_TAG];

export type PooledGreeting = HomeGreetingLines & { tags: GreetingTag[] };

/** 時刻帯（getHours による既存5区分と同一） */
export type TimeSlot =
  | "wee_hours" // 0–4
  | "morning" // 5–10
  | "day" // 11–16
  | "evening" // 17–21
  | "night"; // 22–23

export function getTimeSlotFromHour(hour: number): TimeSlot {
  if (hour < 5) return "wee_hours";
  if (hour < 11) return "morning";
  if (hour < 17) return "day";
  if (hour < 22) return "evening";
  return "night";
}

/** 初回起動専用（3 パターン。日付シードで選択） */
export const FIRST_VISIT_GREETINGS: PooledGreeting[] = [
  {
    tags: [GREETING_TAG.trust, GREETING_TAG.motivation],
    eyebrow: "はじめまして！",
    headline: "まず「設定」で、好きな色にしてから始めてね。学習はそのあとで大丈夫。",
  },
  {
    tags: [GREETING_TAG.encourage_exam, GREETING_TAG.progress],
    eyebrow: "ORT ACE へようこそ",
    headline: "毎日やらなくてもOK。空いた日に1問、くらいのノリで始めてみて。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "えらいね、開いてくれて。",
    headline: "ここは自分のペース用。誰と比べる必要なし。",
  },
];

/** 再訪者：深夜〜早朝（0–4） */
const POOL_WEE_HOURS: PooledGreeting[] = [
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "遅いね、お疲れさま。",
    headline: "今日は短く切り上げて、寝るのも偉いよ。体が一番。",
  },
  {
    tags: [GREETING_TAG.motivation],
    eyebrow: "眠い中ありがとう。",
    headline: "1問だけ、それだけで「今日触った」ってなれる。",
  },
  {
    tags: [GREETING_TAG.encourage_exam, GREETING_TAG.progress],
    eyebrow: "徹夜はやめてね（念のため）。",
    headline: "テスト前は、睡眠も点数に効く、って先生も言いがち。",
  },
  {
    tags: [GREETING_TAG.relax],
    eyebrow: "ちょい休憩。",
    headline: "喉が渇いてたら水飲も。勉強中の敵、喉の渇きも入ります。",
  },
  {
    tags: [GREETING_TAG.trust],
    eyebrow: "ここは記録帳。",
    headline: "誰の目も気にせず、自分用メモ感覚で使って。",
  },
  {
    tags: [GREETING_TAG.motivation, GREETING_TAG.encourage_exam],
    eyebrow: "まだ起きてる、えらい。",
    headline: "国試、まだ先だ。今日は「触れた」で十分な日もある。",
  },
  {
    tags: [GREETING_TAG.progress],
    eyebrow: "眠たいのに開いた？",
    headline: "それだけで今日の一勝。内容は次の日で追いつけばいい。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.motivation],
    eyebrow: "夜ふかし、たまにするよね。",
    headline: "明日がきついなら、今は本当に少しでOK。",
  },
  {
    tags: [GREETING_TAG.encourage_exam],
    eyebrow: "本番、まだまだ先でいい。",
    headline: "今は「ちょい予習」してるだけ、くらいの気分で。",
  },
  {
    tags: [GREETING_TAG.trust, GREETING_TAG.relax],
    eyebrow: "画面、暗くしすぎないでね。",
    headline: "目がつらいのは、だいたい明るさのせい。",
  },
  {
    tags: [GREETING_TAG.motivation, GREETING_TAG.progress],
    eyebrow: "数分の穴埋め。",
    headline: "積み重なると地味に効く。高校の英語みたいなやつ。",
  },
  {
    tags: [GREETING_TAG.relax],
    eyebrow: "寝落ち一歩前？",
    headline: "スマホ置いて秒で布団、も正解。",
  },
];

/** 朝（5–10） */
const POOL_MORNING: PooledGreeting[] = [
  {
    tags: [GREETING_TAG.motivation, GREETING_TAG.encourage_exam],
    eyebrow: "おはよ〜",
    headline: "朝イチ1問、できたら自己肯定感アップ。できなくても開いたのが偉い。",
  },
  {
    tags: [GREETING_TAG.progress, GREETING_TAG.trust],
    eyebrow: "今日のスタート。",
    headline: "昨日より1ミリ多く知ってたら、それで十分。比べるのは昨日の自分だけ。",
  },
  {
    tags: [GREETING_TAG.relax],
    eyebrow: "まだ眠たい？わかる。",
    headline: "理解しなくていい。とりあえず目を通すだけでも、忘れ方が遅い。",
  },
  {
    tags: [GREETING_TAG.encourage_exam],
    eyebrow: "本番の朝を想像しなくてOK。",
    headline: "今は、今日の1ページ書くだけ。",
  },
  {
    tags: [GREETING_TAG.motivation],
    eyebrow: "5分でいいよ。",
    headline: "5分やる日が続くと、地味に強くなる。",
  },
  {
    tags: [GREETING_TAG.trust],
    eyebrow: "同じとこ、また？って日。",
    headline: "忘れるから繰り返し。人間、そういうもの。",
  },
  {
    tags: [GREETING_TAG.progress, GREETING_TAG.motivation],
    eyebrow: "ぼーっとしながらでも。",
    headline: "目に入った用語、後で出てきたら「あ、見た」で勝ち。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.encourage_exam],
    eyebrow: "朝食前、後、どっちでも。",
    headline: "続けやすい方を選ぼ。正解の順番、ない。",
  },
  {
    tags: [GREETING_TAG.encourage_exam],
    eyebrow: "専門、ちょいむず。",
    headline: "いきなり全部は無理。今日は用語1個でも覚えたら上出来。",
  },
  {
    tags: [GREETING_TAG.motivation],
    eyebrow: "やる気、ゼロの朝。",
    headline: "アラーム2個目のあと1問。それだけ。ウソだと思ったらやってみ。",
  },
  {
    tags: [GREETING_TAG.trust, GREETING_TAG.progress],
    eyebrow: "分からない＝悪、じゃない。",
    headline: "分からないのを分かったまま次へ行く、は大事。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.motivation],
    eyebrow: "日差し、眩しい。",
    headline: "目は大事。画面は暗すぎず明るすぎず、で。",
  },
];

/** 昼（11–16） */
const POOL_DAY: PooledGreeting[] = [
  {
    tags: [GREETING_TAG.motivation, GREETING_TAG.trust],
    eyebrow: "こんにちは。",
    headline: "今の所感、なんとなくでいい。次に伸ばすネタ、メモ的に。",
  },
  {
    tags: [GREETING_TAG.encourage_exam, GREETING_TAG.progress],
    eyebrow: "休み時間・帰り道・合間。",
    headline: "1問挟めたら、今日の自分ちょい偉い。",
  },
  {
    tags: [GREETING_TAG.relax],
    eyebrow: "焦る午後。",
    headline: "水飲も。あと、肩すくめてるかも。ほーっ、してみ。",
  },
  {
    tags: [GREETING_TAG.trust],
    eyebrow: "他人の点数、SNS、見た？",
    headline: "そっち、たまに切っていい。ここは自分用のノート。",
  },
  {
    tags: [GREETING_TAG.motivation],
    eyebrow: "SNS 15分の代わり。",
    headline: "たまにこっち、にすると、夜すっきり目に寝られることある。",
  },
  {
    tags: [GREETING_TAG.encourage_exam],
    eyebrow: "合格、まだ遠い？",
    headline: "遠いから。今日1マス進めば、ちょい近づく。",
  },
  {
    tags: [GREETING_TAG.progress, GREETING_TAG.relax],
    eyebrow: "伸び悩み、普通。",
    headline: "覚えたはず、消える。だから出てくる。人間、そう。",
  },
  {
    tags: [GREETING_TAG.encourage_exam, GREETING_TAG.motivation],
    eyebrow: "国試、いつか。課題、今日。",
    headline: "いま1問、やるだけでいい。偉人にならなくていい。",
  },
  {
    tags: [GREETING_TAG.trust, GREETING_TAG.relax],
    eyebrow: "今日サボりは？って凹む。",
    headline: "来た＝0じゃない。来た、で一旦プラス。",
  },
  {
    tags: [GREETING_TAG.motivation, GREETING_TAG.progress],
    eyebrow: "正解より「なんで？」",
    headline: "理由わかると、同じ型でつかめる。地味、でも効く。",
  },
  {
    tags: [GREETING_TAG.relax],
    eyebrow: "ちょい休憩。",
    headline: "外の空気1分。戻ると、意外と頭動く。",
  },
  {
    tags: [GREETING_TAG.encourage_exam, GREETING_TAG.trust],
    eyebrow: "誰かと比べる日、ある。",
    headline: "スタート、遅くても今ここ。それで次へ行ける。",
  },
];

/** 夕方（17–21） */
const POOL_EVENING: PooledGreeting[] = [
  {
    tags: [GREETING_TAG.motivation, GREETING_TAG.encourage_exam],
    eyebrow: "こんばんは。",
    headline: "今日の〆、1問入れる。明日朝ラクなこと、たまにある。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.progress],
    eyebrow: "お疲れ。",
    headline: "ご飯、お風呂、どっち先でもいい。学習はその合間。",
  },
  {
    tags: [GREETING_TAG.encourage_exam],
    eyebrow: "今日も一緒にがんばる？",
    headline: "ムリしない範囲で。1問＝今日の自己演出、くらいで。",
  },
  {
    tags: [GREETING_TAG.trust],
    eyebrow: "みんな、見え方ちがう。",
    headline: "あなたの速さ、あなたの定義でいい。",
  },
  {
    tags: [GREETING_TAG.motivation],
    eyebrow: "夜の勉強、だらだら注意。",
    headline: "タイマー 25 分、とかで区切ると続く。ふしぎ。",
  },
  {
    tags: [GREETING_TAG.progress, GREETING_TAG.motivation],
    eyebrow: "前より言える、増えた？",
    headline: "それ、ちゃんと成長。気づいたら、ちょい自慢でいい。",
  },
  {
    tags: [GREETING_TAG.relax],
    eyebrow: "夕方眠い、ある。",
    headline: "仮眠15分、夜が変わることも。好きにして。",
  },
  {
    tags: [GREETING_TAG.encourage_exam, GREETING_TAG.trust],
    eyebrow: "国試、でかいテーマ。",
    headline: "紙1枚、今日はここまで、でもいい。毎日そう。",
  },
  {
    tags: [GREETING_TAG.motivation, GREETING_TAG.relax],
    eyebrow: "今日はここで終わる、大事。",
    headline: "全部やりきれなくて人間。区切るの、上手。",
  },
  {
    tags: [GREETING_TAG.progress, GREETING_TAG.trust],
    eyebrow: "数字、動かない週。",
    headline: "地味期間、だいたいある。抜けたあと一気、ということも。",
  },
  {
    tags: [GREETING_TAG.encourage_exam, GREETING_TAG.motivation],
    eyebrow: "ちょっと楽しい単元、見つかった？",
    headline: "そこから伸ばすの、あり。好き、武器になる。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "ご飯、ちゃんと食べた？",
    headline: "空きっ腹で難関、だいたい不機嫌。まず栄養。",
  },
];

/** 夜（22–23） */
const POOL_NIGHT: PooledGreeting[] = [
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.motivation],
    eyebrow: "遅い時間、来てくれて。",
    headline: "勉強も寝るのも、どっちも大事。今日は先に布団、全然アリ。",
  },
  {
    tags: [GREETING_TAG.encourage_exam],
    eyebrow: "前日みたいに焦らなくていい。",
    headline: "今は、今日用の1問。採点はまだ。",
  },
  {
    tags: [GREETING_TAG.trust],
    eyebrow: "寝不足で詰め込み、地獄。",
    headline: "「今日は休む」も勉強のうち。たまに。",
  },
  {
    tags: [GREETING_TAG.motivation, GREETING_TAG.progress],
    eyebrow: "最後、一問。",
    headline: "布団、待ってる。短く終わらせるのも、かっこいい。",
  },
  {
    tags: [GREETING_TAG.relax],
    eyebrow: "画面、だいぶ暗く。",
    headline: "真っ暗すぎる部屋＋明るい画面、目つらい。明かり一個足す。",
  },
  {
    tags: [GREETING_TAG.encourage_exam, GREETING_TAG.trust],
    eyebrow: "友だちと、ペース違う。",
    headline: "あなたの週、あなたのノルマで。",
  },
  {
    tags: [GREETING_TAG.motivation],
    eyebrow: "全部、今日中、ムリ。",
    headline: "1個だけ、やったら、今日の勝ち。",
  },
  {
    tags: [GREETING_TAG.progress, GREETING_TAG.relax],
    eyebrow: "一気に一週間分、きつい。",
    headline: "毎日3分、のほうが覚えやすい、ってこと、ある。",
  },
  {
    tags: [GREETING_TAG.trust, GREETING_TAG.encourage_exam],
    eyebrow: "ここ、点数の保証、しない。",
    headline: "代わりに、今日触った、は残る。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.motivation],
    eyebrow: "布団の中一問。",
    headline: "首つらい体勢、長すぎないでね。",
  },
  {
    tags: [GREETING_TAG.encourage_exam, GREETING_TAG.motivation],
    eyebrow: "あと1時間…は危ない。",
    headline: "明日の朝の自分、だいたい敵。寝よ。",
  },
  {
    tags: [GREETING_TAG.progress, GREETING_TAG.trust],
    eyebrow: "調子、波ある。",
    headline: "下がったあと戻る、普通。人だから。",
  },
];

export const GREETING_POOLS: Record<TimeSlot, PooledGreeting[]> = {
  wee_hours: POOL_WEE_HOURS,
  morning: POOL_MORNING,
  day: POOL_DAY,
  evening: POOL_EVENING,
  night: POOL_NIGHT,
};

export function toPublicLines(p: PooledGreeting): HomeGreetingLines {
  return { eyebrow: p.eyebrow, headline: p.headline };
}
