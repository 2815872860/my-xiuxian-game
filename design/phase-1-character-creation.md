# 问道修行录 · 第一阶段设计稿

## 目标

第一阶段只做一件事：让玩家完成一次有代入感的“命书初开”。玩家从种族、性别、姓名、出生和外貌开始，看到初始命格、境界、灵根、功法品质与开场剧情，最后进入第一张地图。

这不是后台表单，也不是简单的新手注册页。它应当像一张可翻开的角色命书：角色立绘是第一视觉中心，选项像命格签页，点击时有轻微的纸张、墨迹和光影反馈。

## 固定规则

- 游戏名称：问道修行录
- 平台：响应式网页；优先适配 iPhone 竖屏、iPad 横竖屏、安卓手机与桌面浏览器
- 账号：游客体验，完成角色后可绑定手机号；第一阶段允许先用本地存档
- 种族：人族、仙族、妖族
- 性别：男、女、双性
- 出生：凡人村落、宗门弟子、修仙世家、散修孤儿、妖族化形
- 境界、灵根、功法品质、死亡规则、资源规则为世界固定规则
- 不同种族与出生大部分可以自由组合；特殊出生保留少量限制
- 游戏内文字统一使用中文；素材生成提示词统一使用英文
- 角色可为成年人，允许成熟、露肤和性感服装，但不制作露骨性行为、性器官或色情构图

## 创建流程

```text
欢迎页
  -> 种族选择
  -> 性别选择
  -> 姓名输入
  -> 出生选择
  -> 外貌方式：预设角色卡 / 自由描述
  -> 身体构造确认
  -> 初始命格预览
  -> 确认命书
  -> 出生剧情
  -> 第一张地图
```

### 页面状态

1. `welcome`：短水墨开场，不显示复杂功能。
2. `race`：三张大卡，人、仙、妖各有不同的墨色气息与动态背景。
3. `gender`：男、女、双性三个中性且精致的角色轮廓，不使用夸张性别符号。
4. `name`：输入姓名，实时显示在命书标题上。
5. `origin`：五个出生卡，显示出身故事、初始境界、资源和第一段剧情关键词。
6. `appearance`：左右滑动浏览角色卡，或输入英文/中文外貌描述交给生成服务；第一阶段先保证预设卡体验完整。
7. `body`：选择体态、肤色、发型、服饰层次、装饰与气质，所有选项只影响外观和人物描述，不修改基础数值。
8. `fate`：命书预览，集中显示种族、性别、出生、境界、灵根、功法品质、初始资源和第一章标题。
9. `opening`：根据出生播放不同的文字叙事与水墨扩散动画。

## 五种出生

### 凡人村落

- 默认适合：人族，也可允许仙族选择隐藏身份
- 初始境界：无修为
- 起点：青石村
- 核心体验：没有资源、没有功法，从第一次测灵根开始
- 开场关键词：雨夜、祖屋、旧玉、远方山门

### 宗门弟子

- 默认适合：人族、仙族；妖族可在特殊条件下选择
- 初始境界：炼气一层
- 起点：云岫宗外门
- 核心体验：有基础功法，但背负师门任务和同门关系
- 开场关键词：晨钟、试剑坪、师兄、外门名册

### 修仙世家

- 默认适合：人族、仙族
- 初始境界：炼气二层
- 起点：沈氏山庄
- 核心体验：资源较多，但家族关系、婚约与继承压力更重
- 开场关键词：族谱、祖祠、灵脉、家族印记

### 散修孤儿

- 默认适合：三族
- 初始境界：炼气一层
- 起点：听潮溪旧渡
- 核心体验：自由度最高，但食物、灵石和药材更紧张
- 开场关键词：破伞、旧剑、渡口、无名师父

### 妖族化形

- 默认适合：妖族；其他种族不可选
- 初始境界：炼气二层
- 起点：万妖岭外缘
- 核心体验：拥有血脉天赋，但会受到人族城镇和部分宗门的警惕
- 开场关键词：月下化形、兽纹、追兵、第一张人脸

## 27 张角色卡

第一阶段共 27 张：3 个种族 × 3 个性别 × 3 张卡。每张卡都要有独立的 silhouette、脸部特征、发型、服饰、法器和主色，不允许只换肤色或换发色。

