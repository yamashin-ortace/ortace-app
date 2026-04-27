export type HomeGreetingLines = {
  eyebrow: string;
  headline: string;
};

/**
 * 挨拶の趣旨（企画用・同じ行に複数付与可。選定は主に日付シード＋スロット）
 * トーン: 受験生の年齢帯向け、親身で先生っぽい・無理させない雰囲気
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

/** 時刻帯（6区分） */
export type TimeSlot =
  | "wee_hours" // 0–4 深夜
  | "morning" // 5–10 朝
  | "day" // 11–15 昼
  | "twilight" // 16–18 夕方
  | "evening" // 19–21 夜（前半）
  | "night"; // 22–23 寝る前

export function getTimeSlotFromHour(hour: number): TimeSlot {
  if (hour < 5) return "wee_hours";
  if (hour < 11) return "morning";
  if (hour < 16) return "day";
  if (hour < 19) return "twilight";
  if (hour < 22) return "evening";
  return "night";
}

/** 初回起動専用（5 パターン。日付シードで選択） */
export const FIRST_VISIT_GREETINGS: PooledGreeting[] = [
  {
    tags: [GREETING_TAG.trust, GREETING_TAG.motivation],
    eyebrow: "はじめまして！",
    headline: "来てくれて嬉しいな。まずは設定から、自分好みに画面を変えるのもおすすめ。",
  },
  {
    tags: [GREETING_TAG.encourage_exam, GREETING_TAG.progress],
    eyebrow: "インストールありがとう！",
    headline: "国家試験まで、一緒に少しずつ進んでいこうね。自分のペースで大丈夫だよ。",
  },
  {
    tags: [GREETING_TAG.trust, GREETING_TAG.relax],
    eyebrow: "ここからスタートだね。",
    headline: "使い方はゆっくり慣れていけばいいよ。まずはどんな問題があるかのぞいてみて。",
  },
  {
    tags: [GREETING_TAG.motivation, GREETING_TAG.encourage_exam],
    eyebrow: "新しい挑戦、応援するよ！",
    headline: "ここから始まる毎日が、素敵な学びの旅になりますように。",
  },
  {
    tags: [GREETING_TAG.trust, GREETING_TAG.motivation],
    eyebrow: "一緒ならきっと大丈夫。",
    headline: "最初は少しずつでいいんだよ。なりたい自分に向かって、今日から歩き出そう。",
  },
];

/** 再訪者：深夜（0–4） */
const POOL_WEE_HOURS: PooledGreeting[] = [
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "こんな時間まで起きてるの？",
    headline: "頑張るのもいいけど、睡眠も大事だよ。今日はこの辺で寝ない？",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.encourage_exam],
    eyebrow: "夜ふかしさん、みっけ。",
    headline: "たまには早く寝るのも、立派なテスト対策だよ。無理しないでね。",
  },
  {
    tags: [GREETING_TAG.motivation, GREETING_TAG.progress],
    eyebrow: "まだ起きててえらいね。",
    headline: "1問だけ解いたら、今日はお布団にダイブしよう！",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "静かな夜だね。",
    headline: "焦らなくても大丈夫。自分のペースで、少しずつ進んでいこうね。",
  },
  {
    tags: [GREETING_TAG.relax],
    eyebrow: "あくび、出ちゃってない？",
    headline: "目を閉じて、深呼吸してみて。頑張ってる自分を褒めてあげてね。",
  },
  {
    tags: [GREETING_TAG.encourage_exam, GREETING_TAG.relax],
    eyebrow: "夜中のひらめきタイム？",
    headline: "記憶を定着させるには、ぐっすり眠ることも大切なんだよ。",
  },
  {
    tags: [GREETING_TAG.trust, GREETING_TAG.relax],
    eyebrow: "いつも本当にお疲れさま。",
    headline: "夜は不安になりやすいからね。温かい飲み物でも飲んでほっと一息。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "頑張りすぎは禁物だよ。",
    headline: "明日の自分のために、今日はもう休むのも勇気だよ。",
  },
  {
    tags: [GREETING_TAG.trust],
    eyebrow: "おめめ、こすってない？",
    headline: "スマホの光は少し暗くしてね。少しでも目を休ませてあげよう。",
  },
  {
    tags: [GREETING_TAG.motivation, GREETING_TAG.progress],
    eyebrow: "今日も1日、よく頑張ったね。",
    headline: "アプリを開いてくれただけで十分すごいよ！ゆっくり休んでね。",
  },
  {
    tags: [GREETING_TAG.trust, GREETING_TAG.motivation],
    eyebrow: "誰も見てない時間だけど。",
    headline: "今ここで頑張っていること、ちゃんと積み重なっているからね。",
  },
  {
    tags: [GREETING_TAG.progress, GREETING_TAG.encourage_exam],
    eyebrow: "こっそり種まきタイム。",
    headline: "今まいた知識の種は、きっといつか自分を助ける綺麗な花を咲かせるよ。",
  },
  {
    tags: [GREETING_TAG.motivation, GREETING_TAG.progress],
    eyebrow: "自分を信じる練習中。",
    headline: "「今日も少しできた」の積み重ねが、未来の揺るぎない自信につながるんだ。",
  },
  {
    tags: [GREETING_TAG.progress, GREETING_TAG.trust],
    eyebrow: "夜は静かで集中できるね。",
    headline: "この静かな時間が、少しずつ確かな実力に変わっていくんだよ。",
  },
  {
    tags: [GREETING_TAG.motivation, GREETING_TAG.encourage_exam],
    eyebrow: "眠気と戦う夜にも。",
    headline: "なりたい自分に向かっていくひたむきな姿勢、すごくかっこいいと思うな。",
  },
];

