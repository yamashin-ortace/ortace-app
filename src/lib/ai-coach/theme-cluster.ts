import type { Question } from "@/lib/questions";

export type AiThemeCluster = {
  id: string;
  label: string;
};

export const AI_THEME_CLUSTERS = [
  cluster("visual-physiology", "視覚生理と神経伝導"),
  cluster("ocular-anatomy-orbit", "眼球・眼窩の解剖"),
  cluster("ocular-development-measurement", "眼の発生と正常値"),
  cluster("lens-prism-optics", "レンズ・プリズム光学"),
  cluster("refraction-accommodation-calculation", "屈折・調節計算"),
  cluster("acuity-angle-calculation", "視力・視角計算"),
  cluster("ocular-optics-aberration", "眼球光学と収差"),
  cluster("contact-lens-optics", "コンタクトレンズ光学"),
  cluster("iol-surgical-optics", "眼内レンズと手術光学"),
  cluster("visual-acuity-testing", "視力検査"),
  cluster("refraction-testing", "屈折検査"),
  cluster("anterior-segment-testing", "前眼部検査"),
  cluster("fundus-imaging", "眼底・画像検査"),
  cluster("eye-pressure-angle", "眼圧・隅角検査"),
  cluster("visual-field-reading", "視野検査の読み取り"),
  cluster("electrophysiology", "電気生理検査"),
  cluster("color-vision-testing", "色覚検査"),
  cluster("dark-adaptation-light-sense", "暗順応・光覚検査"),
  cluster("binocular-basis", "両眼視の基礎"),
  cluster("convergence-accommodation", "輻湊・調節"),
  cluster("binocular-optics-calculation", "両眼視光学計算"),
  cluster("ocular-motility-exam", "眼球運動検査"),
  cluster("stereopsis-suppression", "立体視・抑制検査"),
  cluster("retinal-correspondence", "網膜対応"),
  cluster("ocular-motility-laws", "眼球運動の法則"),
  cluster("esotropia", "内斜視"),
  cluster("exotropia", "外斜視"),
  cluster("vertical-pattern-strabismus", "垂直斜視・A-V型"),
  cluster("paralytic-strabismus", "神経麻痺性斜視"),
  cluster("special-strabismus-syndrome", "特殊な斜視・症候群"),
  cluster("strabismus-surgery", "斜視手術"),
  cluster("prism-optical-correction", "プリズム療法・光学矯正"),
  cluster("nystagmus-head-posture", "眼振と代償頭位"),
  cluster("amblyopia-cause", "弱視の分類・原因"),
  cluster("amblyopia-diagnosis", "弱視の診断・検査"),
  cluster("amblyopia-treatment", "弱視治療・訓練"),
  cluster("low-vision-care", "ロービジョンケア"),
  cluster("glaucoma-visual-field", "緑内障と視野変化"),
  cluster("glaucoma-clinical", "緑内障の検査・治療"),
  cluster("retina-fundus-disease", "網膜疾患と眼底所見"),
  cluster("cataract-lens", "白内障と水晶体"),
  cluster("cornea-conjunctiva-infection", "角結膜・感染症"),
  cluster("uveitis-immunity", "ぶどう膜炎・免疫疾患"),
  cluster("neuro-ophthalmology", "神経眼科"),
  cluster("eyelid-orbit-disease", "眼瞼・眼窩疾患"),
  cluster("systemic-eye", "全身疾患と眼"),
  cluster("pharmacology-eyedrops", "薬理・点眼薬"),
  cluster("trauma-emergency", "外傷・緊急眼疾患"),
  cluster("ethics-safety-communication", "医療倫理・安全・接遇"),
  cluster("law-social-system", "法規・制度"),
  cluster("case-reasoning", "症例の読み解き"),
] as const satisfies readonly AiThemeCluster[];

const CLUSTER_BY_ID = new Map(AI_THEME_CLUSTERS.map((item) => [item.id, item]));

