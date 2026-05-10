// ── 核心生成引擎 ──

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN(arr, n) { return shuffle(arr).slice(0, n); }

// ── 人名生成 ──
function genName(gender, world) {
  let pool;
  if (['古代','架空历史'].includes(world)) pool = NAMES['ancient'];
  else if (['未来','异世界'].includes(world)) pool = NAMES['fantasy'];
  else pool = NAMES['modern'];

  const g = gender || pick(['male','female']);
  const given = pick(pool[g].given);
  const surname = pick(pool[g].surname);
  return surname + given;
}

// ── 过滤 rating ──
function filterByRating(items, rating) {
  if (rating === '成人向') return items;
  if (rating === '青少年') return items.filter(i => i.rating !== 'adult');
  return items.filter(i => i.rating === 'all');
}

// ── 获取情节模板 ──
function getPlotTemplates(genre, section) {
  const all = PLOTS[section];
  const exact = all.filter(p => p.type === genre);
  const generic = all.filter(p => p.type === '*');
  // Prefer genre-specific, fall back to generic
  const pool = exact.length >= 2 ? exact : [...exact, ...generic];
  return pool;
}

// ── 主生成函数 ──
function generateStory(config) {
  const {
    genre = '修仙',
    tone = '热血',
    pov = '第三人称',
    hero = '废柴逆袭',
    length = 2000,
    world = '古代',
    rating = '全年龄',
    romance = '无'
  } = config;

  // ── 确定主角 ──
  const heroGender = pick(['male','female']);
  const heroName = genName(heroGender, world);
  const hero2Name = romance !== '无' ? genName(heroGender === 'male' ? 'female' : 'male', world) : '';
  const mentorName = genName(pick(['male','female']), world);
  const villainName = genName(pick(['male','female']), world);

  // ── 选择开头 ──
  const openingsPool = filterByRating(OPENINGS[genre] || OPENINGS['修仙'], rating);
  const opening = pick(openingsPool);

  // ── 构建段落 ──
  const paragraphs = [];

  // 段落 1: 开头 (引入主角与世界)
  let p1 = opening.t
    .replace(/\{name\}/g, heroName)
    .replace(/\{place\}/g, pick(['山门前','大殿里','竹林深处','小镇上','城市中']));
  paragraphs.push(p1);

  // 段落 2: 展开主角背景与处境
  paragraphs.push(buildHeroBackground(hero, heroName, genre, world, rating));

  // 段落 3: 冲突引入
  const conflictPool = getPlotTemplates(genre, 'conflict');
  let p3 = pick(conflictPool).t
    .replace(/\{name\}/g, heroName)
    .replace(/\{name1\}/g, heroName)
    .replace(/\{name2\}/g, hero2Name || mentorName);
  paragraphs.push(p3);

  // 段落 4: 深化冲突 / 中间发展
  paragraphs.push(buildMiddleSection(heroName, hero2Name || mentorName, villainName, genre, world, tone, rating, romance));

  // 段落 5: 转折
  const twistPool = getPlotTemplates(genre, 'twist');
  let p5 = pick(twistPool).t
    .replace(/\{name\}/g, heroName)
    .replace(/\{name1\}/g, heroName)
    .replace(/\{name2\}/g, hero2Name || villainName);
  paragraphs.push(p5);

  // 段落 6: 高潮 (根据字数决定是否详细描写)
  const climaxPool = getPlotTemplates(genre, 'climax');
  let p6 = pick(climaxPool).t
    .replace(/\{name\}/g, heroName)
    .replace(/\{name1\}/g, heroName)
    .replace(/\{name2\}/g, hero2Name || villainName);
  paragraphs.push(p6);

  // 段落 7: 如果有感情线，插入感情线场景
  if (romance !== '无') {
    paragraphs.push(buildRomanceSection(heroName, hero2Name, romance, tone, rating));
  }

  // 段落 8: 结局
  const endingPool = ENDINGS[tone] || ENDINGS['热血'];
  let ending = pick(endingPool)
    .replace(/\{name\}/g, heroName)
    .replace(/\{name1\}/g, heroName)
    .replace(/\{name2\}/g, hero2Name);
  paragraphs.push(ending);

  // ── 插入场景描写和对话增强 ──
  const enriched = [];
  for (let i = 0; i < paragraphs.length; i++) {
    enriched.push(paragraphs[i]);

    // 在段落之间随机插入场景或对话
    if (i < paragraphs.length - 1 && Math.random() < 0.5) {
      if (Math.random() < 0.5) {
        enriched.push(generateScene(world, tone, heroName, hero2Name, rating));
      } else {
        enriched.push(generateDialogue(tone, heroName, hero2Name, romance, rating));
      }
    }
  }

  // ── 根据字数调整 ──
  const fullText = enriched.join('\n\n');
  const charCount = fullText.length;
  const targetChars = length * 2; // 中文每字约2字符，实际按字符数估算

  if (charCount < targetChars * 0.7 && romance !== '无') {
    // 补充感情线描写
    enriched.splice(enriched.length - 2, 0, buildRomanceSection(heroName, hero2Name, romance, tone, rating));
    enriched.splice(enriched.length - 3, 0, generateScene(world, tone, heroName, hero2Name, rating));
  }

  const finalText = enriched.join('\n\n');

  // ── 生成标题 ──
  const title = generateTitle(genre, tone, hero, world);

  // ── 组装结果 ──
  return {
    title,
    body: formatParagraphs(finalText, pov, heroName, hero2Name, genre),
    config,
    charCount: finalText.length
  };
}

