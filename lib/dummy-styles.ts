import type { Style } from "./types";

/**
 * Supabase につながっていないときに表示する仮データ（30件）。
 * 担当スタイリスト名は投票画面に出さない方針のため、ここでは持たせていない。
 * フェーズ3で Supabase の styles テーブルから取得する形に差し替えます。
 * 画像は picsum.photos のサンプル写真を使っています。
 */

const SOURCE: Array<{
  title: string;
  stylist: string;
  caption: string;
  tags: string[];
  salon: "PAUL" | "COCO";
}> = [
  { title: "くびれミディ", stylist: "田中 美咲", caption: "顔まわりのレイヤーで小顔に見せる、いちばん人気のミディアム。", tags: ["ミディアム", "レイヤー", "小顔"], salon: "PAUL" },
  { title: "韓国風レイヤーロング", stylist: "佐藤 健一", caption: "毛先のワンカールだけでまとまる、伸ばしかけでもいけるロング。", tags: ["ロング", "韓国風", "巻き髪"], salon: "PAUL" },
  { title: "大人ショートボブ", stylist: "鈴木 あかり", caption: "襟足すっきり、乾かすだけで決まる大人のショートボブ。", tags: ["ショート", "ボブ", "時短"], salon: "COCO" },
  { title: "ミルクティーベージュ", stylist: "高橋 優", caption: "ブリーチ1回で作る、やわらかい透明感カラー。", tags: ["カラー", "ベージュ", "透明感"], salon: "COCO" },
  { title: "ゆるふわパーマ", stylist: "田中 美咲", caption: "根元から自然な動き。朝は水で濡らしてもみ込むだけ。", tags: ["パーマ", "ゆるふわ"], salon: "PAUL" },
  { title: "切りっぱなしボブ", stylist: "伊藤 さくら", caption: "重めラインで今っぽく。ストレートでもワンカールでも。", tags: ["ボブ", "外ハネ"], salon: "PAUL" },
  { title: "ハイライトグラデ", stylist: "高橋 優", caption: "細めハイライトで伸びてきても気にならない。", tags: ["カラー", "ハイライト"], salon: "COCO" },
  { title: "エアリーウルフ", stylist: "渡辺 涼", caption: "襟足を残したウルフレイヤー。動きが出るので直毛さんにも。", tags: ["ウルフ", "レイヤー"], salon: "COCO" },
  { title: "前下がりボブ", stylist: "鈴木 あかり", caption: "後ろを短く、前を長く。横顔がきれいに見えるライン。", tags: ["ボブ", "前下がり"], salon: "PAUL" },
  { title: "ナチュラルストレート", stylist: "山本 直樹", caption: "縮毛矯正を自然な質感で。ぺたんとしません。", tags: ["ストレート", "縮毛矯正"], salon: "PAUL" },
  { title: "シースルーバング", stylist: "伊藤 さくら", caption: "おでこが透ける軽い前髪。伸びてもかわいい長さで。", tags: ["前髪", "シースルー"], salon: "COCO" },
  { title: "インナーカラーピンク", stylist: "中村 ひかる", caption: "耳にかけたときだけ見える差し色。オフィスでも大丈夫。", tags: ["カラー", "インナーカラー", "ピンク"], salon: "COCO" },
  { title: "ハンサムショート", stylist: "渡辺 涼", caption: "耳かけがきれいに決まる、中性的なショート。", tags: ["ショート", "ハンサム"], salon: "PAUL" },
  { title: "デジタルパーマ ロング", stylist: "田中 美咲", caption: "コテなしで毎朝カールが復活するデジパー。", tags: ["パーマ", "ロング"], salon: "PAUL" },
  { title: "オリーブグレージュ", stylist: "高橋 優", caption: "赤みを消して外国人風に。色落ちもきれい。", tags: ["カラー", "グレージュ"], salon: "COCO" },
  { title: "ふんわりミディ", stylist: "小林 結衣", caption: "トップにボリュームを出して、ぺたんこ髪を解決。", tags: ["ミディアム", "ボリューム"], salon: "COCO" },
  { title: "レイヤーロブ", stylist: "伊藤 さくら", caption: "肩につく長さのロング×ボブ。結べるギリギリ。", tags: ["ロブ", "レイヤー"], salon: "PAUL" },
  { title: "波ウェーブアレンジ", stylist: "中村 ひかる", caption: "結婚式やお呼ばれに。自分でもできる巻き方をお伝えします。", tags: ["アレンジ", "ウェーブ"], salon: "PAUL" },
  { title: "マッシュウルフ", stylist: "山本 直樹", caption: "丸みとハネを両立。メンズにも人気のシルエット。", tags: ["ウルフ", "マッシュ"], salon: "COCO" },
  { title: "ブルーブラック", stylist: "渡辺 涼", caption: "光に当たると青く見える暗髪。就活・仕事でもOK。", tags: ["カラー", "暗髪"], salon: "COCO" },
  { title: "ワンレンロング", stylist: "小林 結衣", caption: "段を入れない王道ロング。毛先をそろえて艶を出します。", tags: ["ロング", "ワンレン", "艶髪"], salon: "PAUL" },
  { title: "くせ毛風パーマ", stylist: "田中 美咲", caption: "無造作な動き。スタイリング剤をもみ込むだけ。", tags: ["パーマ", "無造作"], salon: "PAUL" },
  { title: "エッジショート", stylist: "鈴木 あかり", caption: "刈り上げを入れたスタイリッシュなショート。", tags: ["ショート", "刈り上げ"], salon: "COCO" },
  { title: "ハイトーンベージュ", stylist: "高橋 優", caption: "ブリーチ2回のハイトーン。ケアブリーチで傷みを抑えます。", tags: ["カラー", "ハイトーン"], salon: "COCO" },
  { title: "姫カット", stylist: "中村 ひかる", caption: "顔まわりだけ短く。個性が出る旬のスタイル。", tags: ["姫カット", "個性派"], salon: "PAUL" },
  { title: "ぱっつん前髪ボブ", stylist: "伊藤 さくら", caption: "重めの前髪×あご下ボブ。目を大きく見せます。", tags: ["ボブ", "前髪"], salon: "PAUL" },
  { title: "外ハネミディ", stylist: "小林 結衣", caption: "毛先を外に流すだけ。ヘアアイロン初心者さん向け。", tags: ["ミディアム", "外ハネ"], salon: "COCO" },
  { title: "グラデーションカラー", stylist: "渡辺 涼", caption: "根元は暗く、毛先を明るく。伸びても目立ちません。", tags: ["カラー", "グラデーション"], salon: "COCO" },
  { title: "ツーブロックショート", stylist: "山本 直樹", caption: "サイドをすっきり。ビジネスでも清潔感のあるメンズショート。", tags: ["メンズ", "ツーブロック"], salon: "PAUL" },
  { title: "ローポニーアレンジ", stylist: "小林 結衣", caption: "後れ毛のバランスで大人っぽく。5分でできます。", tags: ["アレンジ", "まとめ髪"], salon: "PAUL" },
];

export const DUMMY_STYLES: Style[] = SOURCE.map((s, i) => {
  const seed = `hairvote-${String(i + 1).padStart(2, "0")}`;
  return {
    id: `dummy-${String(i + 1).padStart(2, "0")}`,
    imageUrl: `https://picsum.photos/seed/${seed}/900/900`,
    thumbUrl: `https://picsum.photos/seed/${seed}/450/450`,
    title: s.title,
    caption: s.caption,
    tags: s.tags,
    salon: s.salon,
    displayOrder: i + 1,
    isActive: true,
  };
});
