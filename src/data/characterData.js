export const RACES = [
  {
    id: 'human',
    name: '人族',
    mark: '人',
    short: '借凡骨，问长生',
    description: '最擅长在尘世中寻找机会。人族的起点并不耀眼，却总能把一寸机缘走成一条路。',
    tone: 'ink',
    origins: ['village', 'sect', 'family', 'rogue']
  },
  {
    id: 'immortal',
    name: '仙族',
    mark: '仙',
    short: '乘清气，观万象',
    description: '天生亲近灵炁，拥有更清澈的感知，也背负着血脉与天门的目光。',
    tone: 'jade',
    origins: ['village', 'sect', 'family', 'rogue']
  },
  {
    id: 'demon',
    name: '妖族',
    mark: '妖',
    short: '守血脉，炼真形',
    description: '山野与月色养出的灵族。力量来自血脉，也来自不肯被世间定义的野心。',
    tone: 'cinnabar',
    origins: ['rogue', 'demon']
  }
]

export const GENDERS = [
  { id: 'male', name: '男', description: '锋意入骨，气息沉稳' },
  { id: 'female', name: '女', description: '灵秀照影，心有清辉' },
  { id: 'androgynous', name: '双性', description: '阴阳相济，自成一脉' }
]

export const ORIGINS = [
  {
    id: 'village',
    name: '凡人村落',
    place: '青石村',
    eyebrow: '一场雨，把旧玉送到你手里',
    description: '你从未见过仙门。直到祖屋漏雨的那夜，一枚温热的旧玉在墙缝中醒来。',
    keywords: ['雨夜', '祖屋', '旧玉'],
    level: 1,
    realm: '无修为',
    cultivation: 0,
    spiritStones: 18,
    spirit: 0,
    stats: { attack: 8, health: 88, defense: 4, speed: 9 },
    resourceText: '没有积蓄，只有一盏旧灯和第一次听见灵炁的机会。',
    opening: '雨声打在瓦上，像有人在很远的地方叩门。你握住那枚旧玉时，村外的山忽然亮了一瞬。'
  },
  {
    id: 'sect',
    name: '宗门弟子',
    place: '云岑宗外门',
    eyebrow: '晨钟未尽，试剑台上已有风声',
    description: '你在云岑宗外门修行多年，根基尚浅，却已学会在众人的目光里藏住自己的锋芒。',
    keywords: ['晨钟', '试剑台', '同门'],
    level: 2,
    realm: '练气一重',
    cultivation: 22,
    spiritStones: 80,
    spirit: 60,
    stats: { attack: 13, health: 108, defense: 7, speed: 12 },
    resourceText: '一册基础功法、一柄制式木剑，以及一枚尚未兑现的同门人情。',
    opening: '云岑宗的晨钟响了三遍。你在试剑台拾起一枚染血的竹签，签上只写着：今夜，后山见。'
  },
  {
    id: 'family',
    name: '修仙世家',
    place: '沈氏山庄',
    eyebrow: '族谱尽头，写着一个没有名字的孩子',
    description: '灵脉、族谱和婚约共同塑造了你的童年。越是被安排的人生，越想亲自走一遍。',
    keywords: ['族谱', '灵脉', '家印'],
    level: 3,
    realm: '练气二重',
    cultivation: 35,
    spiritStones: 260,
    spirit: 110,
    stats: { attack: 16, health: 122, defense: 9, speed: 11 },
    resourceText: '一枚家印、三瓶养气散和一笔日后必须偿还的家族资源。',
    opening: '家宴散尽后，祖父将一枚从未在族谱出现过的家印放在你掌心。山庄外，有人吹响了旧笛。'
  },
  {
    id: 'rogue',
    name: '散修孤儿',
    place: '听潮溪旧渡',
    eyebrow: '没有师门的人，最早学会看风向',
    description: '你在渡口长大，靠替人送信、寻药和识别真假灵石活下来。自由从来都不便宜。',
    keywords: ['破伞', '旧剑', '潮声'],
    level: 2,
    realm: '练气一重',
    cultivation: 12,
    spiritStones: 54,
    spirit: 48,
    stats: { attack: 12, health: 98, defense: 5, speed: 15 },
    resourceText: '一柄缺口旧剑、一枚空白路引和比旁人更灵的求生直觉。',
    opening: '潮水退去，旧渡下露出一截剑柄。你拔剑时，水面倒映出的却不是自己的脸。'
  },
  {
    id: 'demon',
    name: '妖族化形',
    place: '万妖岭外缘',
    eyebrow: '月下第一次用人的声音说出自己的名字',
    description: '你刚刚学会把兽形藏进人身。万妖岭的月色很亮，亮到能照见追兵，也照见前路。',
    keywords: ['月下', '兽纹', '追兵'],
    level: 3,
    realm: '练气二重',
    cultivation: 40,
    spiritStones: 72,
    spirit: 90,
    stats: { attack: 18, health: 130, defense: 8, speed: 16 },
    resourceText: '一枚尚未稳定的妖丹、一缕血脉秘火和人族城镇的戒备。',
    opening: '月光落在你的肩头，耳尖终于不再显形。远处传来号角，山林中的同族同时抬起了头。'
  }
]