// ── 主角背景 ──
function buildHeroBackground(hero, name, genre, world, rating) {
  const backgrounds = {
    '废柴逆袭': [
      '{name}不是天才。从一开始就不是。别人花一天学会的功法他要练一年，别人抬手就能引来的灵气他要吞纳千次才能在丹田里攒下头发丝细的一缕。但他有一个别人没有的东西——一种看不见摸不着却真实存在的、在每一次被嘲笑之后都会变得更坚韧的东西。',
      '{name}从小就知道自己跟别人不一样。不是因为天赋异禀——恰恰相反，他/她是在一堆天才之中被淘汰下来的那一个。但{name}从来不信命。不是不信命运存在，而是不信命运能赢过自己。'
    ],
    '天才骄子': [
      '{name}是所有人眼中的天之骄子/女。三岁引气入体，七岁筑基，十二岁便已是内门首席。师长寄予厚望，同门敬畏有加。但只有{name}自己知道，在那层光鲜亮丽的外壳下面藏着一个秘密——一个一旦暴露就足以毁掉他/她所有荣誉的秘密。',
      '天才的孤独是外人看不见的。{name}站在所有人仰望的高处，能看见的只有无尽的云海和云海之下那些看不清面孔的仰望者。高处没有同伴，只有风和寒冷。'
    ],
    '平凡人': [
      '{name}就是一个普通人。没有显赫的家世，没有逆天的天赋，没有什么命中注定的奇遇。他/她之所以会被卷进这一切，最初只是因为在人群中多做了一件在别人看来毫不起眼的小事。而就是这件小事，引发了此后的一切连锁反应。',
    ],
    '重生者': [
      '{name}记得自己上一次是怎么死的。死在一个无名的角落，悄无声息，像一枚被风吹灭的烛火。但当他/她再次睁开眼的时候，发现自己回到了二十年前。重新拥有了过去的身体，却没有完全失去未来的记忆。这一次——他/她不打算再输了。',
    ],
    '反派': [
      '在所有人的故事里，{name}都是那个反派。手段狠辣，为达目的不择手段，连笑起来都让人觉得带着三分寒意。但从来没有人问过一句——这个人为什么会变成现在这个样子。如果那些人所经历过的事情有{name}经历过的十分之一，他们早就崩溃了。但他们不会经历，所以他们没有资格评价。',
    ],
    '双主角': [
      '{name}和{name2}是两条方向完全相反却最终交汇在一起的线。一个是光，一个是影。一个人从零开始往上爬，另一个人从高处跌落谷底。两个人的命运在某个点上碰撞在了一起，然后彻底改变了彼此。',
    ]
  };

  const pool = backgrounds[hero] || backgrounds['废柴逆袭'];
  let text = pick(pool).replace(/\{name\}/g, name).replace(/\{name2\}/g, '');
  if (hero === '双主角') {
    text = text.replace(/\{name2\}/g, '');
  }
  return text;
}

// ── 中间发展段 ──
function buildMiddleSection(name, name2, villain, genre, world, tone, rating, romance) {
  const scenes = SCENES['action']['all'];
  const envPool = SCENES['environment'];

  let env;
  if (['古代','架空历史'].includes(world)) env = pick(envPool['古代']);
  else if (world === '现代') env = pick(envPool['现代']);
  else if (world === '未来') env = pick(envPool['未来']);
  else if (world === '异世界') env = pick(envPool['异世界']);
  else if (world === '末世') env = pick(envPool['末世'] || envPool['现代']);
  else env = pick(envPool['古代'] || envPool['现代']);

  const scene = pick(scenes);

  let section = env + '\n\n' + scene.replace(/\{name\}/g, name).replace(/\{name2\}/g, name2);

  if (rating === '成人向' && Math.random() < 0.3) {
    const adultScenes = SCENES['action']['adult'] || [];
    if (adultScenes.length > 0) {
      section += '\n\n' + pick(adultScenes).replace(/\{name\}/g, name).replace(/\{name2\}/g, name2);
    }
  }

  return section;
}

// ── 感情线 ──
function buildRomanceSection(name1, name2, romance, tone, rating) {
  const pool = SCENES['romance'][romance] || SCENES['romance']['纯爱'];
  let scene = pick(pool)
    .replace(/\{name1\}/g, name1)
    .replace(/\{name2\}/g, name2)
    .replace(/\{name\}/g, name1);

  // 高 rating 追加香艳描写
  if (rating === '成人向' && Math.random() < 0.5) {
    const spicy = pick(DIALOGUES['香艳'] || []);
    if (spicy) {
      scene += '\n\n' + spicy
        .replace(/\{name1\}/g, name1)
        .replace(/\{name2\}/g, name2)
        .replace(/\{name\}/g, name1);
    }
  }

  return scene;
}

