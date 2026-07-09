/**
 * ========================================
 *  ValkoValley 入站考试题库
 * ========================================
 *
 * 题库分为两类：
 *   category: 'rules'  — 社区文明公约题
 *   category: 'aoyin' — 敖尹个人知识题
 *
 * 修改方式：
 *   1. 直接编辑此文件（作为默认题库）
 *   2. 在管理后台 /admin/exam 增删改（同步到数据库 exam_questions 表）
 *
 * 题目格式：
 *   {
 *     category: 'rules' | 'aoyin',
 *     question: '题目文字',
 *     options: ['A. 选项一', 'B. 选项二', 'C. 选项三', 'D. 选项四'],
 *     correctIndex: 0, // 正确答案在 options 数组中的索引
 *   }
 */

const examQuestions = [
  // ==========================================
  //  社区公约题（14 题）
  // ==========================================
  {
    category: 'rules',
    question: '在 ValkoValley 讨论区发帖时，以下哪种行为是符合社区规范的？',
    options: [
      'A. 发表对敖尹角色的深度分析和同人创作',
      'B. 搬运其他平台对相关游戏的负面节奏帖子',
      'C. 发布与敖尹完全无关的广告内容',
      'D. 批量发布灌水帖刷屏',
    ],
    correctIndex: 0,
  },
  {
    category: 'rules',
    question: '当你在讨论区看到有人发表了你不认同的敖尹同人解读时，你应该怎么做？',
    options: [
      'A. 直接辱骂对方"不懂角色"',
      'B. 理性回复，阐述自己的理解，并尊重对方的解读自由',
      'C. 号召其他人一起举报该用户',
      'D. 截图发到其他社交平台挂人',
    ],
    correctIndex: 1,
  },
  {
    category: 'rules',
    question: '关于 ValkoValley 的创作专区，以下哪种行为是被允许的？',
    options: [
      'A. 搬运其他创作者的敖尹同人作品，不标注来源',
      'B. 发布自己原创的敖尹同人文/绘画，并标注"原创"',
      'C. 发布游戏的盗版安装包',
      'D. 直接盗用他人作品并声称是自己的',
    ],
    correctIndex: 1,
  },
  {
    category: 'rules',
    question: '如果你发现某个用户发布的帖子涉嫌引战或攻击他人，你应该怎么做？',
    options: [
      'A. 在帖子下方对骂',
      'B. 点击"举报"按钮，由审核员处理',
      'C. 截图发到其他社交平台曝光',
      'D. 无视，让事情自然发展',
    ],
    correctIndex: 1,
  },
  {
    category: 'rules',
    question: '关于 ValkoValley 的私信功能，以下哪种行为是符合规范的？',
    options: [
      'A. 利用私信对其他用户进行人身攻击或骚扰',
      'B. 经过对方同意后，进行正常的同人创作交流',
      'C. 向大量陌生用户发送广告信息',
      'D. 在私信中索取他人真实姓名和联系方式',
    ],
    correctIndex: 1,
  },
  {
    category: 'rules',
    question: '以下哪种行为属于"恶意引战"？',
    options: [
      'A. 理性讨论敖尹的角色弧光',
      'B. 发表"敖尹不如XXX角色"并故意@大量用户挑衅',
      'C. 分享自己创作的敖尹同人作品',
      'D. 在评论区和他人友好探讨剧情',
    ],
    correctIndex: 1,
  },
  {
    category: 'rules',
    question: '在 ValkoValley 发布的同人创作，版权归属如何界定？',
    options: [
      'A. 作品版权归创作者本人所有，ValkoValley 仅作为展示平台',
      'B. 作品版权自动归 ValkoValley 所有',
      'C. 作品版权归游戏公司所有',
      'D. 发布后版权进入公共领域',
    ],
    correctIndex: 0,
  },
  {
    category: 'rules',
    question: '如果你在 ValkoValley 看到有人发布"内部人员爆料"的帖子，你应该怎么做？',
    options: [
      'A. 立即转发到其他群聊',
      'B. 点击"举报"，不传播未经证实的信息',
      'C. 信以为真并在评论区追问更多细节',
      'D. 以此为素材制作视频发到 B 站',
    ],
    correctIndex: 1,
  },
  {
    category: 'rules',
    question: '在创作区发布作品时，以下哪项是必须选择的？',
    options: [
      'A. 作品字数',
      'B. 年龄分级标签（全年龄 / 15+ / 18+）',
      'C. 作品发布时间',
      'D. 作品价格',
    ],
    correctIndex: 1,
  },
  {
    category: 'rules',
    question: 'ValkoValley 的违规公示会持续多久？',
    options: [
      'A. 永久公示',
      'B. 7 天',
      'C. 30 天',
      'D. 1 天',
    ],
    correctIndex: 1,
  },
  {
    category: 'rules',
    question: '以下哪项关于举报的描述是正确的？',
    options: [
      'A. 举报会公开显示举报人的信息',
      'B. 每个人都可以不提供理由随意举报',
      'C. 举报由管理员审核后处理，保护举报人隐私',
      'D. 举报后内容会被立即自动删除',
    ],
    correctIndex: 2,
  },
  {
    category: 'rules',
    question: '下列哪种情形属于侵犯他人版权的行为？',
    options: [
      'A. 转载他人作品并标明出处并已获授权',
      'B. 将他人的同人图裁掉水印后作为自己的作品发布',
      'C. 在自己的同人创作中合理引用官方设定',
      'D. 翻译外国同人文并注明原作者和授权',
    ],
    correctIndex: 1,
  },
  {
    category: 'rules',
    question: '以下哪种行为不会在 ValkoValley 受到处罚？',
    options: [
      'A. 友善地评论鼓励他人的创作',
      'B. 恶意刷屏灌水影响正常讨论',
      'C. 冒充管理员身份欺骗其他用户',
      'D. 发布含有恶意链接的钓鱼帖',
    ],
    correctIndex: 0,
  },
  {
    category: 'rules',
    question: 'ValkoValley 的用户在发布涉及成人内容的创作时，应该怎么做？',
    options: [
      'A. 不做任何标注直接发布',
      'B. 正确选择 18+ 年龄分级标签，遵守平台规定',
      'C. 只发在讨论区',
      'D. 以私信方式发送给管理员代发',
    ],
    correctIndex: 1,
  },

  // ==========================================
  //  敖尹个人知识题（14 题）
  // ==========================================
  {
    category: 'aoyin',
    question: '敖尹的英文名是什么？',
    options: [
      'A. AoYin',
      'B. Valko',
      'C. Valco',
      'D. YinAo',
    ],
    correctIndex: 1,
  },
  {
    category: 'aoyin',
    question: '敖尹的种族是什么？',
    options: [
      'A. 人类',
      'B. 精灵',
      'C. 狼人',
      'D. 吸血鬼',
    ],
    correctIndex: 2,
  },
  {
    category: 'aoyin',
    question: 'ValkoValley 的核心 CP 是？',
    options: [
      'A. 敖尹 × 任意角色',
      'B. 狼和小铃兰',
      'C. 官方主线 CP',
      'D. 所有可配对 CP',
    ],
    correctIndex: 1,
  },
  {
    category: 'aoyin',
    question: '"狼和小铃兰"中的"狼"指的是谁？',
    options: [
      'A. 游戏中的怪物',
      'B. 敖尹（Valko）',
      'C. 社区管理员',
      'D. 路人角色',
    ],
    correctIndex: 1,
  },
  {
    category: 'aoyin',
    question: '"小铃兰"在 ValkoValley 社区中指的是什么？',
    options: [
      'A. 一种花卉植物',
      'B. 入站的喜爱敖尹的用户们',
      'C. 社区管理员',
      'D. 敖尹的宠物',
    ],
    correctIndex: 1,
  },
  {
    category: 'aoyin',
    question: '铃兰的花语是什么？',
    options: [
      'A. 永恒的爱',
      'B. 幸福归来',
      'C. 孤独的守护',
      'D. 热烈的思念',
    ],
    correctIndex: 1,
  },
  {
    category: 'aoyin',
    question: '以下哪种花是敖尹的代表花？',
    options: [
      'A. 玫瑰',
      'B. 樱花',
      'C. 铃兰',
      'D. 向日葵',
    ],
    correctIndex: 2,
  },
  {
    category: 'aoyin',
    question: '敖尹喜欢什么？（提示：这些对狼本身是有害的，设定中包含制作组对他的祝福和爱）',
    options: [
      'A. 葡萄和洋葱',
      'B. 巧克力和铃兰花',
      'C. 咖啡和玫瑰',
      'D. 辣椒和仙人掌',
    ],
    correctIndex: 1,
  },
  {
    category: 'aoyin',
    question: '敖尹与小铃兰的关系是？',
    options: [
      'A. 主仆关系',
      'B. 敌敌联手',
      'C. 兄妹关系',
      'D. 师徒关系',
    ],
    correctIndex: 1,
  },
  {
    category: 'aoyin',
    question: '"不要在锅里洗澡"这句宣发语的原本含义暗指的是什么？',
    options: [
      'A. 提醒注意厨房卫生',
      'B. 古希腊神话中吕卡翁亵渎宙斯被变成狼人的故事',
      'C. 一个普通的烹饪警告',
      'D. 告诫不要在热水中泡太久',
    ],
    correctIndex: 1,
  },
  {
    category: 'aoyin',
    question: '"不要在锅里洗澡"曾被曲解为什么事件？',
    options: [
      'A. 美食烹饪大赛',
      'B. 沸锅杀妻案',
      'C. 温泉旅行',
      'D. 巫师炼药事故',
    ],
    correctIndex: 1,
  },
  {
    category: 'aoyin',
    question: '敖尹的背景设定中"献祭血肉才换来相遇"的原型是哪部史诗中的角色？',
    options: [
      'A. 荷马史诗中的阿喀琉斯',
      'B. 古印度史诗《摩诃婆罗多》中的迦尔纳',
      'C. 吉尔伽美什史诗中的恩奇都',
      'D. 尼伯龙根之歌中的齐格飞',
    ],
    correctIndex: 1,
  },
  {
    category: 'aoyin',
    question: '敖尹小时候流浪时，没有被子盖，他是用什么来保暖的？',
    options: [
      'A. 捡来的破布',
      'B. 自己的尾巴',
      'C. 路边的树叶',
      'D. 别人的旧衣服',
    ],
    correctIndex: 1,
  },
  {
    category: 'aoyin',
    question: 'ValkoValley 社区中是否允许出现敖尹以外的其他 CP 讨论？',
    options: [
      'A. 允许，任何人都可以讨论任意 CP',
      'B. 不允许，本站只专注狼和小铃兰这一对 CP',
      'C. 允许在特定板块讨论',
      'D. 由用户自行决定',
    ],
    correctIndex: 1,
  },
]

export default examQuestions