const CARD_BRIEFS = {
  'H-M-01': 'adult human male from a stone village, sun-warmed skin, short black hair, plain indigo linen tunic, weathered wooden sword, open honest gaze, grounded village youth silhouette',
  'H-M-02': 'adult human male heir of a cultivation family, long black hair half tied with a jade crown, dark ink and antique-gold robe, carved jade pendant, refined but guarded expression',
  'H-M-03': 'adult human male wandering cultivator, ash-blue layered robe, worn bamboo hat hanging at his back, old narrow sword, gentle tired eyes and a quiet resilient posture',
  'H-F-01': 'adult human female from a riverside village, warm almond eyes, long chestnut braid, apricot linen dress layered with pale green shawl, bamboo basket and small flute, natural lively pose',
  'H-F-02': 'adult human female outer-sect disciple, long dark hair in a high half ponytail, white and celadon robe, slim bronze sword, sharp bright eyes, quick confident stance',
  'H-F-03': 'adult human female young lady of a cultivation family, moon-white cloak, black hair pinned with gold and jade ornaments, elegant ceremonial sword, dignified observant expression',
  'H-X-01': 'adult human androgynous cultivator with short dark hair, deep teal robe, warm paper lantern held near the chest, tranquil features, balanced soft and angular silhouette',
  'H-X-02': 'adult human androgynous scholar-cultivator, black hair loosely half tied, smoky violet long coat, folding fan with ink landscape, composed literary expression with hidden danger',
  'H-X-03': 'adult human androgynous wandering talismanist, shoulder-length hair, smoke-grey cloak, old paper charms and a bamboo tube, serene face, mysterious contemplative posture',
  'I-M-01': 'adult immortal male with silver-white hair, sky-blue immortal robe, pale jade ring, cool luminous eyes, elegant upright posture, faint cloud aura and clean celestial silhouette',
  'I-M-02': 'adult immortal male guardian, white-gold crown and layered cloud-pattern armor, luminous feather-like light behind the shoulders, proud calm expression, ceremonial straight sword',
  'I-M-03': 'adult immortal male gentle traveler, pale lilac robe with flowing translucent sleeves, floating sword at the side, warm smile, relaxed posture surrounded by drifting light',
  'I-F-01': 'adult immortal female with platinum hair, water-blue silk robe, lotus lantern, translucent flowing sleeves, clear sacred expression, soft luminous aura and graceful hands',
  'I-F-02': 'adult immortal female in celadon jade-green attire, jade flute, long cloud scarf, bright intelligent eyes, nimble poised stance, subtle silver embroidery',
  'I-F-03': 'adult immortal female star-temple priestess, deep indigo ceremonial dress, small star crown and crescent ornament, quiet cold elegance, moonlit celestial background',
  'I-X-01': 'adult immortal androgynous figure with silver-grey medium hair, black and white layered robe, no gendered crown, empty floating lantern, balanced solemn and gentle expression',
  'I-X-02': 'adult immortal androgynous archivist with muted gold short hair, water-ink long robe, floating scrolls, rational refined expression, precise relaxed posture',
  'I-X-03': 'adult immortal androgynous dream-walker with blue-black long hair, translucent shoulder silk, crystal star talisman, distant dreamlike gaze, elegant weightless pose',
  'D-M-01': 'adult demon male with black wolf ears and amber eyes, dark charcoal battle robe, wild short hair, narrow iron blade, alert predatory stance, restrained original beast traits',
  'D-M-02': 'adult demon male with silver fox ears, vermilion inner robe and ash-grey outer coat, bone flute, dangerous beautiful expression, windswept hair and agile silhouette',
  'D-M-03': 'adult demon male with teal hair and small deer antlers, moss-green robe, wood spirit talisman, gentle quiet face, ancient forest aura and patient posture',
  'D-F-01': 'adult demon female with black fox ears, crimson hair ribbon and cinnabar bamboo flute, light armor with a long skirt, radiant clever eyes, playful but capable stance',
  'D-F-02': 'adult demon female with silver-blue cat ears, blue-grey combat robe, small bronze bells, cool reserved expression, compact agile silhouette and moonlit rim light',
  'D-F-03': 'adult demon female with white hair and delicate snake scale motifs, deep violet robe, gold pupil detail, mysterious noble gaze, elegant coils of ink mist',
  'D-X-01': 'adult demon androgynous figure with black-silver long hair, deer antlers and feather ornaments, dark ink robe, still mysterious expression, balanced human and beast symbolism',
  'D-X-02': 'adult demon androgynous wanderer with red-black short hair, fox tail and gold ring, deep crimson battle coat, open confident smile, bold graceful stance',
  'D-X-03': 'adult demon androgynous dreamer with blue-white long hair, water-pattern jade ornaments, pale robe, distant clear expression, soft moonlit forest and quiet dream aura'
}

