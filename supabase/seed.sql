-- =====================================================================
-- サンプルのスタイル写真30件。
-- Supabase の「SQL Editor」に貼り付けて実行すると、投票画面に写真が並びます。
-- 実際の写真はフェーズ4の管理画面から登録できるようにします。
-- 何度実行しても重複しません（同じIDのものは追加されません）。
-- =====================================================================

insert into styles (id, image_url, thumb_url, title, stylist, caption, tags, salon, display_order, is_active)
values
  ('00000000-0000-4000-8000-000000000001', 'https://picsum.photos/seed/hairvote-01/900/900', 'https://picsum.photos/seed/hairvote-01/450/450', 'くびれミディ', '田中 美咲', '顔まわりのレイヤーで小顔に見せる、いちばん人気のミディアム。', array['ミディアム', 'レイヤー', '小顔']::text[], 'PAUL', 1, true),
  ('00000000-0000-4000-8000-000000000002', 'https://picsum.photos/seed/hairvote-02/900/900', 'https://picsum.photos/seed/hairvote-02/450/450', '韓国風レイヤーロング', '佐藤 健一', '毛先のワンカールだけでまとまる、伸ばしかけでもいけるロング。', array['ロング', '韓国風', '巻き髪']::text[], 'PAUL', 2, true),
  ('00000000-0000-4000-8000-000000000003', 'https://picsum.photos/seed/hairvote-03/900/900', 'https://picsum.photos/seed/hairvote-03/450/450', '大人ショートボブ', '鈴木 あかり', '襟足すっきり、乾かすだけで決まる大人のショートボブ。', array['ショート', 'ボブ', '時短']::text[], 'COCO', 3, true),
  ('00000000-0000-4000-8000-000000000004', 'https://picsum.photos/seed/hairvote-04/900/900', 'https://picsum.photos/seed/hairvote-04/450/450', 'ミルクティーベージュ', '高橋 優', 'ブリーチ1回で作る、やわらかい透明感カラー。', array['カラー', 'ベージュ', '透明感']::text[], 'COCO', 4, true),
  ('00000000-0000-4000-8000-000000000005', 'https://picsum.photos/seed/hairvote-05/900/900', 'https://picsum.photos/seed/hairvote-05/450/450', 'ゆるふわパーマ', '田中 美咲', '根元から自然な動き。朝は水で濡らしてもみ込むだけ。', array['パーマ', 'ゆるふわ']::text[], 'PAUL', 5, true),
  ('00000000-0000-4000-8000-000000000006', 'https://picsum.photos/seed/hairvote-06/900/900', 'https://picsum.photos/seed/hairvote-06/450/450', '切りっぱなしボブ', '伊藤 さくら', '重めラインで今っぽく。ストレートでもワンカールでも。', array['ボブ', '外ハネ']::text[], 'PAUL', 6, true),
  ('00000000-0000-4000-8000-000000000007', 'https://picsum.photos/seed/hairvote-07/900/900', 'https://picsum.photos/seed/hairvote-07/450/450', 'ハイライトグラデ', '高橋 優', '細めハイライトで伸びてきても気にならない。', array['カラー', 'ハイライト']::text[], 'COCO', 7, true),
  ('00000000-0000-4000-8000-000000000008', 'https://picsum.photos/seed/hairvote-08/900/900', 'https://picsum.photos/seed/hairvote-08/450/450', 'エアリーウルフ', '渡辺 涼', '襟足を残したウルフレイヤー。動きが出るので直毛さんにも。', array['ウルフ', 'レイヤー']::text[], 'COCO', 8, true),
  ('00000000-0000-4000-8000-000000000009', 'https://picsum.photos/seed/hairvote-09/900/900', 'https://picsum.photos/seed/hairvote-09/450/450', '前下がりボブ', '鈴木 あかり', '後ろを短く、前を長く。横顔がきれいに見えるライン。', array['ボブ', '前下がり']::text[], 'PAUL', 9, true),
  ('00000000-0000-4000-8000-000000000010', 'https://picsum.photos/seed/hairvote-10/900/900', 'https://picsum.photos/seed/hairvote-10/450/450', 'ナチュラルストレート', '山本 直樹', '縮毛矯正を自然な質感で。ぺたんとしません。', array['ストレート', '縮毛矯正']::text[], 'PAUL', 10, true),
  ('00000000-0000-4000-8000-000000000011', 'https://picsum.photos/seed/hairvote-11/900/900', 'https://picsum.photos/seed/hairvote-11/450/450', 'シースルーバング', '伊藤 さくら', 'おでこが透ける軽い前髪。伸びてもかわいい長さで。', array['前髪', 'シースルー']::text[], 'COCO', 11, true),
  ('00000000-0000-4000-8000-000000000012', 'https://picsum.photos/seed/hairvote-12/900/900', 'https://picsum.photos/seed/hairvote-12/450/450', 'インナーカラーピンク', '中村 ひかる', '耳にかけたときだけ見える差し色。オフィスでも大丈夫。', array['カラー', 'インナーカラー', 'ピンク']::text[], 'COCO', 12, true),
  ('00000000-0000-4000-8000-000000000013', 'https://picsum.photos/seed/hairvote-13/900/900', 'https://picsum.photos/seed/hairvote-13/450/450', 'ハンサムショート', '渡辺 涼', '耳かけがきれいに決まる、中性的なショート。', array['ショート', 'ハンサム']::text[], 'PAUL', 13, true),
  ('00000000-0000-4000-8000-000000000014', 'https://picsum.photos/seed/hairvote-14/900/900', 'https://picsum.photos/seed/hairvote-14/450/450', 'デジタルパーマ ロング', '田中 美咲', 'コテなしで毎朝カールが復活するデジパー。', array['パーマ', 'ロング']::text[], 'PAUL', 14, true),
  ('00000000-0000-4000-8000-000000000015', 'https://picsum.photos/seed/hairvote-15/900/900', 'https://picsum.photos/seed/hairvote-15/450/450', 'オリーブグレージュ', '高橋 優', '赤みを消して外国人風に。色落ちもきれい。', array['カラー', 'グレージュ']::text[], 'COCO', 15, true),
  ('00000000-0000-4000-8000-000000000016', 'https://picsum.photos/seed/hairvote-16/900/900', 'https://picsum.photos/seed/hairvote-16/450/450', 'ふんわりミディ', '小林 結衣', 'トップにボリュームを出して、ぺたんこ髪を解決。', array['ミディアム', 'ボリューム']::text[], 'COCO', 16, true),
  ('00000000-0000-4000-8000-000000000017', 'https://picsum.photos/seed/hairvote-17/900/900', 'https://picsum.photos/seed/hairvote-17/450/450', 'レイヤーロブ', '伊藤 さくら', '肩につく長さのロング×ボブ。結べるギリギリ。', array['ロブ', 'レイヤー']::text[], 'PAUL', 17, true),
  ('00000000-0000-4000-8000-000000000018', 'https://picsum.photos/seed/hairvote-18/900/900', 'https://picsum.photos/seed/hairvote-18/450/450', '波ウェーブアレンジ', '中村 ひかる', '結婚式やお呼ばれに。自分でもできる巻き方をお伝えします。', array['アレンジ', 'ウェーブ']::text[], 'PAUL', 18, true),
  ('00000000-0000-4000-8000-000000000019', 'https://picsum.photos/seed/hairvote-19/900/900', 'https://picsum.photos/seed/hairvote-19/450/450', 'マッシュウルフ', '山本 直樹', '丸みとハネを両立。メンズにも人気のシルエット。', array['ウルフ', 'マッシュ']::text[], 'COCO', 19, true),
  ('00000000-0000-4000-8000-000000000020', 'https://picsum.photos/seed/hairvote-20/900/900', 'https://picsum.photos/seed/hairvote-20/450/450', 'ブルーブラック', '渡辺 涼', '光に当たると青く見える暗髪。就活・仕事でもOK。', array['カラー', '暗髪']::text[], 'COCO', 20, true),
  ('00000000-0000-4000-8000-000000000021', 'https://picsum.photos/seed/hairvote-21/900/900', 'https://picsum.photos/seed/hairvote-21/450/450', 'ワンレンロング', '小林 結衣', '段を入れない王道ロング。毛先をそろえて艶を出します。', array['ロング', 'ワンレン', '艶髪']::text[], 'PAUL', 21, true),
  ('00000000-0000-4000-8000-000000000022', 'https://picsum.photos/seed/hairvote-22/900/900', 'https://picsum.photos/seed/hairvote-22/450/450', 'くせ毛風パーマ', '田中 美咲', '無造作な動き。スタイリング剤をもみ込むだけ。', array['パーマ', '無造作']::text[], 'PAUL', 22, true),
  ('00000000-0000-4000-8000-000000000023', 'https://picsum.photos/seed/hairvote-23/900/900', 'https://picsum.photos/seed/hairvote-23/450/450', 'エッジショート', '鈴木 あかり', '刈り上げを入れたスタイリッシュなショート。', array['ショート', '刈り上げ']::text[], 'COCO', 23, true),
  ('00000000-0000-4000-8000-000000000024', 'https://picsum.photos/seed/hairvote-24/900/900', 'https://picsum.photos/seed/hairvote-24/450/450', 'ハイトーンベージュ', '高橋 優', 'ブリーチ2回のハイトーン。ケアブリーチで傷みを抑えます。', array['カラー', 'ハイトーン']::text[], 'COCO', 24, true),
  ('00000000-0000-4000-8000-000000000025', 'https://picsum.photos/seed/hairvote-25/900/900', 'https://picsum.photos/seed/hairvote-25/450/450', '姫カット', '中村 ひかる', '顔まわりだけ短く。個性が出る旬のスタイル。', array['姫カット', '個性派']::text[], 'PAUL', 25, true),
  ('00000000-0000-4000-8000-000000000026', 'https://picsum.photos/seed/hairvote-26/900/900', 'https://picsum.photos/seed/hairvote-26/450/450', 'ぱっつん前髪ボブ', '伊藤 さくら', '重めの前髪×あご下ボブ。目を大きく見せます。', array['ボブ', '前髪']::text[], 'PAUL', 26, true),
  ('00000000-0000-4000-8000-000000000027', 'https://picsum.photos/seed/hairvote-27/900/900', 'https://picsum.photos/seed/hairvote-27/450/450', '外ハネミディ', '小林 結衣', '毛先を外に流すだけ。ヘアアイロン初心者さん向け。', array['ミディアム', '外ハネ']::text[], 'COCO', 27, true),
  ('00000000-0000-4000-8000-000000000028', 'https://picsum.photos/seed/hairvote-28/900/900', 'https://picsum.photos/seed/hairvote-28/450/450', 'グラデーションカラー', '渡辺 涼', '根元は暗く、毛先を明るく。伸びても目立ちません。', array['カラー', 'グラデーション']::text[], 'COCO', 28, true),
  ('00000000-0000-4000-8000-000000000029', 'https://picsum.photos/seed/hairvote-29/900/900', 'https://picsum.photos/seed/hairvote-29/450/450', 'ツーブロックショート', '山本 直樹', 'サイドをすっきり。ビジネスでも清潔感のあるメンズショート。', array['メンズ', 'ツーブロック']::text[], 'PAUL', 29, true),
  ('00000000-0000-4000-8000-000000000030', 'https://picsum.photos/seed/hairvote-30/900/900', 'https://picsum.photos/seed/hairvote-30/450/450', 'ローポニーアレンジ', '小林 結衣', '後れ毛のバランスで大人っぽく。5分でできます。', array['アレンジ', 'まとめ髪']::text[], 'PAUL', 30, true)
on conflict (id) do nothing;