/** 朝（5–10） */
const POOL_MORNING: PooledGreeting[] = [
  {
    tags: [GREETING_TAG.motivation, GREETING_TAG.relax],
    eyebrow: "おはよう！よく眠れた？",
    headline: "今日も1日、自分のペースでぼちぼちいこうね。",
  },
  {
    tags: [GREETING_TAG.motivation, GREETING_TAG.progress],
    eyebrow: "新しい朝が来たよ！",
    headline: "まずは1問、のぞいてみるだけでも大正解！一緒にスタートしよう。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "朝の空気、気持ちいいね。",
    headline: "朝ごはんは食べた？エネルギーチャージして、今日もゆるっと。",
  },
  {
    tags: [GREETING_TAG.motivation, GREETING_TAG.progress],
    eyebrow: "今日も会えて嬉しいな。",
    headline: "朝の5分だけでも、積み重なれば大きな力になるよ。応援してるね。",
  },
  {
    tags: [GREETING_TAG.relax],
    eyebrow: "眠気、覚めたかな？",
    headline: "伸びをして、深呼吸！焦らずに、一つずつ確認していこう。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "朝のスタートダッシュ！",
    headline: "…はしなくても大丈夫。歩くくらいのスピードで、一緒に進もうね。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "いいお天気だといいな。",
    headline: "今日の目標は「無理しないこと」！肩の力を抜いていこう。",
  },
  {
    tags: [GREETING_TAG.motivation, GREETING_TAG.progress],
    eyebrow: "スッキリ起きられた？",
    headline: "朝のクリアな頭で、少しだけ復習してみるのもおすすめだよ。",
  },
  {
    tags: [GREETING_TAG.trust, GREETING_TAG.relax],
    eyebrow: "さあ、今日のはじまり！",
    headline: "うまくいかない日があっても大丈夫。いつでもここで待ってるからね。",
  },
  {
    tags: [GREETING_TAG.motivation, GREETING_TAG.encourage_exam],
    eyebrow: "朝活、えらいね！",
    headline: "眠いのにアプリを開いた自分に、まずは拍手！いい日になりますように。",
  },
  {
    tags: [GREETING_TAG.motivation, GREETING_TAG.progress],
    eyebrow: "真新しい1日がきたね。",
    headline: "今日はどんな新しい知識と出会えるかな。ちょっとワクワクするね。",
  },
  {
    tags: [GREETING_TAG.encourage_exam, GREETING_TAG.progress],
    eyebrow: "はじまりの朝だよ。",
    headline: "どんなに大きな目標も、まずは今日の小さな一歩から始まるんだ。",
  },
  {
    tags: [GREETING_TAG.progress, GREETING_TAG.motivation],
    eyebrow: "毎日のルーティン、最高！",
    headline: "続けることって、すごい才能なんだよ。ちゃんと、その才能持ってるね。",
  },
  {
    tags: [GREETING_TAG.motivation, GREETING_TAG.progress],
    eyebrow: "朝の光ってエネルギーになるね。",
    headline: "昨日の自分をほんの少しだけ超えるつもりで、今日もいってみよう。",
  },
  {
    tags: [GREETING_TAG.encourage_exam, GREETING_TAG.motivation],
    eyebrow: "おはよう！さあ、いこう。",
    headline: "つまずいた問題は、これからもっともっと伸びるためのヒントだよ。",
  },
];