const RACE_BY_ID = Object.fromEntries(RACES.map(race => [race.id, race]))
const GENDER_BY_ID = Object.fromEntries(GENDERS.map(gender => [gender.id, gender]))

const CARD_PRESENTATION = {
  'H-M-01': ['青石少年', '凡骨入世，先学会握稳手里的旧剑'],
  'H-M-02': ['沈氏少主', '家印在身，族谱之外另有一条路'],
  'H-M-03': ['倦旅散修', '带着旧剑和未说完的故事继续远行'],
  'H-F-01': ['雨巷药师', '在河岸灯火里守住一篮草药'],
  'H-F-02': ['云岑外门', '试剑台上的风，先替你记住锋芒'],
  'H-F-03': ['月白世家女', '家门礼法之外，仍要亲自问一次长生'],
  'H-X-01': ['提灯问路', '一盏纸灯照见阴阳之间的窄路'],
  'H-X-02': ['墨扇藏锋', '字里有山河，扇后也藏着一线杀机'],
  'H-X-03': ['行符客', '袖中符纸未干，脚下的路已经先动了'],
  'I-M-01': ['云上仙门', '银发清气，像从天门外回望人间'],
  'I-M-02': ['天阙守卫', '执剑守云关，也守住自己的来处'],
  'I-M-03': ['浮光旅人', '温和的笑意下，藏着不肯停下的剑'],
  'I-F-01': ['莲灯仙子', '一盏莲灯照水，也照见灵脉初醒'],
  'I-F-02': ['青玉笛音', '笛声穿过云岑，唤来一缕清明灵炁'],
  'I-F-03': ['星坛司命', '月冠之下，正在聆听群星落子的声音'],
  'I-X-01': ['寒灯问道', '黑白长袍与空灯相伴，静看人间风雪'],
  'I-X-02': ['云简藏书人', '卷册浮空，旧日答案尚未写到最后一页'],
  'I-X-03': ['梦行月海', '从梦里醒来时，手中仍握着星纹玉符'],
  'D-M-01': ['黑狼化形', '把兽性藏进人身，先学会在人间行走'],
  'D-M-02': ['银狐骨笛', '笛声很轻，月下的杀意却从不迟到'],
  'D-M-03': ['青鹿守林', '木灵符在掌心发芽，旧林记得你的名字'],
  'D-F-01': ['绯尾灵狐', '铃声一响，山林里便多了一道红色的风'],
  'D-F-02': ['月铃灵猫', '冷静看过每一条退路，再决定是否出爪'],
  'D-F-03': ['紫鳞蛇裔', '金色瞳孔里，照见血脉尚未揭开的真形'],
  'D-X-01': ['鹿角玄行者', '人身与妖相之间，选择属于自己的平衡'],
  'D-X-02': ['赤衣游妖', '笑着走过旧路，也笑着面对追兵'],
  'D-X-03': ['月白妖梦', '梦里有森林，醒来后仍听见水声']
}

