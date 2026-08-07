# 问道修行录 · 第一阶段素材清单

当前版本已经用可缩放的水墨占位视觉把布局和交互跑通。后续只需要替换 `public/assets/characters/` 下的文件，不需要改页面结构。

## 优先生成

1. `character-hero-placeholder.png`
   - 用途：创建页欢迎屏中央竖版主视觉
   - 建议尺寸：`1024 x 1536`，PNG 或 WebP
   - 内容：一名原创成年修士，完整人物或三分之二身，人物主体位于画面中轴，底部保留约 18% 干净留白，背景为山门、雨雾和淡墨山形
2. `character-card-H-F-02.png`
   - 用途：人族女性·宗门弟子命相卡
   - 建议尺寸：`768 x 1152`，PNG 或 WebP
3. `map-cloud-ridge.png`
   - 用途：第一张地图的底图替换
   - 建议尺寸：`1600 x 1000`，PNG 或 WebP

## 后续全部素材位

这些位置都已经按“先占位、后替换”的方式设计，不会因为暂时没有图片而阻塞玩法。

- `character-card-H-M-01.png` 至 `character-card-D-X-03.png`：27 张命相卡，建议 `768 x 1152`，3 种族 × 3 性别 × 3 张，保持角色主体和材质清晰。
- `origin-village.png`、`origin-sect.png`、`origin-family.png`、`origin-rogue.png`、`origin-demon.png`：5 张出生地氛围图，建议 `1200 x 900`，用于开场剧情与命书背景。
- `map-cloud-ridge.png`：第一张区域总览底图，建议 `1600 x 1000`，不要放文字和地名，地名由页面叠加。
- `region-village.png`、`region-sect.png`、`region-ferry.png`、`region-demon.png`：4 张区域详情图，建议 `1200 x 800`，用于点击区域后的叙事插图。
- `npc-qingluo.png`、`npc-shuying.png`、`npc-bridge-keeper.png`：3 张 NPC 头像，建议 `512 x 512`，用于关系面板和对话窗口。
- `item-food.png`、`item-spirit-stone.png`、`item-herb-qinglu.png`、`item-wood-sword.png`、`item-pill.png`、`item-talisman.png`：6 张物品图标，建议 `256 x 256`，背景透明或纯色，方便后处理。
- `combat-player-aura.png`、`combat-ink-slash.png`、`combat-spell-fire.png`、`combat-spell-water.png`、`combat-hit-smoke.png`：5 张战斗特效，建议 `768 x 768`，透明背景或纯黑底后期抠图。
- `texture-rice-paper.jpg`、`texture-ink-edge.png`：2 张可平铺材质，建议 `2048 x 2048`，低对比度，避免影响文字阅读。

## 生成顺序

先生成 1 张 `character-hero-placeholder.png` 确认人物精度和水墨浓度，再生成 27 张命相卡；之后补 1 张地图底图和 3 张 NPC 头像。其余素材等第二阶段玩法页面接入时再生成，避免一次性浪费生成额度。

## 统一英文生成提示词

Use case: stylized-concept. Asset type: original Chinese cultivation game character illustration for a web and mobile character-creation screen. Create a premium original Chinese fantasy cultivation character illustration, portrait 2:3 composition, adult character, centered full-body or three-quarter figure, with clean negative space in the lower 18 percent for later interface overlays. The visual center must be a believable original cultivator with delicate facial anatomy, expressive but restrained eyes, natural hands, carefully separated layers of silk, linen and leather, embroidered hems, jade ornament, carved wood, talisman paper and subtle antique metal. Combine contemporary Chinese ink-wash atmosphere with polished modern mobile RPG illustration quality, gongbi-level facial and costume detail, loose ink diffusion around the silhouette rather than a muddy blur, mineral pigment blooms in muted celadon, warm ivory, charcoal ink and restrained cinnabar, controlled brush edges, translucent rain mist, faint hand-painted mountain ridges, distant tiled roofs, wet stone reflections, sparse drifting particles and a quiet sense of destiny. Use soft side light from a cloudy dawn, a restrained warm rim light on the figure, realistic material separation, crisp readable silhouette, elegant asymmetrical composition, premium editorial finish. The design must be entirely original and publication-safe: no copied game character, no existing game costume, no logo, no trademark, no watermark, no readable random text, no modern objects, no explicit nudity, no sexual act, no fetish framing, no malformed anatomy, no extra fingers, no duplicate limbs, no cropped face, no plastic CGI surface, no generic neon fantasy gradient.

Specific subject for the current placeholder: an adult human female outer-sect disciple, long dark hair in a high half ponytail with loose strands, white and celadon silk robe with charcoal edging and cloud-and-bamboo embroidery, narrow bronze sword in a plain scabbard, pale jade wrist charm, calm alert expression, one hand near the sword hilt and one hand holding a folded sect trial token, misty mountain sect at dawn, red maple branch and a few drifting paper talismans, original face and original costume design.

## 替换方式

生成文件后放到 `public/assets/characters/`，我会把当前 CSS 占位切换为真实图片，并继续做 iPhone 竖屏、iPad 横屏、安卓浏览器的裁切检查。角色卡 27 张可以先生成 1 张确定风格，再按同一套长提示词逐张替换。