/** 昼（11–15） */
const POOL_DAY: PooledGreeting[] = [
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "お昼ごはん、美味しかった？",
    headline: "午後は眠くなりやすいから、少しだけ休憩してからでもいいんだよ。",
  },
  {
    tags: [GREETING_TAG.relax],
    eyebrow: "ちょっと一息つかない？",
    headline: "集中力が切れたら、窓の外をぼーっと眺めるのもいいかもね。",
  },
  {
    tags: [GREETING_TAG.trust, GREETING_TAG.progress],
    eyebrow: "順調に進んでる？",
    headline: "周りと比べなくて大丈夫。昨日の自分より、ほんの少し進めば花丸だよ。",
  },
  {
    tags: [GREETING_TAG.motivation, GREETING_TAG.relax],
    eyebrow: "午後のひと頑張り！",
    headline: "疲れたら甘いものでも食べて、のんびりいこうね。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.progress],
    eyebrow: "太陽が一番高い時間だね。",
    headline: "焦る気持ちが出てきたら、いったん深呼吸。大丈夫、ちゃんと進んでるよ。",
  },
  {
    tags: [GREETING_TAG.motivation, GREETING_TAG.progress],
    eyebrow: "隙間時間、見つけたね！",
    headline: "電車の中や待ち時間でも、1問解けたら十分すごいことだよ。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "ちょっと疲れちゃった？",
    headline: "そんな時は、得意な分野を復習して、自信を取り戻すのもアリだよ。",
  },
  {
    tags: [GREETING_TAG.progress, GREETING_TAG.relax],
    eyebrow: "毎日コツコツ、えらいね。",
    headline: "たまには思いっきり遊ぶ日を作ってもいいんだよ。メリハリが大事！",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "お茶でも飲んでいこう。",
    headline: "難しい問題は、いったん飛ばしちゃってもいいよ。後でまた戻ってこよう。",
  },
  {
    tags: [GREETING_TAG.relax],
    eyebrow: "気分転換も忘れずにね。",
    headline: "立ち上がって軽くストレッチ！体を動かすと、頭もスッキリするよ。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "お昼のエネルギーチャージ！",
    headline: "焦らなくていいんだよ。自分のペースで進むことが、結局は一番の近道だから。",
  },
  {
    tags: [GREETING_TAG.motivation, GREETING_TAG.progress],
    eyebrow: "「なぜ？」は成長の合図。",
    headline: "わからないことを知っていくのって、ちょっと楽しい冒険みたいだね。",
  },
  {
    tags: [GREETING_TAG.progress, GREETING_TAG.trust],
    eyebrow: "いい波に乗れてるかな。",
    headline: "できるようになったこと、時々は立ち止まってしっかり自分を褒めてあげてね。",
  },
  {
    tags: [GREETING_TAG.encourage_exam, GREETING_TAG.progress],
    eyebrow: "難しい問題に出会った？",
    headline: "うんうん悩んだ時間だけ、知識はしっかり身に染み込んでくれるよ。",
  },
  {
    tags: [GREETING_TAG.progress, GREETING_TAG.encourage_exam],
    eyebrow: "午後もコツコツ進もう。",
    headline: "水滴が石を穿つように、今日の地道な努力が確実に未来を作っているよ。",
  },
];