// ── 场景生成 ──
function generateScene(world, tone, name, name2, rating) {
  let envPool;
  if (['古代','架空历史'].includes(world)) envPool = SCENES['environment']['古代'];
  else if (world === '现代') envPool = SCENES['environment']['现代'];
  else if (world === '未来') envPool = SCENES['environment']['未来'];
  else if (world === '异世界') envPool = SCENES['environment']['异世界'];
  else if (world === '末世') envPool = SCENES['environment']['末世'];
  else envPool = SCENES['environment']['古代'];

  const env = pick(envPool);

  // 偶尔加心理描写
  const psychPool = SCENES['psychology'][tone];
  if (psychPool && Math.random() < 0.4) {
    const psych = pick(psychPool).replace(/\{name\}/g, name).replace(/\{name2\}/g, name2);
    return env + '\n\n' + psych;
  }

  return env;
}

// ── 对话生成 ──
function generateDialogue(tone, name, name2, romance, rating) {
  const pool = DIALOGUES[tone] || DIALOGUES['热血'];
  let d = pick(pool);

  // 高 rating 偶尔用香艳对话
  if (rating === '成人向' && Math.random() < 0.3) {
    const spicyPool = DIALOGUES['香艳'];
    if (spicyPool && spicyPool.length > 0) {
      d = pick(spicyPool);
    }
  }

  return d.replace(/\{name\}/g, name).replace(/\{name1\}/g, name).replace(/\{name2\}/g, name2);
}

// ── 标题生成 ──
function generateTitle(genre, tone, hero, world) {
  const prefixes = {
    '修仙': ['凡骨','踏天','问道','斩仙','九霄','青云','长生','剑来','炼天','封神'],
    '武侠': ['江湖','刀光','恩仇','长风','残剑','烟雨','逐鹿','血衣','天涯','断刀'],
    '科幻': ['暗物质','奇点','深渊','星辰','维度','重启','回声','镜像','边界','湮灭'],
    '都市': ['暗涌','风向','深渊','浮沉','迷局','夜色','归途','间奏','逆光','灰域'],
    '悬疑': ['第七夜','暗窗','无声','亡语','局中','默示录','尽头','暗格','歧路','噬痕'],
    '奇幻': ['龙骸','魔境','织梦','暗潮','星落','纪元','亡途','边界','吟游','秘典'],
    '言情': ['晚风','如故','相望','余温','暗恋','重逢','半生','归期','缄默','念念'],
    '校园': ['夏日','天台','十七岁','蝉鸣','走廊','操场','课桌','雨季','单车','晚自习'],
    '职场': ['暗流','转折','棋局','变数','逆风','藩篱','据点','阶梯','俯瞰','闭环'],
    '末日': ['废土','余烬','残阳','焦土','绝境','破晓','荒原','窒息','废墟','独行']
  };

  const suffixes = {
    '热血': ['','之歌','之路','之章','——'],
    '黑暗': ['','暗面','深渊','陨落','祭'],
    '温馨': ['','如初','如故','归处','灯火'],
    '严肃': ['','无题','纪事','手记',''],
    '香艳': ['','缠绕','暗香','贪欢','夜话'],
    '虐心': ['','不渡','无期','离人','遗梦'],
    '冷峻': ['','法则','铁则','天秤','秩序']
  };

  const prefixPool = prefixes[genre] || prefixes['修仙'];
  const suffixPool = suffixes[tone] || suffixes['热血'];

  const prefix = pick(prefixPool);
  const suffix = pick(suffixPool);

  // 偶尔加副标题
  if (Math.random() < 0.3) {
    const subtitles = ['','——一个废柴的逆袭之路','——命运的齿轮开始转动','','——这是一个关于选择的故事','——天地不仁，万物刍狗'];
    const sub = pick(subtitles);
    return prefix + suffix + sub;
  }

  return prefix + suffix;
}

// ── 格式化输出 ──
function formatParagraphs(text, pov, heroName, hero2Name, genre) {
  const parts = text.split('\n\n').filter(p => p.trim());

  let formatted = parts.map(p => '<p>' + p.trim() + '</p>').join('\n');

  // 在中间加入分隔符
  const pCount = parts.length;
  if (pCount >= 5) {
    const insertAt = Math.floor(pCount / 2);
    const lines = formatted.split('\n');
    lines.splice(insertAt, 0, '<p class="separator">* * *</p>');
    formatted = lines.join('\n');
  }

  // 添加作者注
  const date = new Date().toLocaleDateString('zh-CN');
  formatted += '\n<div class="story-footer">—— 生成于 ' + date + ' · 随机引擎 v1.0 ——</div>';

  return formatted;
}