const basePrompt = `Create an original premium Chinese fantasy cultivation character card illustration for a fictional web and mobile game, portrait 2:3 composition, adult character, full body or three-quarter body centered as the clear visual focus. Combine contemporary Chinese ink-wash atmosphere with polished modern mobile RPG illustration quality, gongbi-level facial anatomy, expressive eyes, believable hands, layered silk and linen fabric construction, embroidered hems, jade, lacquer, carved wood, talisman paper, subtle metal ornaments, readable silhouette, restrained mineral pigments, charcoal ink shadows, controlled brush edges, translucent mist, delicate ink diffusion around the subject, distant mountains and painted cloud layers, faint calligraphy brush texture without readable text, soft rim light, cinematic depth, quiet negative space near the lower third for later interface overlay. Original design only, no copied game character, no real brand, no logo, no watermark, no random text, no modern objects, no explicit nudity, no sexual act, no fetish framing, no malformed anatomy, no extra fingers, no cropped face, no plastic CGI, no generic blue gradient.`

const cardDefinitions = Object.entries(CARD_BRIEFS).map(([id, visualBrief]) => {
  const raceId = id.startsWith('H') ? 'human' : id.startsWith('I') ? 'immortal' : 'demon'
  const genderId = id.endsWith('-M-01') || id.includes('-M-') ? 'male' : id.includes('-F-') ? 'female' : 'androgynous'
  const accent = RACE_BY_ID[raceId].tone
  return {
    id,
    raceId,
    genderId,
    accent,
    visualBrief,
    displayName: CARD_PRESENTATION[id]?.[0] || id,
    shortDescription: CARD_PRESENTATION[id]?.[1] || '一张等待你亲自写下命运的原创命相。',
    prompt: `${basePrompt}\nSpecific character brief: ${visualBrief}. Use a cohesive original costume, facial identity, prop and silhouette; preserve clean composition and Chinese ink diffusion.`,
    label: `${RACE_BY_ID[raceId].name} · ${GENDER_BY_ID[genderId].name}`
  }
})

export const CHARACTER_CARDS = cardDefinitions
export const CHARACTER_BASE_PROMPT = basePrompt

export const BODY_OPTIONS = [
  { id: 'clear-bone', name: '清骨', description: '线条清峻，步履轻盈', mark: '骨' },
  { id: 'soft-jade', name: '玉润', description: '气息柔和，灵韵内收', mark: '玉' },
  { id: 'strong-vein', name: '劲脉', description: '筋骨坚韧，气血旺盛', mark: '脉' }
]

export const APPEARANCE_OPTIONS = [
  { id: 'pale-ink', name: '冷墨', description: '眉眼清淡，神色疏朗' },
  { id: 'warm-clay', name: '暖砂', description: '肤色温润，笑意明亮' },
  { id: 'moon-white', name: '月白', description: '肤色如玉，气质清冷' }
]

export const HAIR_OPTIONS = [
  { id: 'half-tied', name: '半束长发' },
  { id: 'high-tie', name: '高束长发' },
  { id: 'short-and-clean', name: '利落短发' }
]

export const findRace = id => RACE_BY_ID[id] || RACES[0]
export const findGender = id => GENDER_BY_ID[id] || GENDERS[0]
export const findOrigin = id => ORIGINS.find(origin => origin.id === id) || ORIGINS[0]