/** 夕方（16–18） */
const POOL_TWILIGHT: PooledGreeting[] = [
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "夕焼け、きれいかな？",
    headline: "今日の勉強は、キリのいいところで終わりにしてもいいんだよ。",
  },
  {
    tags: [GREETING_TAG.relax],
    eyebrow: "そろそろ夜ご飯の時間？",
    headline: "美味しいものを食べて、今日の疲れをしっかりリセットしようね。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.motivation],
    eyebrow: "帰り道かな？気をつけてね。",
    headline: "移動中にアプリを開いてくれてありがとう！無理せず、流し見でもいいよ。",
  },
  {
    tags: [GREETING_TAG.motivation, GREETING_TAG.relax],
    eyebrow: "夕方のひと頑張り！",
    headline: "最後の力を振り絞って…なんて言わないよ。ゆるっと復習だけしておこう。",
  },
  {
    tags: [GREETING_TAG.encourage_exam, GREETING_TAG.progress],
    eyebrow: "夕暮れ時、もうひと踏ん張り。",
    headline: "ここで開いた1ページが、いつか現場に立つときのお守りになるかもしれないね。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "夕方のお茶タイム。",
    headline: "頭が疲れてきたら、温かい飲み物でゆっくり休憩していこう。",
  },
  {
    tags: [GREETING_TAG.motivation, GREETING_TAG.progress],
    eyebrow: "今日も1日、お疲れさま！",
    headline: "頑張った自分を、たくさん褒めてあげてね。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "西日が差してきたね。",
    headline: "目が疲れてないかな？少しだけ画面から離れて、遠くを眺めてみよう。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "ホッと一息、つきたいね。",
    headline: "頑張りすぎたなと思ったら、明日は少しペースダウンしてもいいんだよ。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "学校・バイト終わり？",
    headline: "ぐったり疲れてる時は、無理に問題を解かなくてもOK。眺めるだけで偉いよ。",
  },
  {
    tags: [GREETING_TAG.relax],
    eyebrow: "夕方の風、感じてる？",
    headline: "外の空気を吸って深呼吸してから、ゆるっと再開しよう。",
  },
  {
    tags: [GREETING_TAG.progress, GREETING_TAG.motivation],
    eyebrow: "今日の振り返りタイム。",
    headline: "「これだけは覚えた」って一個でも見つかったら、今日は十分合格点だよ。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "夕方眠い、わかる。",
    headline: "15分の仮眠が夜の集中を変えてくれることもあるよ。無理しないでね。",
  },
  {
    tags: [GREETING_TAG.trust, GREETING_TAG.progress],
    eyebrow: "間違えちゃっても大丈夫。",
    headline: "エラーは失敗じゃなくて、「次は間違えないぞ」っていう大切な発見なんだ。",
  },
  {
    tags: [GREETING_TAG.trust, GREETING_TAG.progress],
    eyebrow: "自分のペースが一番だよ。",
    headline: "ゴールだけじゃなくて、そこに向かって一生懸命な今の時間も宝物になるよ。",
  },
];

/** 夜（19–21） */
const POOL_EVENING: PooledGreeting[] = [
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "今日はどんな1日だった？",
    headline: "予定通りにいかなくても大丈夫。明日また、新しい気持ちで始めよう。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.progress],
    eyebrow: "もう少しで今日も終わり。",
    headline: "わからない問題はノートにメモだけして、今日はもう忘れちゃおう。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.progress],
    eyebrow: "お風呂で温まろうね。",
    headline: "今日覚えたことを、お湯に浸かりながらぼんやり振り返るのもおすすめだよ。",
  },
  {
    tags: [GREETING_TAG.motivation, GREETING_TAG.progress],
    eyebrow: "1日の締めくくりだね。",
    headline: "今日も少しだけ前に進めたね。本当によく頑張りました！",
  },
  {
    tags: [GREETING_TAG.progress, GREETING_TAG.motivation],
    eyebrow: "今日の道のりを振り返ろう。",
    headline: "朝の自分より、今のほうがずっとたくさんのことを知っているね。",
  },
  {
    tags: [GREETING_TAG.progress, GREETING_TAG.encourage_exam],
    eyebrow: "毎日がんばる自分へ。",
    headline: "目には見えなくても、実力は毎日ちゃんとアップデートされているよ。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "夜ご飯、美味しかった？",
    headline: "お腹が満たされたら、ゆるっと1問だけ覗いてみるのもいいかもね。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "ドラマ見ながらでも。",
    headline: "ながら勉強も立派な勉強。机に向かう日だけが正解じゃないからね。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.motivation],
    eyebrow: "夜の時間、貴重だね。",
    headline: "30分集中したら、あとは好きなことをして自分にご褒美の時間を作ろう。",
  },
  {
    tags: [GREETING_TAG.progress, GREETING_TAG.motivation],
    eyebrow: "今日もここまで来たね。",
    headline: "焦って詰め込むより、寝る前にちょっと振り返るほうが記憶に残るんだよ。",
  },
  {
    tags: [GREETING_TAG.trust, GREETING_TAG.relax],
    eyebrow: "SNSの誘惑、わかる。",
    headline: "でも、ちょっとだけここに戻ってきてくれて、本当にありがとう。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "夜の集中力、人それぞれ。",
    headline: "冴えるタイプならどうぞ。眠くなるタイプは無理せず、明日に回そう。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.progress],
    eyebrow: "夜のリラックスタイム。",
    headline: "難しい問題よりも、解説を読み直すだけの夜があっても全然いいんだよ。",
  },
  {
    tags: [GREETING_TAG.trust],
    eyebrow: "目、しょぼしょぼしない？",
    headline: "画面の明るさを少し下げて、ブルーライトカットも有効活用してね。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "夜の30分は朝の1時間。",
    headline: "って言われることもあるけど、無理は禁物。眠かったら寝るのが正解。",
  },
];