| 编号 | 种族 | 性别 | 视觉方向 |
|---|---|---|---|
| H-M-01 | 人族 | 男 | 青石村少年，素色短袍，旧木剑，清爽坚韧 |
| H-M-02 | 人族 | 男 | 世家公子，黑金窄袖，玉佩，克制锋利 |
| H-M-03 | 人族 | 男 | 游历散修，灰蓝斗篷，旧伞，疲惫但温柔 |
| H-F-01 | 人族 | 女 | 村中少女，浅杏衣裙，竹簪，清澈自然 |
| H-F-02 | 人族 | 女 | 外门弟子，青白长衫，剑穗，明快利落 |
| H-F-03 | 人族 | 女 | 世家小姐，月白披帛，金玉发饰，端庄明艳 |
| H-X-01 | 人族 | 双性 | 中性短发，深青衣，纸灯，安静疏离 |
| H-X-02 | 人族 | 双性 | 黑发半束，灰紫长衣，折扇，文雅危险 |
| H-X-03 | 人族 | 双性 | 长发披肩，烟墨斗篷，旧符，柔和神秘 |
| I-M-01 | 仙族 | 男 | 银白长发，天青仙衣，玉环，清冷高远 |
| I-M-02 | 仙族 | 男 | 金白冠服，云纹护肩，光羽，尊贵克制 |
| I-M-03 | 仙族 | 男 | 淡紫长袍，悬剑，流光袖，温柔疏朗 |
| I-F-01 | 仙族 | 女 | 白金长发，水色纱衣，莲灯，清透圣洁 |
| I-F-02 | 仙族 | 女 | 青绿仙裙，玉笛，流云披帛，灵动明亮 |
| I-F-03 | 仙族 | 女 | 深蓝礼服，星冠，月轮，冷艳庄重 |
| I-X-01 | 仙族 | 双性 | 银灰中长发，黑白仙袍，无性别冠饰，空灵 |
| I-X-02 | 仙族 | 双性 | 淡金短发，水墨长衣，悬浮书卷，理性优雅 |
| I-X-03 | 仙族 | 双性 | 青蓝长发，透明肩纱，碎星法器，梦幻疏离 |
| D-M-01 | 妖族 | 男 | 黑发狼耳，赤金眼，玄黑战衣，野性锋利 |
| D-M-02 | 妖族 | 男 | 银发狐耳，绛红外袍，骨笛，危险漂亮 |
| D-M-03 | 妖族 | 男 | 青发鹿角，墨绿长衫，木灵纹，安静温和 |
| D-F-01 | 妖族 | 女 | 黑发狐耳，朱红发簪，轻甲与长袖，明艳灵动 |
| D-F-02 | 妖族 | 女 | 银蓝猫耳，青灰斗篷，铃铛，冷淡可爱 |
| D-F-03 | 妖族 | 女 | 白发蛇纹，深紫衣，金色瞳孔，神秘高贵 |
| D-X-01 | 妖族 | 双性 | 黑银长发，鹿角与羽饰，中性墨衣，沉静神秘 |
| D-X-02 | 妖族 | 双性 | 赤黑短发，狐尾与金环，深红战装，张扬漂亮 |
| D-X-03 | 妖族 | 双性 | 青白长发，水纹鳞饰，浅色长衣，清冷梦幻 |

## 统一英文素材提示词基准

以下基准词用于所有角色卡，再叠加每张卡的独立角色描述。提示词不使用任何现成游戏、角色、品牌、皮肤或艺术家的名字。

```text
Create a premium original Chinese fantasy cultivation character card illustration for a fictional mobile and web game. The character is an adult human, immortal, or demon cultivator, designed as the clear visual centerpiece of a vertical portrait composition. Use an elegant contemporary Chinese ink-wash fantasy aesthetic combined with highly polished modern mobile RPG character illustration quality. Preserve delicate facial anatomy, expressive eyes, refined hands, believable fabric construction, layered silk, embroidered hems, subtle metallic ornaments, jade, lacquer, carved wood, talisman paper, weapon details, and carefully separated material textures. Integrate flowing ink diffusion around the silhouette, soft mineral-pigment color blooms, controlled brush edges, transparent mist, restrained gold accents, deep charcoal shadows, and luminous atmospheric rim light. The background should feel like a painted cultivation world rather than a generic fantasy gradient: distant mountains, drifting cloud layers, faint calligraphy strokes, water reflections, sparse particles, and a quiet sense of destiny. The composition must leave clean negative space near the lower third for Chinese character name and origin text in the user interface. Full body or three-quarter body depending on the character brief, strong readable silhouette, centered pose, graceful gesture, emotionally appealing expression, no modern objects, no logos, no watermark, no random text, no copied character design, no explicit nudity, no sexual act, no fetish framing, no distorted anatomy, no extra fingers, no malformed eyes, no cropped face, no low-detail background.
```

## UI 方向

- 移动端优先：角色卡上下滑动，底部固定“下一步”区域
- 桌面端：左侧步骤索引，中间大立绘，右侧命格信息
- iPhone：竖屏单列，立绘占首屏 55%—65%
- iPad：横屏三栏，立绘与命格并列
- 不使用商务后台式表格、密集统计、蓝色管理按钮
- 主要按钮使用“确认命格 / 继续 / 回看”这类游戏化文字
- 动效：墨迹展开、卡片纸张翻页、角色卡呼吸、选择后的金色灵光、剧情切换时的水墨遮罩
- 所有触摸区域最小 44px，避免 iOS Safari 误触

## 第一阶段验收标准

- 可以完整完成一遍角色创建流程
- 27 张卡都有稳定编号和独立描述
- 三种族、三性别、五种出生可正确组合和限制
- 出生变化会影响初始境界、初始资源和开场文本
- 外貌输入会被保存到角色档案
- 游客刷新页面后不会丢失未完成创建进度
- 角色确认后可以进入对应的出生剧情
- iPhone 竖屏不出现横向溢出
- iPad 横屏能同时看到立绘和命格信息
- 所有视觉素材使用英文长提示词生成，并保留提示词记录