const MINOR_CLUSTER_IDS: Record<string, string> = {
  "視覚生理・神経生理": "visual-physiology",
  "眼球・眼窩の解剖": "ocular-anatomy-orbit",
  "眼の発生・生理的計測値": "ocular-development-measurement",
  "レンズ・プリズム光学": "lens-prism-optics",
  "屈折・調節計算": "refraction-accommodation-calculation",
  "視力・視角計算": "acuity-angle-calculation",
  "眼球光学・収差": "ocular-optics-aberration",
  "コンタクトレンズ光学": "contact-lens-optics",
  "眼内レンズ・手術光学": "iol-surgical-optics",
  "視力検査": "visual-acuity-testing",
  "屈折検査": "refraction-testing",
  "前眼部検査": "anterior-segment-testing",
  "眼底・画像検査": "fundus-imaging",
  "眼圧・隅角検査": "eye-pressure-angle",
  "視野検査・機器": "visual-field-reading",
  "電気生理検査": "electrophysiology",
  "色覚検査": "color-vision-testing",
  "暗順応・光覚検査": "dark-adaptation-light-sense",
  "両眼視の基礎": "binocular-basis",
  "輻湊・調節検査": "convergence-accommodation",
  "輻湊・調節障害": "convergence-accommodation",
  "輻湊・両眼視光学計算": "binocular-optics-calculation",
  "斜視・眼球運動検査": "ocular-motility-exam",
  "立体視・抑制検査": "stereopsis-suppression",
  "網膜対応": "retinal-correspondence",
  "眼球運動・法則": "ocular-motility-laws",
  "内斜視": "esotropia",
  "外斜視": "exotropia",
  "A-V型・垂直斜視": "vertical-pattern-strabismus",
  "神経麻痺性斜視": "paralytic-strabismus",
  "特殊な斜視・症候群": "special-strabismus-syndrome",
  "斜視手術": "strabismus-surgery",
  "プリズム療法・光学矯正": "prism-optical-correction",
  "眼振": "nystagmus-head-posture",
  "頭位異常・代償頭位": "nystagmus-head-posture",
  "弱視の分類・原因": "amblyopia-cause",
  "弱視の診断・検査": "amblyopia-diagnosis",
  "弱視治療・訓練": "amblyopia-treatment",
  "眼球運動訓練・両眼視訓練": "amblyopia-treatment",
  "ロービジョンケア": "low-vision-care",
  "ロービジョン症例": "low-vision-care",
  "緑内障": "glaucoma-clinical",
  "網膜疾患": "retina-fundus-disease",
  "白内障": "cataract-lens",
  "角膜・結膜疾患": "cornea-conjunctiva-infection",
  "感染性眼疾患": "cornea-conjunctiva-infection",
  "ぶどう膜炎・免疫疾患": "uveitis-immunity",
  "免疫・病理": "uveitis-immunity",
  "神経眼科": "neuro-ophthalmology",
  "瞳孔・神経眼科検査": "neuro-ophthalmology",
  "眼瞼・眼窩疾患": "eyelid-orbit-disease",
  "全身疾患と眼": "systemic-eye",
  "薬理・点眼薬": "pharmacology-eyedrops",
  "外傷・緊急眼疾患": "trauma-emergency",
  "医療倫理・インフォームドコンセント": "ethics-safety-communication",
  "医療安全・感染対策": "ethics-safety-communication",
  "視能訓練士法・業務": "law-social-system",
  "社会保障・障害者制度": "law-social-system",
  "公衆衛生・統計": "law-social-system",
  "眼科疾患症例": "case-reasoning",
  "斜視・眼球運動症例": "case-reasoning",
  "偽斜視": "esotropia",
  "ボツリヌス療法": "strabismus-surgery",
  "アイフレイル": "law-social-system",
};

export function getAiThemeCluster(question: Question): AiThemeCluster {
  const text = normalizeText(
    `${question.majorCategory} ${question.minorCategory} ${question.theme}`,
  );
  const minor = question.minorCategory.trim();

  if (hasAny(text, ["緑内障"]) && hasAny(text, ["視野", "視野欠損", "視野変化"])) {
    return requireCluster("glaucoma-visual-field");
  }
  if (hasAny(text, ["緑内障"])) {
    return requireCluster("glaucoma-clinical");
  }
  if (hasAny(text, ["Vogt", "原田病", "サルコイド", "ぶどう膜炎", "自己免疫"])) {
    return requireCluster("uveitis-immunity");
  }
  if (hasAny(text, ["糖尿病網膜症", "網膜剥離", "黄斑", "網膜静脈", "網膜動脈"])) {
    return requireCluster("retina-fundus-disease");
  }

  const mapped = MINOR_CLUSTER_IDS[minor];
  if (mapped) return requireCluster(mapped);

  if (question.majorCategory === "症例問題") {
    return requireCluster("case-reasoning");
  }
  if (question.majorCategory === "法規・制度・医療倫理") {
    return requireCluster("ethics-safety-communication");
  }
  if (question.majorCategory === "視野・電気生理・色覚") {
    return requireCluster("visual-field-reading");
  }
  if (question.majorCategory === "弱視・視能訓練") {
    return requireCluster("amblyopia-treatment");
  }
  if (question.majorCategory === "両眼視・斜視") {
    return requireCluster("ocular-motility-exam");
  }
  if (question.majorCategory === "眼科疾患・神経眼科") {
    return requireCluster("neuro-ophthalmology");
  }
  if (question.majorCategory === "眼光学・視力学・計算") {
    return requireCluster("refraction-accommodation-calculation");
  }
  if (question.majorCategory === "視能検査・検査機器") {
    return requireCluster("visual-acuity-testing");
  }
  return requireCluster("visual-physiology");
}

export function getAiThemeClusterById(id: string): AiThemeCluster | null {
  return CLUSTER_BY_ID.get(id) ?? null;
}

export function getAiThemeKey(question: Question): string {
  return getAiThemeCluster(question).id;
}

export function getAiThemeLabel(question: Question): string {
  return getAiThemeCluster(question).label;
}

function cluster(id: string, label: string): AiThemeCluster {
  return { id, label };
}

function requireCluster(id: string): AiThemeCluster {
  const item = CLUSTER_BY_ID.get(id);
  if (!item) return AI_THEME_CLUSTERS[0];
  return item;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[・･\s（）()\[\]［］【】]/g, "")
    .toLowerCase();
}

function hasAny(text: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => text.includes(normalizeText(keyword)));
}