/** 寝る前（22–23） */
const POOL_NIGHT: PooledGreeting[] = [
  {
    tags: [GREETING_TAG.trust, GREETING_TAG.relax],
    eyebrow: "夜も更けてきたね。",
    headline: "目の疲れ、たまってない？遠くを見たり、目を温めたりしてみてね。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "そろそろ休む時間だよ。",
    headline: "明日のために、今日はもうスマホを置いて、ぐっすり眠る準備をしよう。",
  },
  {
    tags: [GREETING_TAG.motivation, GREETING_TAG.trust],
    eyebrow: "今日も最後までえらいね。",
    headline: "画面の明るさを下げて、目に優しい設定にしておいてね。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "静かな時間、集中できる？",
    headline: "夜は頭が冴えちゃうこともあるけど、睡眠時間だけは削らないでね。",
  },
  {
    tags: [GREETING_TAG.motivation, GREETING_TAG.progress],
    eyebrow: "1日、本当にお疲れさま。",
    headline: "どんなに短い時間でも、毎日続けようとする気持ちが素晴らしいよ。",
  },
  {
    tags: [GREETING_TAG.progress, GREETING_TAG.encourage_exam],
    eyebrow: "お布団の準備はできた？",
    headline: "寝る前の5分だけ、今日の復習をすると、記憶に残りやすいみたいだよ。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "リラックスタイムかな。",
    headline: "好きな音楽でも聴きながら、ゆったりした気持ちで画面を見てね。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "焦らなくて大丈夫だよ。",
    headline: "寝る前に不安になっちゃったら、深呼吸。明日の自分にバトンタッチしよう。",
  },
  {
    tags: [GREETING_TAG.progress, GREETING_TAG.motivation],
    eyebrow: "今日のできたこと探し！",
    headline: "1問でも解けた、開いただけでもOK！小さな「できた」を数えて寝よう。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "ゆっくり休んでね。",
    headline: "明日もまた、ここで待ってるよ。おやすみなさい。いい夢見てね。",
  },
  {
    tags: [GREETING_TAG.motivation, GREETING_TAG.progress],
    eyebrow: "今日もやり切ったね。",
    headline: "努力できる自分を、今日は思いっきり誇らしく思いながら眠りにつこう。",
  },
  {
    tags: [GREETING_TAG.trust, GREETING_TAG.encourage_exam],
    eyebrow: "不安になる夜もあるよね。",
    headline: "でも大丈夫。ここまで積み上げてきたものは、絶対に裏切らないよ。",
  },
  {
    tags: [GREETING_TAG.encourage_exam, GREETING_TAG.progress],
    eyebrow: "未来の自分へのプレゼント。",
    headline: "今日勉強したことは、明日からの自分を支える強くて優しいお守りになるよ。",
  },
  {
    tags: [GREETING_TAG.relax, GREETING_TAG.trust],
    eyebrow: "完璧じゃなくてもいいんだ。",
    headline: "「今日はここまで」って割り切るのも、長く走り続けるための大切なスキルだよ。",
  },
  {
    tags: [GREETING_TAG.progress, GREETING_TAG.motivation],
    eyebrow: "頑張りのバトンタッチ。",
    headline: "今日の自分から、明日の自分へ。ゆっくり休んで、また明日もよろしくね。",
  },
];

export const GREETING_POOLS: Record<TimeSlot, PooledGreeting[]> = {
  wee_hours: POOL_WEE_HOURS,
  morning: POOL_MORNING,
  day: POOL_DAY,
  twilight: POOL_TWILIGHT,
  evening: POOL_EVENING,
  night: POOL_NIGHT,
};

export function toPublicLines(p: PooledGreeting): HomeGreetingLines {
  return { eyebrow: p.eyebrow, headline: p.headline };
}
