import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { Question, Mistake, StudyPlan, PlanTask, KnowledgePoint, DailyStat, Subject, StudySession, WeeklyReport } from './types'

interface GaoKaoDB extends DBSchema {
  subjects: { key: number; value: Subject }
  knowledge_points: { key: number; value: KnowledgePoint; indexes: { 'by-subject': number } }
  questions: { key: number; value: Question; indexes: { 'by-subject': number; 'by-type': string; 'by-difficulty': number } }
  practice_records: { key: number; value: { id?: number; question_id: number; user_answer: string; is_correct: number; time_spent: number; practiced_at: string }; indexes: { 'by-question': number } }
  mistake_book: { key: number; value: Mistake; indexes: { 'by-question': number; 'by-mastered': number } }
  mock_exams: { key: number; value: { id?: number; name: string; subject_id: number | null; total_score: number; duration: number; status: string; score: number | null; started_at: string | null; completed_at: string | null; created_at: string }; indexes: { 'by-status': string } }
  mock_exam_questions: { key: number; value: { id?: number; exam_id: number; question_id: number; user_answer: string; is_correct: number; score: number }; indexes: { 'by-exam': number } }
  study_plans: { key: number; value: StudyPlan; indexes: { 'by-status': string } }
  plan_tasks: { key: number; value: PlanTask; indexes: { 'by-plan': number } }
  daily_stats: { key: number; value: DailyStat; indexes: { 'by-date': string } }
  study_sessions: { key: number; value: StudySession; indexes: { 'by-date': string } }
  settings: { key: string; value: { key: string; value: any } }
}

let dbInstance: IDBPDatabase<GaoKaoDB> | null = null

async function getDB(): Promise<IDBPDatabase<GaoKaoDB>> {
  if (dbInstance) return dbInstance
  dbInstance = await openDB<GaoKaoDB>('gaokao-review', 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const subjects = db.createObjectStore('subjects', { keyPath: 'id', autoIncrement: true })
        const kp = db.createObjectStore('knowledge_points', { keyPath: 'id', autoIncrement: true })
        kp.createIndex('by-subject', 'subject_id')
        const questions = db.createObjectStore('questions', { keyPath: 'id', autoIncrement: true })
        questions.createIndex('by-subject', 'subject_id')
        questions.createIndex('by-type', 'type')
        questions.createIndex('by-difficulty', 'difficulty')
        const pr = db.createObjectStore('practice_records', { keyPath: 'id', autoIncrement: true })
        pr.createIndex('by-question', 'question_id')
        const mb = db.createObjectStore('mistake_book', { keyPath: 'id', autoIncrement: true })
        mb.createIndex('by-question', 'question_id')
        mb.createIndex('by-mastered', 'mastered')
        const me = db.createObjectStore('mock_exams', { keyPath: 'id', autoIncrement: true })
        me.createIndex('by-status', 'status')
        const meq = db.createObjectStore('mock_exam_questions', { keyPath: 'id', autoIncrement: true })
        meq.createIndex('by-exam', 'exam_id')
        const sp = db.createObjectStore('study_plans', { keyPath: 'id', autoIncrement: true })
        sp.createIndex('by-status', 'status')
        const pt = db.createObjectStore('plan_tasks', { keyPath: 'id', autoIncrement: true })
        pt.createIndex('by-plan', 'plan_id')
        const ds = db.createObjectStore('daily_stats', { keyPath: 'id', autoIncrement: true })
        ds.createIndex('by-date', 'date')
        db.createObjectStore('settings')
      }
      if (oldVersion < 2) {
        const ss = db.createObjectStore('study_sessions', { keyPath: 'id', autoIncrement: true })
        ss.createIndex('by-date', 'created_at')
      }
    }
  })
  return dbInstance
}

const DEFAULT_SUBJECTS: Subject[] = [
  { id: 1, name: '语文', icon: 'BookOpen' },
  { id: 2, name: '数学', icon: 'Calculator' },
  { id: 3, name: '英语', icon: 'Languages' },
  { id: 4, name: '物理', icon: 'Atom' },
  { id: 5, name: '化学', icon: 'FlaskConical' },
  { id: 6, name: '生物', icon: 'Dna' }
]

async function ensureSubjects() {
  const db = await getDB()
  const count = await db.count('subjects')
  if (count === 0) {
    const tx = db.transaction('subjects', 'readwrite')
    for (const s of DEFAULT_SUBJECTS) {
      await tx.store.add(s)
    }
    await tx.done
  }
}

async function ensureKnowledgePoints() {
  const db = await getDB()
  const count = await db.count('knowledge_points')
  if (count > 0) return

  const allKP = [
    // ===== 语文 =====
    { subject_id: 1, chapter: '文言文阅读', section: '实词', title: '常见文言实词120个', content: '爱、安、被、倍、本、鄙、兵、病、察、朝、曾、乘、诚、除、辞、从、殆、当、道、得、度、非、复、负、盖、故、顾、固、归、国、过、何、恨、胡、患、或、疾、及、即、既、假、间、见、解、就、举、绝、堪、克、类、怜、弥、莫、乃、内、期、奇、迁、请、穷、去、劝、却、如、若、善、少、涉、胜、识、使、是、适、书、孰、属、数、率、说、私、素、汤、涕、徒、亡、王、望、恶、微、悉、相、谢、信、兴、行、幸、修、徐、许、阳、要、宜、遗、贻、阴、引、右、逾、狱、再、造、知、致、质、治、诸、贼、族、卒、走、左、坐', importance: 5 },
    { subject_id: 1, chapter: '文言文阅读', section: '虚词', title: '常见文言虚词18个', content: '而、何、乎、乃、其、且、若、所、为、焉、也、以、因、于、与、则、者、之', importance: 5 },
    { subject_id: 1, chapter: '文言文阅读', section: '句式', title: '文言特殊句式', content: '1.判断句：...者...也、...者也、...也\n2.被动句：为...所...、见...于...、被\n3.倒装句：主谓倒装、宾语前置、定语后置、状语后置\n4.省略句：省主语、省宾语、省介词', importance: 4 },
    { subject_id: 1, chapter: '文言文阅读', section: '翻译', title: '文言文翻译原则', content: '信（准确）、达（通顺）、雅（优美）\n翻译六法：留、删、补、换、调、变', importance: 4 },
    { subject_id: 1, chapter: '古代诗歌鉴赏', section: '表达技巧', title: '诗歌表达技巧', content: '1.表达方式：记叙、描写、抒情、议论\n2.表现手法：象征、衬托、对比、烘托、用典、借景抒情、托物言志、虚实结合、动静结合\n3.修辞手法：比喻、拟人、夸张、对偶、反复、设问、反问', importance: 5 },
    { subject_id: 1, chapter: '古代诗歌鉴赏', section: '意象', title: '常见意象含义', content: '月：思乡、思亲\n柳：送别、留恋\n菊：隐逸、高洁\n梅：坚强、高洁\n梧桐：凄凉、悲伤\n杜鹃：哀怨、思归\n鸿雁：书信、思乡\n冰雪：纯洁、高尚', importance: 4 },
    { subject_id: 1, chapter: '古代诗歌鉴赏', section: '情感', title: '常见诗歌情感', content: '1.忧国忧民\n2.建功报国\n3.思乡怀人\n4.长亭送别\n5.生活杂感\n6.山水田园\n7.咏物言志\n8.怀古伤今', importance: 4 },
    { subject_id: 1, chapter: '现代文阅读', section: '论述类', title: '论述类文本阅读要点', content: '1.论点：中心论点、分论点\n2.论据：事实论据、道理论据\n3.论证方法：举例论证、道理论证、对比论证、比喻论证\n4.论证结构：总分、分总、总分总、并列、递进', importance: 4 },
    { subject_id: 1, chapter: '现代文阅读', section: '文学类', title: '小说阅读要素', content: '1.人物：外貌、语言、动作、心理、神态描写\n2.情节：开端、发展、高潮、结局\n3.环境：自然环境、社会环境\n4.主题：通过...反映了...表达了...', importance: 5 },
    { subject_id: 1, chapter: '现代文阅读', section: '文学类', title: '散文阅读要点', content: '1.形散神聚\n2.借景抒情、托物言志\n3.线索：时间、空间、事物、情感\n4.语言特点：朴实、华丽、清新、典雅', importance: 4 },
    { subject_id: 1, chapter: '语言文字运用', section: '成语', title: '常见易错成语', content: '不刊之论（正确）\n文不加点（正确）\n首当其冲（最先受到）\n空穴来风（有根据）\n差强人意（勉强满意）\n万人空巷（热闹）\n不以为然（不认为对）\n不以为意（不放在心上）', importance: 4 },
    { subject_id: 1, chapter: '语言文字运用', section: '病句', title: '病句六大类型', content: '1.语序不当\n2.搭配不当\n3.成分残缺或赘余\n4.结构混乱\n5.表意不明\n6.不合逻辑', importance: 5 },
    { subject_id: 1, chapter: '作文', section: '议论文', title: '议论文写作结构', content: '1.引论：提出论点\n2.本论：分析论证（并列式、递进式、对比式）\n3.结论：总结升华\n常用结构：是什么→为什么→怎么办', importance: 5 },
    { subject_id: 1, chapter: '作文', section: '素材', title: '万能作文素材', content: '1.司马迁：忍辱负重，著《史记》\n2.苏轼：屡遭贬谪，乐观旷达\n3.袁隆平：禾下乘凉梦\n4.钟南山：国士无双\n5.张桂梅：大山里的女校', importance: 4 },

    // ===== 数学 =====
    { subject_id: 2, chapter: '集合与逻辑', section: '集合', title: '集合的基本运算', content: '1.并集A∪B：属于A或属于B的所有元素\n2.交集A∩B：既属于A又属于B的元素\n3.补集∁ᵤA：全集U中不属于A的元素\n4.德摩根定律：∁ᵤ(A∪B)=(∁ᵤA)∩(∁ᵤB)', importance: 4 },
    { subject_id: 2, chapter: '集合与逻辑', section: '逻辑', title: '四种命题关系', content: '原命题：若p则q\n逆命题：若q则p\n否命题：若¬p则¬q\n逆否命题：若¬q则¬p\n原命题与逆否命题等价', importance: 4 },
    { subject_id: 2, chapter: '函数', section: '基本性质', title: '函数的单调性', content: '定义：x₁<x₂时，f(x₁)<f(x₂)为增函数\n判断方法：\n1.定义法\n2.导数法：f"(x)>0为增函数\n3.图像法', importance: 5 },
    { subject_id: 2, chapter: '函数', section: '基本性质', title: '函数的奇偶性', content: '奇函数：f(-x)=-f(x)，图像关于原点对称\n偶函数：f(-x)=f(x)，图像关于y轴对称\n前提：定义域关于原点对称', importance: 5 },
    { subject_id: 2, chapter: '函数', section: '基本初等函数', title: '指数函数', content: 'y=aˣ (a>0且a≠1)\n性质：\n1.a>1时单调递增，0<a<1时单调递减\n2.过定点(0,1)\n3.值域(0,+∞)', importance: 5 },
    { subject_id: 2, chapter: '函数', section: '基本初等函数', title: '对数函数', content: 'y=logₐx (a>0且a≠1)\n性质：\n1.a>1时单调递增，0<a<1时单调递减\n2.过定点(1,0)\n3.定义域(0,+∞)\n运算法则：logₐ(MN)=logₐM+logₐN', importance: 5 },
    { subject_id: 2, chapter: '函数', section: '基本初等函数', title: '幂函数', content: 'y=xᵅ\n常见幂函数：y=x, y=x², y=x³, y=√x, y=1/x\n共同点：都过定点(1,1)', importance: 4 },
    { subject_id: 2, chapter: '三角函数', section: '定义', title: '三角函数定义', content: 'sinα=y/r, cosα=x/r, tanα=y/x\n单位圆中：sinα=y, cosα=x\n同角三角函数关系：sin²α+cos²α=1, tanα=sinα/cosα', importance: 5 },
    { subject_id: 2, chapter: '三角函数', section: '公式', title: '诱导公式', content: '奇变偶不变，符号看象限\nsin(π/2-α)=cosα, cos(π/2-α)=sinα\nsin(π-α)=sinα, cos(π-α)=-cosα\nsin(-α)=-sinα, cos(-α)=cosα', importance: 5 },
    { subject_id: 2, chapter: '三角函数', section: '公式', title: '和差角公式', content: 'sin(α±β)=sinαcosβ±cosαsinβ\ncos(α±β)=cosαcosβ∓sinαsinβ\ntan(α±β)=(tanα±tanβ)/(1∓tanαtanβ)', importance: 5 },
    { subject_id: 2, chapter: '三角函数', section: '公式', title: '二倍角公式', content: 'sin2α=2sinαcosα\ncos2α=cos²α-sin²α=2cos²α-1=1-2sin²α\ntan2α=2tanα/(1-tan²α)', importance: 5 },
    { subject_id: 2, chapter: '数列', section: '等差数列', title: '等差数列公式', content: '通项公式：aₙ=a₁+(n-1)d\n前n项和：Sₙ=na₁+n(n-1)d/2=(a₁+aₙ)n/2\n性质：aₙ=(aₙ₋₁+aₙ₊₁)/2', importance: 5 },
    { subject_id: 2, chapter: '数列', section: '等比数列', title: '等比数列公式', content: '通项公式：aₙ=a₁qⁿ⁻¹\n前n项和：Sₙ=a₁(1-qⁿ)/(1-q) (q≠1)\n性质：aₙ²=aₙ₋₁·aₙ₊₁', importance: 5 },
    { subject_id: 2, chapter: '数列', section: '求和', title: '常见求和方法', content: '1.公式法\n2.分组求和法\n3.裂项相消法\n4.错位相减法\n5.倒序相加法', importance: 4 },
    { subject_id: 2, chapter: '立体几何', section: '线面关系', title: '线面平行判定', content: '判定定理：平面外一条直线与平面内一条直线平行，则该直线与此平面平行\n符号：a⊄α, b⊂α, a∥b ⇒ a∥α', importance: 5 },
    { subject_id: 2, chapter: '立体几何', section: '线面关系', title: '线面垂直判定', content: '判定定理：一条直线与平面内两条相交直线都垂直，则该直线与此平面垂直\n符号：a⊥m, a⊥n, m∩n=P, m⊂α, n⊂α ⇒ a⊥α', importance: 5 },
    { subject_id: 2, chapter: '立体几何', section: '面面关系', title: '面面平行与垂直', content: '面面平行：一个平面内两条相交直线与另一个平面平行\n面面垂直：一个平面过另一个平面的垂线\n二面角：从棱上一点分别在两个半平面内作棱的垂线', importance: 5 },
    { subject_id: 2, chapter: '解析几何', section: '直线', title: '直线方程', content: '斜截式：y=kx+b\n点斜式：y-y₀=k(x-x₀)\n两点式：(y-y₁)/(y₂-y₁)=(x-x₁)/(x₂-x₁)\n一般式：Ax+By+C=0\n两直线平行：k₁=k₂，垂直：k₁k₂=-1', importance: 5 },
    { subject_id: 2, chapter: '解析几何', section: '圆', title: '圆的方程', content: '标准方程：(x-a)²+(y-b)²=r²\n一般方程：x²+y²+Dx+Ey+F=0\n直线与圆位置关系：相离(d>r)、相切(d=r)、相交(d<r)', importance: 5 },
    { subject_id: 2, chapter: '解析几何', section: '圆锥曲线', title: '椭圆', content: '标准方程：x²/a²+y²/b²=1 (a>b>0)\n焦点在x轴，c²=a²-b²\n离心率e=c/a (0<e<1)\n焦点到准线距离：a²/c-c=b²/c', importance: 5 },
    { subject_id: 2, chapter: '解析几何', section: '圆锥曲线', title: '双曲线', content: '标准方程：x²/a²-y²/b²=1 (a>0,b>0)\n焦点在x轴，c²=a²+b²\n离心率e=c/a (e>1)\n渐近线：y=±(b/a)x', importance: 5 },
    { subject_id: 2, chapter: '解析几何', section: '圆锥曲线', title: '抛物线', content: '标准方程：y²=2px (p>0)\n焦点：(p/2,0)，准线：x=-p/2\n焦点弦公式：|AB|=x₁+x₂+p', importance: 5 },
    { subject_id: 2, chapter: '概率与统计', section: '概率', title: '古典概型', content: '特点：有限个等可能的基本事件\n公式：P(A)=A包含的基本事件数/总基本事件数\n互斥事件：P(A∪B)=P(A)+P(B)\n对立事件：P(A)=1-P(Ā)', importance: 4 },
    { subject_id: 2, chapter: '概率与统计', section: '统计', title: '数字特征', content: '平均数：x̄=(x₁+x₂+...+xₙ)/n\n方差：s²=[(x₁-x̄)²+...+(xₙ-x̄)²]/n\n标准差：s=√方差\n方差越小，数据越稳定', importance: 4 },
    { subject_id: 2, chapter: '导数', section: '运算', title: '导数基本公式', content: "(xⁿ)'=nxⁿ⁻¹\n(sinx)'=cosx\n(cosx)'=-sinx\n(eˣ)'=eˣ\n(aˣ)'=aˣlna\n(lnx)'=1/x\n(logₐx)'=1/(xlna)", importance: 5 },
    { subject_id: 2, chapter: '导数', section: '应用', title: '导数的应用', content: '1.求切线方程：y-f(x₀)=f\'(x₀)(x-x₀)\n2.判断单调性：f\'(x)>0增，f\'(x)<0减\n3.求极值：f\'(x)=0且左右异号\n4.求最值：比较极值和端点值', importance: 5 },

    // ===== 英语 =====
    { subject_id: 3, chapter: '语法', section: '时态', title: '八大时态', content: '1.一般现在时：do/does\n2.一般过去时：did\n3.一般将来时：will do/be going to\n4.过去将来时：would do\n5.现在进行时：am/is/are doing\n6.过去进行时：was/were doing\n7.现在完成时：have/has done\n8.过去完成时：had done', importance: 5 },
    { subject_id: 3, chapter: '语法', section: '时态', title: '现在完成时用法', content: '1.表示过去发生的动作对现在的影响\n2.表示从过去持续到现在的动作\n标志词：already, yet, just, ever, never, since, for\nhave been to（去过已回来）\nhave gone to（去了没回来）', importance: 5 },
    { subject_id: 3, chapter: '语法', section: '从句', title: '定语从句', content: '关系代词：who, whom, whose, which, that\n关系副词：when, where, why\nthat不能用于非限制性定语从句\n介词+which/whom不能用that', importance: 5 },
    { subject_id: 3, chapter: '语法', section: '从句', title: '名词性从句', content: '1.主语从句：What he said is true.\n2.宾语从句：I know that he is honest.\n3.表语从句：The problem is that we are late.\n4.同位语从句：The news that he won is true.', importance: 5 },
    { subject_id: 3, chapter: '语法', section: '从句', title: '状语从句', content: '1.时间状语从句：when, while, as, before, after, until\n2.条件状语从句：if, unless, as long as\n3.原因状语从句：because, since, as\n4.让步状语从句：although, though, even though\n5.目的状语从句：so that, in order that', importance: 5 },
    { subject_id: 3, chapter: '语法', section: '非谓语', title: '非谓语动词', content: '1.不定式：to do（表目的、将来）\n2.动名词：doing（表主动、进行）\n3.过去分词：done（表被动、完成）\n作主语、宾语、定语、状语、补语', importance: 5 },
    { subject_id: 3, chapter: '语法', section: '虚拟语气', title: '虚拟语气', content: '与现在事实相反：if+did/were, would do\n与过去事实相反：if+had done, would have done\n与将来事实相反：if+did/were to/should do\nwish/as if后的虚拟：时态退一步', importance: 4 },
    { subject_id: 3, chapter: '语法', section: '特殊句式', title: '倒装句', content: '全部倒装：\n1.there be句型\n2.here/there/now/then+动词+主语\n3.方位副词+动词+主语\n部分倒装：\n1.only+状语位于句首\n2.否定词位于句首\n3.so/neither/nor位于句首', importance: 4 },
    { subject_id: 3, chapter: '语法', section: '特殊句式', title: '强调句', content: 'It is/was+被强调部分+that/who+其他\n判断方法：去掉It is/was和that/who，句子仍完整\nIt was yesterday that I met him.\nIt was he who/that helped me.', importance: 4 },
    { subject_id: 3, chapter: '阅读', section: '技巧', title: '阅读理解解题技巧', content: '1.细节题：定位原文，同义替换\n2.主旨题：关注首尾段和各段首句\n3.推断题：注意infer, imply, suggest\n4.词义猜测题：利用上下文语境\n5.态度题：注意褒贬义词', importance: 5 },
    { subject_id: 3, chapter: '阅读', section: '题型', title: '七选五解题技巧', content: '1.看标题预测内容\n2.关注代词指代\n3.注意逻辑连接词\n4.利用同义复现\n5.检查上下文连贯性', importance: 4 },
    { subject_id: 3, chapter: '写作', section: '应用文', title: '书信写作模板', content: '开头：I am writing to...\n正文：First/Second/Last...\n结尾：I am looking forward to your reply.\n落款：Yours sincerely/truly\n常见类型：建议信、感谢信、道歉信、邀请信、申请信', importance: 5 },
    { subject_id: 3, chapter: '写作', section: '续写', title: '读后续写技巧', content: '1.理解原文情节和人物\n2.保持人物性格一致\n3.情节合理发展\n4.使用细节描写\n5.注意情感升华\n常用句型：With tears in his eyes, ...', importance: 4 },
    { subject_id: 3, chapter: '词汇', section: '高频词', title: '高考高频词汇', content: 'abandon, absolute, absorb, abstract, abundant, accelerate, accomplish, accurate, achieve, acknowledge, acquire, adapt, adequate, adjust, admire, admit, adopt, advance, advantage, adventure, advertise, affect, afford, aggressive, agriculture', importance: 5 },
    { subject_id: 3, chapter: '词汇', section: '短语', title: '高频动词短语', content: 'look forward to, look into, look up, look through\ntake up, take off, take on, take over, take in\nget along with, get over, get through, get rid of\nput up with, put off, put out, put forward\nturn out, turn up, turn down, turn over', importance: 5 },

    // ===== 物理 =====
    { subject_id: 4, chapter: '力学', section: '运动学', title: '匀变速直线运动', content: '基本公式：\n1.v=v₀+at\n2.x=v₀t+at²/2\n3.v²-v₀²=2ax\n4.x=(v₀+v)t/2\n推论：Δx=aT²', importance: 5 },
    { subject_id: 4, chapter: '力学', section: '运动学', title: '自由落体运动', content: '条件：初速度为0，只受重力\n公式：\n1.v=gt\n2.h=gt²/2\n3.v²=2gh\n4.h=(v₀+v)t/2\ng≈9.8m/s²≈10m/s²', importance: 5 },
    { subject_id: 4, chapter: '力学', section: '牛顿定律', title: '牛顿三大定律', content: '第一定律（惯性定律）：物体不受力时保持匀速直线运动或静止\n第二定律：F=ma\n第三定律：作用力与反作用力等大反向', importance: 5 },
    { subject_id: 4, chapter: '力学', section: '牛顿定律', title: '牛顿第二定律应用', content: '解题步骤：\n1.确定研究对象\n2.受力分析（重力、弹力、摩擦力）\n3.建立坐标系\n4.列方程：Fx=max, Fy=may\n5.解方程', importance: 5 },
    { subject_id: 4, chapter: '力学', section: '曲线运动', title: '平抛运动', content: '条件：水平抛出，只受重力\n水平方向：匀速直线运动 x=v₀t\n竖直方向：自由落体运动 y=gt²/2\n速度：v=√(v₀²+(gt)²)\n位移：s=√(x²+y²)', importance: 5 },
    { subject_id: 4, chapter: '力学', section: '曲线运动', title: '圆周运动', content: '线速度v=2πr/T=ωr\n角速度ω=2π/T=2πf\n向心加速度a=v²/r=ω²r\n向心力F=mv²/r=mω²r', importance: 5 },
    { subject_id: 4, chapter: '力学', section: '万有引力', title: '万有引力定律', content: 'F=GMm/r²\n天体运动：GMm/r²=mv²/r=mω²r=m(2π/T)²r\n第一宇宙速度：v=√(gR)=7.9km/s\n开普勒第三定律：a³/T²=k', importance: 5 },
    { subject_id: 4, chapter: '力学', section: '功和能', title: '功和功率', content: '功：W=Flcosα\n功率：P=W/t=Fv\n动能定理：W合=ΔEk=mv²/2-mv₀²/2\n重力做功：W=mgh，与路径无关', importance: 5 },
    { subject_id: 4, chapter: '力学', section: '功和能', title: '机械能守恒', content: '条件：只有重力或弹力做功\n公式：Ek₁+Ep₁=Ek₂+Ep₂\n即：mv₁²/2+mgh₁=mv₂²/2+mgh₂\n应用：自由落体、抛体运动、光滑斜面', importance: 5 },
    { subject_id: 4, chapter: '力学', section: '动量', title: '动量定理', content: '动量：p=mv\n动量定理：Ft=Δp=mv\'-mv\n冲量：I=Ft\n应用：碰撞、打击、缓冲', importance: 5 },
    { subject_id: 4, chapter: '力学', section: '动量', title: '动量守恒定律', content: '条件：系统不受外力或合外力为零\n公式：m₁v₁+m₂v₂=m₁v₁\'+m₂v₂\'\n应用：碰撞、爆炸、反冲\n弹性碰撞：动量守恒+动能守恒', importance: 5 },
    { subject_id: 4, chapter: '电磁学', section: '电场', title: '库仑定律', content: 'F=kQ₁Q₂/r²\nk=9×10⁹N·m²/C²\n电场强度：E=F/q=U/d\n点电荷电场：E=kQ/r²', importance: 5 },
    { subject_id: 4, chapter: '电磁学', section: '电场', title: '电场中的能量', content: '电势能：Ep=qφ\n电势差：U=φA-φB\n电场力做功：W=qU\n等势面：电场线垂直于等势面', importance: 5 },
    { subject_id: 4, chapter: '电磁学', section: '电路', title: '欧姆定律', content: '部分电路：I=U/R\n闭合电路：I=ε/(R+r)\n路端电压：U=ε-Ir\n串联：R=R₁+R₂\n并联：1/R=1/R₁+1/R₂', importance: 5 },
    { subject_id: 4, chapter: '电磁学', section: '电路', title: '电功和电功率', content: '电功：W=UIt\n电功率：P=UI\n焦耳定律：Q=I²Rt\n热功率：P热=I²R\n纯电阻电路：W=Q，即UIt=I²Rt', importance: 5 },
    { subject_id: 4, chapter: '电磁学', section: '磁场', title: '安培力', content: 'F=BILsinθ\n方向：左手定则\nθ为B与I的夹角\n应用：电动机原理', importance: 5 },
    { subject_id: 4, chapter: '电磁学', section: '磁场', title: '洛伦兹力', content: 'f=qvBsinθ\n方向：左手定则\n特点：不做功，只改变方向\n应用：回旋加速器、质谱仪', importance: 5 },
    { subject_id: 4, chapter: '电磁学', section: '电磁感应', title: '法拉第电磁感应定律', content: '感应电动势：ε=nΔΦ/Δt=BLv\n楞次定律：感应电流的磁场阻碍原磁通量变化\n右手定则：判断感应电流方向', importance: 5 },
    { subject_id: 4, chapter: '电磁学', section: '电磁感应', title: '自感与互感', content: '自感：线圈中电流变化产生感应电动势\n自感电动势：ε=LΔI/Δt\n互感：一个线圈电流变化在另一个线圈产生感应电动势\n应用：变压器', importance: 4 },
    { subject_id: 4, chapter: '热学', section: '分子动理论', title: '分子动理论', content: '1.物质由分子组成\n2.分子永不停息做无规则运动\n3.分子间存在引力和斥力\n布朗运动：悬浮颗粒的无规则运动\n扩散现象：分子热运动的宏观表现', importance: 4 },
    { subject_id: 4, chapter: '热学', section: '气体', title: '气体实验定律', content: '玻意耳定律：pV=C（等温）\n查理定律：p/T=C（等容）\n盖-吕萨克定律：V/T=C（等压）\n理想气体状态方程：pV/T=C', importance: 4 },
    { subject_id: 4, chapter: '光学', section: '几何光学', title: '光的折射', content: '折射定律：n₁sinθ₁=n₂sinθ₂\n全反射条件：光从光密到光疏，入射角≥临界角\n临界角：sinC=1/n\n应用：光纤通信', importance: 4 },
    { subject_id: 4, chapter: '光学', section: '波动光学', title: '光的干涉', content: '条件：两列光波频率相同，相位差恒定\n双缝干涉：Δx=Lλ/d\n薄膜干涉：肥皂泡、油膜彩色\n应用：检测平面平整度', importance: 4 },
    { subject_id: 4, chapter: '近代物理', section: '原子物理', title: '玻尔原子模型', content: '1.定态假设：原子在特定轨道上不辐射能量\n2.跃迁假设：hν=E₂-E₁\n3.轨道量子化：rₙ=n²r₁\n能级：Eₙ=E₁/n²', importance: 4 },
    { subject_id: 4, chapter: '近代物理', section: '原子核', title: '核反应方程', content: 'α衰变：²³⁸₉₂U→²³⁴₉₀Th+⁴₂He\nβ衰变：²³⁴₉₀Th→²³⁴₉₁Pa+⁰₋₁e\n裂变：²³⁵₉₂U+¹₀n→¹⁴¹₅₆Ba+⁹₂₃₆Kr+3¹₀n\n聚变：²₁H+³₁H→⁴₂He+¹₀n', importance: 4 },

    // ===== 化学 =====
    { subject_id: 5, chapter: '化学基本概念', section: '物质分类', title: '物质的分类', content: '纯净物：单质（金属、非金属）、化合物（酸、碱、盐、氧化物）\n混合物：溶液、胶体、浊液\n电解质：在水溶液或熔融状态下能导电的化合物\n非电解质：蔗糖、酒精等', importance: 4 },
    { subject_id: 5, chapter: '化学基本概念', section: '化学用语', title: '化学式与化学方程式', content: '化学式：用元素符号和数字表示物质组成的式子\n化学方程式：用化学式表示化学反应的式子\n书写步骤：写、配、注、等\n配平方法：最小公倍数法、奇数偶数法', importance: 4 },
    { subject_id: 5, chapter: '化学基本概念', section: '物质的量', title: '物质的量', content: 'n=m/M=V/Vm=N/NA=cV\nNA=6.02×10²³mol⁻¹\n标准状况Vm=22.4L/mol\n摩尔质量M在数值上等于相对分子质量', importance: 5 },
    { subject_id: 5, chapter: '化学基本概念', section: '氧化还原', title: '氧化还原反应', content: '本质：电子转移（得失或偏移）\n氧化剂→得电子→化合价降低→被还原→还原产物\n还原剂→失电子→化合价升高→被氧化→氧化产物\n口诀：升失氧，降得还', importance: 5 },
    { subject_id: 5, chapter: '化学基本概念', section: '离子反应', title: '离子反应', content: '发生条件：生成沉淀、气体或水\n离子方程式书写：写、拆、删、查\n强酸、强碱、可溶性盐拆成离子\n弱酸、弱碱、沉淀、气体、水保留化学式', importance: 5 },
    { subject_id: 5, chapter: '元素化合物', section: '金属', title: '钠及其化合物', content: 'Na：银白色，质软，密度小于水\nNa₂O₂：淡黄色，强氧化性，与水和CO₂反应生成O₂\nNaOH：强碱，潮解，吸收CO₂\nNa₂CO₃：纯碱，水溶液呈碱性\nNaHCO₃：小苏斗，受热分解', importance: 5 },
    { subject_id: 5, chapter: '元素化合物', section: '金属', title: '铝及其化合物', content: 'Al：银白色，两性金属\nAl₂O₃：两性氧化物，与酸和强碱反应\nAl(OH)₃：两性氢氧化物，受热分解\n明矾KAl(SO₄)₂·12H₂O：净水剂', importance: 5 },
    { subject_id: 5, chapter: '元素化合物', section: '金属', title: '铁及其化合物', content: 'Fe：银白色，有磁性\nFe²⁺：浅绿色，还原性\nFe³⁺：棕黄色，氧化性\n检验：Fe³⁺加KSCN变红\n转化：Fe→Fe²⁺→Fe³⁺', importance: 5 },
    { subject_id: 5, chapter: '元素化合物', section: '非金属', title: '氯及其化合物', content: 'Cl₂：黄绿色，有毒，强氧化性\nHCl：无色气体，易溶于水\nHClO：弱酸，强氧化性，杀菌消毒\n漂白粉：Ca(ClO)₂和CaCl₂混合物', importance: 5 },
    { subject_id: 5, chapter: '元素化合物', section: '非金属', title: '硫及其化合物', content: 'S：黄色固体\nSO₂：无色气体，漂白性（可逆），酸雨成因\nSO₃：无色固体，与水反应生成H₂SO₄\nH₂SO₄：浓硫酸有吸水性、脱水性、强氧化性', importance: 5 },
    { subject_id: 5, chapter: '元素化合物', section: '非金属', title: '氮及其化合物', content: 'N₂：无色无味，化学性质稳定\nNO：无色气体，与O₂反应生成NO₂\nNO₂：红棕色气体，与水反应生成HNO₃\nHNO₃：强酸，强氧化性，与金属反应不生成H₂', importance: 5 },
    { subject_id: 5, chapter: '元素化合物', section: '非金属', title: '碳和硅', content: 'C：金刚石（正四面体）、石墨（层状）、C₆₀\nCO：无色有毒，还原性\nCO₂：无色气体，温室效应\nSiO₂：原子晶体，与HF反应\n硅酸盐：陶瓷、玻璃、水泥', importance: 4 },
    { subject_id: 5, chapter: '化学反应原理', section: '化学能', title: '化学能与热能', content: '放热反应：反应物总能量>生成物总能量\n吸热反应：反应物总能量<生成物总能量\n热化学方程式：注明物质状态和ΔH\n燃烧热：1mol可燃物完全燃烧放出的热量\n中和热：稀强酸与稀强碱反应生成1mol水', importance: 5 },
    { subject_id: 5, chapter: '化学反应原理', section: '化学平衡', title: '化学平衡', content: '特征：逆、等、动、定、变\n平衡移动原理（勒夏特列原理）：改变条件，平衡向削弱该改变的方向移动\n影响因素：浓度、压强、温度\n催化剂不影响平衡，只改变速率', importance: 5 },
    { subject_id: 5, chapter: '化学反应原理', section: '化学平衡', title: '化学平衡常数', content: 'K=c^d(C)·c^e(D)/c^a(A)·c^b(B)\nK只与温度有关\nK越大，反应越完全\nQ<K正向移动，Q=K平衡，Q>K逆向移动', importance: 5 },
    { subject_id: 5, chapter: '化学反应原理', section: '电离平衡', title: '弱电解质的电离', content: '弱酸、弱碱部分电离\n电离平衡：CH₃COOH⇌CH₃COO⁻+H⁺\n电离常数Ka=c(CH₃COO⁻)·c(H⁺)/c(CH₃COOH)\n稀释促进电离，升温促进电离', importance: 5 },
    { subject_id: 5, chapter: '化学反应原理', section: '水的电离', title: '溶液的酸碱性', content: 'Kw=c(H⁺)·c(OH⁻)=10⁻¹⁴(25℃)\npH=-lgc(H⁺)\n酸性：pH<7，中性：pH=7，碱性：pH>7\n盐类水解：强酸弱碱盐呈酸性，强碱弱酸盐呈碱性', importance: 5 },
    { subject_id: 5, chapter: '化学反应原理', section: '电化学', title: '原电池', content: '条件：两种不同活泼性电极、电解质溶液、形成闭合回路\n负极：较活泼金属，氧化反应\n正极：较不活泼金属，还原反应\n电子流向：负极→导线→正极', importance: 5 },
    { subject_id: 5, chapter: '化学反应原理', section: '电化学', title: '电解池', content: '阳极：与电源正极相连，氧化反应\n阴极：与电源负极相连，还原反应\n放电顺序：\n阳极：S²⁻>I⁻>Br⁻>Cl⁻>OH⁻\n阴极：Ag⁺>Cu²⁺>H⁺>Zn²⁺', importance: 5 },
    { subject_id: 5, chapter: '有机化学', section: '烃', title: '有机物分类', content: '烃：只含C和H\n烷烃：CₙH₂ₙ₊₂，单键\n烯烃：CₙH₂ₙ，含C=C\n炔烃：CₙH₂ₙ₋₂，含C≡C\n芳香烃：含苯环', importance: 5 },
    { subject_id: 5, chapter: '有机化学', section: '烃的衍生物', title: '醇和醛', content: '醇：含-OH，可发生消去、酯化、氧化反应\n乙醇CH₃CH₂OH：与Na反应、催化氧化、消去\n醛：含-CHO，可发生银镜反应、与新制Cu(OH)₂反应\n乙醛CH₃CHO：加成、氧化', importance: 5 },
    { subject_id: 5, chapter: '有机化学', section: '烃的衍生物', title: '羧酸和酯', content: '羧酸：含-COOH，酸性，酯化反应\n乙酸CH₃COOH：弱酸，与醇反应生成酯\n酯：含-COO-，可水解\n乙酸乙酯CH₃COOCH₂CH₃：酸性/碱性水解', importance: 5 },
    { subject_id: 5, chapter: '有机化学', section: '高分子', title: '高分子化合物', content: '加聚反应：nCH₂=CH₂→[-CH₂-CH₂-]ₙ\n缩聚反应：nHO-R-COOH→[-O-R-CO-]ₙ+nH₂O\n常见高分子：聚乙烯、聚氯乙烯、聚苯乙烯\n天然高分子：淀粉、纤维素、蛋白质', importance: 4 },
    { subject_id: 5, chapter: '化学实验', section: '基本操作', title: '常见气体的制备', content: 'O₂：加热KClO₃+MnO₂或H₂O₂+MnO₂\nH₂：Zn+稀H₂SO₄\nCO₂：CaCO₃+稀HCl\nNH₃：加热NH₄Cl+Ca(OH)₂\n收集方法：排水法、向上/向下排空气法', importance: 5 },
    { subject_id: 5, chapter: '化学实验', section: '物质检验', title: '常见离子检验', content: 'Cl⁻：加AgNO₃生成白色沉淀，不溶于稀HNO₃\nSO₄²⁻：先加稀HCl，再加BaCl₂生成白色沉淀\nFe³⁺：加KSCN变红\nNH₄⁺：加NaOH加热，湿润红色石蕊试纸变蓝', importance: 5 },

    // ===== 生物 =====
    { subject_id: 6, chapter: '细胞', section: '分子组成', title: '组成细胞的元素和化合物', content: '大量元素：C、H、O、N、P、S、K、Ca、Mg\n微量元素：Fe、Mn、Zn、Cu、B、Mo\n鲜重最多：水\n干重最多：蛋白质\n基本元素：C', importance: 4 },
    { subject_id: 6, chapter: '细胞', section: '分子组成', title: '蛋白质', content: '基本单位：氨基酸（20种）\n结构特点：至少含一个-NH₂和一个-COOH，且连在同一个C上\n脱水缩合：n个氨基酸形成肽链脱去(n-1)个水\n结构多样性→功能多样性', importance: 5 },
    { subject_id: 6, chapter: '细胞', section: '分子组成', title: '核酸', content: 'DNA：脱氧核糖核酸，双链，含A、T、G、C\nRNA：核糖核酸，单链，含A、U、G、C\n基本单位：核苷酸\nDNA主要在细胞核，RNA主要在细胞质', importance: 5 },
    { subject_id: 6, chapter: '细胞', section: '分子组成', title: '糖类和脂质', content: '单糖：葡萄糖、果糖、核糖、脱氧核糖\n二糖：蔗糖、麦芽糖、乳糖\n多糖：淀粉、纤维素、糖原\n脂肪：储能物质\n磷脂：细胞膜成分\n固醇：胆固醇、性激素、维生素D', importance: 4 },
    { subject_id: 6, chapter: '细胞', section: '基本结构', title: '细胞膜', content: '结构：流动镶嵌模型\n成分：磷脂双分子层+蛋白质+糖类\n功能特点：选择透过性\n结构特点：流动性\n功能：保护、控制物质进出、细胞识别', importance: 5 },
    { subject_id: 6, chapter: '细胞', section: '基本结构', title: '细胞器', content: '线粒体：有氧呼吸主要场所\n叶绿体：光合作用场所\n内质网：蛋白质加工、脂质合成\n高尔基体：蛋白质加工、分泌\n核糖体：蛋白质合成\n溶酶体：消化车间\n液泡：调节细胞内环境', importance: 5 },
    { subject_id: 6, chapter: '细胞', section: '基本结构', title: '细胞核', content: '结构：核膜（双层）、核仁、染色质、核孔\n功能：遗传信息库，细胞代谢和遗传的控制中心\n染色质与染色体：同种物质不同时期的两种形态', importance: 4 },
    { subject_id: 6, chapter: '细胞', section: '代谢', title: '酶', content: '本质：多数是蛋白质，少数是RNA\n特性：高效性、专一性、多样性\n作用机理：降低化学反应的活化能\n影响因素：温度、pH\n最适条件：活性最高', importance: 5 },
    { subject_id: 6, chapter: '细胞', section: '代谢', title: 'ATP', content: '结构：A-P~P~P\nATP与ADP相互转化：ATP→ADP+Pi+能量\n来源：光合作用、呼吸作用\n用途：各种生命活动的直接能源物质', importance: 5 },
    { subject_id: 6, chapter: '细胞', section: '代谢', title: '光合作用', content: '光反应（类囊体薄膜）：\n水光解：2H₂O→4[H]+O₂\nATP合成：ADP+Pi→ATP\n暗反应（叶绿体基质）：\nCO₂固定：CO₂+C₅→2C₃\nC₃还原：C₃→C₅+(CH₂O)', importance: 5 },
    { subject_id: 6, chapter: '细胞', section: '代谢', title: '细胞呼吸', content: '有氧呼吸：\n第一阶段（细胞质基质）：葡萄糖→丙酮酸+[H]+少量ATP\n第二阶段（线粒体基质）：丙酮酸→CO₂+[H]+少量ATP\n第三阶段（线粒体内膜）：[H]+O₂→H₂O+大量ATP\n无氧呼吸：葡萄糖→酒精+CO₂或乳酸', importance: 5 },
    { subject_id: 6, chapter: '细胞', section: '增殖', title: '有丝分裂', content: '间期：DNA复制和蛋白质合成\n前期：核膜核仁消失，纺锤体出现\n中期：染色体排列在赤道板\n后期：着丝点分裂，染色体移向两极\n末期：核膜核仁出现\n意义：保持遗传稳定性', importance: 5 },
    { subject_id: 6, chapter: '细胞', section: '增殖', title: '减数分裂', content: '减数第一次分裂：同源染色体分离\n减数第二次分裂：着丝点分裂\n结果：一个母细胞→四个子细胞，染色体减半\n意义：形成配子，维持物种染色体数目稳定', importance: 5 },
    { subject_id: 6, chapter: '遗传', section: '基本规律', title: '孟德尔遗传定律', content: '分离定律：一对相对性状，F₂表现型比3:1\n自由组合定律：两对相对性状，F₂表现型比9:3:3:1\n实质：等位基因分离，非同源染色体上的非等位基因自由组合', importance: 5 },
    { subject_id: 6, chapter: '遗传', section: '基本规律', title: '伴性遗传', content: 'X染色体显性遗传：女患者多于男患者\nX染色体隐性遗传：男患者多于女患者\n色盲、血友病：X染色体隐性遗传\n抗维生素D佝偻病：X染色体显性遗传', importance: 5 },
    { subject_id: 6, chapter: '遗传', section: '分子基础', title: 'DNA复制', content: '时间：有丝分裂间期、减数第一次分裂前的间期\n场所：细胞核\n方式：半保留复制\n条件：模板、原料、能量、酶\n特点：边解旋边复制', importance: 5 },
    { subject_id: 6, chapter: '遗传', section: '分子基础', title: '基因表达', content: '转录：DNA→mRNA（在细胞核）\n翻译：mRNA→蛋白质（在核糖体）\n密码子：mRNA上三个相邻碱基\n反密码子：tRNA上三个碱基\n中心法则：DNA→RNA→蛋白质', importance: 5 },
    { subject_id: 6, chapter: '遗传', section: '变异', title: '可遗传变异', content: '基因突变：DNA分子中碱基对的增添、缺失、替换\n基因重组：控制不同性状的基因重新组合\n染色体变异：染色体结构或数目改变\n特点：基因突变是变异的根本来源', importance: 5 },
    { subject_id: 6, chapter: '遗传', section: '变异', title: '育种方法', content: '杂交育种：基因重组，操作简单\n诱变育种：基因突变，提高突变率\n单倍体育种：花药离体培养，缩短育种年限\n多倍体育种：秋水仙素处理，器官大\n基因工程育种：定向改造', importance: 4 },
    { subject_id: 6, chapter: '遗传', section: '进化', title: '现代生物进化理论', content: '种群是进化的基本单位\n突变和基因重组提供进化的原材料\n自然选择决定进化方向\n隔离导致新物种形成\n共同进化：不同物种之间、生物与环境之间', importance: 4 },
    { subject_id: 6, chapter: '稳态', section: '人体', title: '内环境稳态', content: '内环境：细胞外液（血浆、组织液、淋巴）\n稳态：内环境的理化性质保持相对稳定\n调节机制：神经-体液-免疫调节网络\n意义：机体进行正常生命活动的必要条件', importance: 5 },
    { subject_id: 6, chapter: '稳态', section: '人体', title: '神经调节', content: '基本方式：反射\n结构基础：反射弧（感受器→传入神经→神经中枢→传出神经→效应器）\n兴奋传导：电信号→化学信号→电信号\n特点：快速、短暂、准确', importance: 5 },
    { subject_id: 6, chapter: '稳态', section: '人体', title: '体液调节', content: '激素调节特点：微量高效、通过体液运输、作用于靶细胞\n甲状腺激素：促进代谢和生长发育\n胰岛素：降低血糖\n胰高血糖素：升高血糖\n反馈调节：负反馈为主', importance: 5 },
    { subject_id: 6, chapter: '稳态', section: '人体', title: '免疫调节', content: '非特异性免疫：皮肤、黏膜、吞噬细胞\n特异性免疫：\n体液免疫：B细胞→浆细胞→抗体\n细胞免疫：T细胞→效应T细胞→靶细胞\n免疫失调：过敏反应、自身免疫病、免疫缺陷', importance: 5 },
    { subject_id: 6, chapter: '稳态', section: '植物', title: '植物激素调节', content: '生长素：促进生长，两重性\n赤霉素：促进细胞伸长\n细胞分裂素：促进细胞分裂\n脱落酸：抑制生长，促进脱落\n乙烯：促进果实成熟', importance: 5 },
    { subject_id: 6, chapter: '生态', section: '种群', title: '种群和群落', content: '种群特征：种群密度、出生率和死亡率、年龄组成、性别比例\n种群数量变化：J型增长、S型增长\n群落结构：垂直结构和水平结构\n演替：初生演替和次生演替', importance: 5 },
    { subject_id: 6, chapter: '生态', section: '生态系统', title: '生态系统结构', content: '组成成分：非生物的物质和能量、生产者、消费者、分解者\n营养结构：食物链和食物网\n能量流动：单向流动、逐级递减\n物质循环：全球性、循环性', importance: 5 },
    { subject_id: 6, chapter: '生态', section: '生态系统', title: '生态系统功能', content: '能量流动：生产者→初级消费者→次级消费者\n能量传递效率：10%-20%\n物质循环：碳循环（CO₂↔含碳有机物）\n信息传递：物理信息、化学信息、行为信息\n稳定性：抵抗力稳定性和恢复力稳定性', importance: 5 },
    { subject_id: 6, chapter: '生态', section: '环境保护', title: '生物多样性', content: '三个层次：基因多样性、物种多样性、生态系统多样性\n价值：直接价值、间接价值、潜在价值\n保护措施：就地保护（自然保护区）、易地保护\n威胁因素：栖息地破坏、环境污染、过度捕猎、外来物种入侵', importance: 4 },
    { subject_id: 6, chapter: '实验', section: '显微镜', title: '显微镜使用', content: '步骤：取镜安放→对光→放置玻片→调焦→观察\n低倍镜→高倍镜：先移动装片到视野中央，再换高倍镜，调光圈和细准焦螺旋\n放大倍数=目镜倍数×物镜倍数\n成像：倒立虚像', importance: 4 },
    { subject_id: 6, chapter: '实验', section: '生物技术', title: '基因工程', content: '基本工具：限制酶、DNA连接酶、运载体\n步骤：提取目的基因→构建基因表达载体→导入受体细胞→检测与鉴定\n应用：转基因生物、基因治疗、基因诊断', importance: 4 },
  ]

  const d = await getDB()
  const tx = d.transaction('knowledge_points', 'readwrite')
  for (const kp of allKP) {
    await tx.store.add(kp as any)
  }
  await tx.done
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export const db = {
  async init() {
    await ensureSubjects()
    await ensureKnowledgePoints()
  },

  // Subjects
  async getSubjects(): Promise<Subject[]> {
    const d = await getDB()
    return d.getAll('subjects')
  },

  // Questions
  async getQuestions(filters: { subject_id?: number; type?: string; difficulty?: number; knowledge_point_id?: number; limit?: number } = {}): Promise<Question[]> {
    const d = await getDB()
    let results: Question[] = []
    if (filters.subject_id) {
      results = await d.getAllFromIndex('questions', 'by-subject', filters.subject_id)
    } else {
      results = await d.getAll('questions')
    }
    if (filters.type) results = results.filter(q => q.type === filters.type)
    if (filters.difficulty) results = results.filter(q => q.difficulty === filters.difficulty)
    if (filters.knowledge_point_id) results = results.filter(q => q.knowledge_point_id === filters.knowledge_point_id)
    // Shuffle
    for (let i = results.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [results[i], results[j]] = [results[j], results[i]]
    }
    if (filters.limit) results = results.slice(0, filters.limit)
    return results
  },

  async addQuestion(q: Omit<Question, 'id' | 'created_at'>): Promise<number> {
    const d = await getDB()
    return d.add('questions', { ...q, created_at: new Date().toISOString() } as Question)
  },

  async getQuestionCount(): Promise<number> {
    const d = await getDB()
    return d.count('questions')
  },

  // Practice
  async submitAnswer(record: { question_id: number; user_answer: string; is_correct: number; time_spent: number }) {
    const d = await getDB()
    await d.add('practice_records', { ...record, practiced_at: new Date().toISOString() })

    const q = await d.get('questions', record.question_id)
    if (!q) return
    const existing = await d.getAllFromIndex('daily_stats', 'by-date', todayStr())
    const stat = existing.find(s => s.subject_id === q.subject_id)
    if (stat) {
      await d.put('daily_stats', {
        ...stat,
        questions_done: stat.questions_done + 1,
        correct_count: stat.correct_count + record.is_correct,
        time_spent: stat.time_spent + (record.time_spent || 0)
      })
    } else {
      await d.add('daily_stats', {
        date: todayStr(),
        subject_id: q.subject_id,
        questions_done: 1,
        correct_count: record.is_correct,
        time_spent: record.time_spent || 0
      })
    }
  },

  // Mistakes
  async getMistakes(filters: { subject_id?: number; mastered?: number } = {}): Promise<Mistake[]> {
    const d = await getDB()
    let results: Mistake[]
    if (filters.mastered !== undefined) {
      results = await d.getAllFromIndex('mistake_book', 'by-mastered', filters.mastered)
    } else {
      results = await d.getAll('mistake_book')
    }
    if (filters.subject_id) {
      results = results.filter(m => {
        return true // will be enriched below
      })
    }
    // Enrich with question data
    const enriched: Mistake[] = []
    for (const m of results) {
      const q = await d.get('questions', m.question_id)
      if (!q) continue
      if (filters.subject_id && q.subject_id !== filters.subject_id) continue
      const subjects = await d.getAll('subjects')
      const subject = subjects.find(s => s.id === q.subject_id)
      enriched.push({
        ...m,
        content: q.content,
        correct_answer: q.answer,
        explanation: q.explanation || undefined,
        type: q.type,
        subject_id: q.subject_id,
        subject_name: subject?.name
      })
    }
    return enriched
  },

  async addMistake(mistake: { question_id: number; user_answer: string; error_type: string; note: string }) {
    const d = await getDB()
    const existing = await d.getAllFromIndex('mistake_book', 'by-question', mistake.question_id)
    if (existing.length > 0) return
    await d.add('mistake_book', {
      ...mistake,
      mastered: 0,
      review_count: 0,
      last_review: null,
      added_at: new Date().toISOString()
    })
  },

  async updateMistake(id: number, updates: Partial<Mistake>) {
    const d = await getDB()
    const existing = await d.get('mistake_book', id)
    if (!existing) return
    await d.put('mistake_book', { ...existing, ...updates })
  },

  async getMistakeCount(subject_id?: number): Promise<number> {
    const d = await getDB()
    const all = await d.getAllFromIndex('mistake_book', 'by-mastered', 0)
    if (!subject_id) return all.length
    let count = 0
    for (const m of all) {
      const q = await d.get('questions', m.question_id)
      if (q && q.subject_id === subject_id) count++
    }
    return count
  },

  // Mock exams
  async createMockExam(exam: { name: string; subject_id: number | null; total_score: number; duration: number }): Promise<number> {
    const d = await getDB()
    return d.add('mock_exams', {
      ...exam,
      status: 'pending',
      score: null,
      started_at: null,
      completed_at: null,
      created_at: new Date().toISOString()
    })
  },

  async getMockExams(filters: { status?: string } = []) {
    const d = await getDB()
    let results = await d.getAll('mock_exams')
    if (filters.status) results = results.filter(e => e.status === filters.status)
    const subjects = await d.getAll('subjects')
    return results.map(e => ({
      ...e,
      subject_name: subjects.find(s => s.id === e.subject_id)?.name
    })).sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  async submitExamAnswer(data: { exam_id: number; question_id: number; user_answer: string; is_correct: number; score: number }) {
    const d = await getDB()
    await d.add('mock_exam_questions', data)
  },

  async completeExam(data: { exam_id: number; score: number }) {
    const d = await getDB()
    const exam = await d.get('mock_exams', data.exam_id)
    if (exam) {
      await d.put('mock_exams', { ...exam, status: 'completed', score: data.score, completed_at: new Date().toISOString() })
    }
  },

  // Study plans
  async getStudyPlans() {
    const d = await getDB()
    const plans = await d.getAll('study_plans')
    const subjects = await d.getAll('subjects')
    const tasks = await d.getAll('plan_tasks')
    return plans.map(p => ({
      ...p,
      subject_name: subjects.find(s => s.id === p.subject_id)?.name,
      total_tasks: tasks.filter(t => t.plan_id === p.id).length,
      done_tasks: tasks.filter(t => t.plan_id === p.id && t.status === 'completed').length
    })).sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  async createStudyPlan(plan: { title: string; subject_id: number | null; description: string; target_date: string }): Promise<number> {
    const d = await getDB()
    return d.add('study_plans', { ...plan, status: 'active', created_at: new Date().toISOString() })
  },

  async createPlanTask(task: Omit<PlanTask, 'id' | 'completed_count' | 'status'>): Promise<number> {
    const d = await getDB()
    return d.add('plan_tasks', { ...task, completed_count: 0, status: 'pending' })
  },

  async updatePlanTask(id: number, updates: Partial<PlanTask>) {
    const d = await getDB()
    const existing = await d.get('plan_tasks', id)
    if (!existing) return
    await d.put('plan_tasks', { ...existing, ...updates })
  },

  // Knowledge points
  async getKnowledgePoints(subject_id?: number): Promise<KnowledgePoint[]> {
    const d = await getDB()
    if (subject_id) return d.getAllFromIndex('knowledge_points', 'by-subject', subject_id)
    return d.getAll('knowledge_points')
  },

  async addKnowledgePoint(kp: Omit<KnowledgePoint, 'id'>): Promise<number> {
    const d = await getDB()
    return d.add('knowledge_points', kp as KnowledgePoint)
  },

  // Stats
  async getDailyStats(days: number = 30): Promise<DailyStat[]> {
    const d = await getDB()
    const all = await d.getAll('daily_stats')
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    const subjects = await d.getAll('subjects')
    return all.filter(s => s.date >= cutoffStr).map(s => ({
      ...s,
      subject_name: subjects.find(sub => sub.id === s.subject_id)?.name
    }))
  },

  async getSubjectStats() {
    const d = await getDB()
    const subjects = await d.getAll('subjects')
    const stats = await d.getAll('daily_stats')
    return subjects.map(s => {
      const subStats = stats.filter(st => st.subject_id === s.id)
      return {
        id: s.id,
        name: s.name,
        total_questions: subStats.reduce((sum, st) => sum + st.questions_done, 0),
        total_correct: subStats.reduce((sum, st) => sum + st.correct_count, 0),
        total_time: subStats.reduce((sum, st) => sum + st.time_spent, 0)
      }
    })
  },

  async getRecentAccuracy(days: number = 7) {
    const d = await getDB()
    const all = await d.getAll('daily_stats')
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    const filtered = all.filter(s => s.date >= cutoffStr)
    const byDate: Record<string, { total: number; correct: number }> = {}
    for (const s of filtered) {
      if (!byDate[s.date]) byDate[s.date] = { total: 0, correct: 0 }
      byDate[s.date].total += s.questions_done
      byDate[s.date].correct += s.correct_count
    }
    return Object.entries(byDate).map(([date, v]) => ({
      date,
      total: v.total,
      correct: v.correct,
      accuracy: v.total > 0 ? Math.round((v.correct / v.total) * 100 * 10) / 10 : 0
    })).sort((a, b) => a.date.localeCompare(b.date))
  },

  async getWeakPoints(subject_id?: number) {
    const d = await getDB()
    const mistakes = await d.getAllFromIndex('mistake_book', 'by-mastered', 0)
    const kps = await d.getAll('knowledge_points')
    const subjects = await d.getAll('subjects')
    const countMap: Record<number, number> = {}
    for (const m of mistakes) {
      const q = await d.get('questions', m.question_id)
      if (!q || !q.knowledge_point_id) continue
      if (subject_id && q.subject_id !== subject_id) continue
      countMap[q.knowledge_point_id] = (countMap[q.knowledge_point_id] || 0) + 1
    }
    return Object.entries(countMap)
      .map(([kpId, count]) => {
        const kp = kps.find(k => k.id === Number(kpId))
        if (!kp) return null
        return {
          title: kp.title,
          chapter: kp.chapter,
          subject_name: subjects.find(s => s.id === kp.subject_id)?.name,
          mistake_count: count
        }
      })
      .filter(Boolean)
      .sort((a, b) => b!.mistake_count - a!.mistake_count)
      .slice(0, 10) as any[]
  },

  // Settings
  async getSetting(key: string): Promise<any> {
    const d = await getDB()
    const s = await d.get('settings', key)
    return s?.value
  },

  async setSetting(key: string, value: any) {
    const d = await getDB()
    await d.put('settings', { key, value })
  },

  // Import sample data
  async importQuestions(questions: Omit<Question, 'id' | 'created_at'>[]) {
    const d = await getDB()
    for (const q of questions) {
      await d.add('questions', { ...q, created_at: new Date().toISOString() } as Question)
    }
  },

  // Study sessions (学习打卡)
  async startStudySession(subject_id: number | null, session_type: 'study' | 'practice' | 'review', note: string = ''): Promise<number> {
    const d = await getDB()
    return d.add('study_sessions', {
      subject_id,
      start_time: new Date().toISOString(),
      end_time: null,
      duration: 0,
      session_type,
      note,
      created_at: new Date().toISOString()
    })
  },

  async endStudySession(id: number, duration: number) {
    const d = await getDB()
    const session = await d.get('study_sessions', id)
    if (session) {
      await d.put('study_sessions', { ...session, end_time: new Date().toISOString(), duration })
    }
  },

  async getStudySessions(days: number = 30): Promise<StudySession[]> {
    const d = await getDB()
    const all = await d.getAll('study_sessions')
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return all.filter(s => new Date(s.created_at) >= cutoff).sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  async getTodayStudyMinutes(): Promise<number> {
    const d = await getDB()
    const all = await d.getAll('study_sessions')
    const today = todayStr()
    return all
      .filter(s => s.created_at.startsWith(today) && s.end_time)
      .reduce((sum, s) => sum + s.duration, 0) / 60
  },

  async getStudyStreak(): Promise<number> {
    const d = await getDB()
    const stats = await d.getAll('daily_stats')
    const sessions = await d.getAll('study_sessions')
    const dates = new Set<string>()
    stats.forEach(s => dates.add(s.date))
    sessions.forEach(s => { if (s.end_time) dates.add(s.created_at.slice(0, 10)) })
    const sorted = Array.from(dates).sort().reverse()
    if (sorted.length === 0) return 0
    let streak = 0
    const now = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      if (dates.has(dateStr)) streak++
      else if (i > 0) break
    }
    return streak
  },

  // Weekly report (周报导出)
  async generateWeeklyReport(): Promise<WeeklyReport> {
    const d = await getDB()
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + 1)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const startDate = weekStart.toISOString().slice(0, 10)
    const endDate = weekEnd.toISOString().slice(0, 10)

    const stats = await d.getAll('daily_stats')
    const sessions = await d.getAll('study_sessions')
    const subjects = await d.getAll('subjects')

    const weekStats = stats.filter(s => s.date >= startDate && s.date <= endDate)
    const weekSessions = sessions.filter(s => {
      const date = s.created_at.slice(0, 10)
      return date >= startDate && date <= endDate && s.end_time
    })

    const totalStudyMinutes = Math.round(weekSessions.reduce((sum, s) => sum + s.duration, 0) / 60)
    const totalQuestions = weekStats.reduce((sum, s) => sum + s.questions_done, 0)
    const totalCorrect = weekStats.reduce((sum, s) => sum + s.correct_count, 0)
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

    const studyDays = new Set([
      ...weekStats.map(s => s.date),
      ...weekSessions.map(s => s.created_at.slice(0, 10))
    ]).size

    const dailyBreakdown: { date: string; minutes: number; questions: number; correct: number }[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      const dateStr = d.toISOString().slice(0, 10)
      const dayStats = weekStats.filter(s => s.date === dateStr)
      const daySessions = weekSessions.filter(s => s.created_at.startsWith(dateStr))
      dailyBreakdown.push({
        date: dateStr,
        minutes: Math.round(daySessions.reduce((sum, s) => sum + s.duration, 0) / 60),
        questions: dayStats.reduce((sum, s) => sum + s.questions_done, 0),
        correct: dayStats.reduce((sum, s) => sum + s.correct_count, 0)
      })
    }

    const subjectBreakdown = subjects.map(s => {
      const subStats = weekStats.filter(st => st.subject_id === s.id)
      const subSessions = weekSessions.filter(ss => ss.subject_id === s.id)
      const q = subStats.reduce((sum, st) => sum + st.questions_done, 0)
      const c = subStats.reduce((sum, st) => sum + st.correct_count, 0)
      return {
        name: s.name,
        minutes: Math.round(subSessions.reduce((sum, ss) => sum + ss.duration, 0) / 60),
        questions: q,
        accuracy: q > 0 ? Math.round((c / q) * 100) : 0
      }
    }).filter(s => s.minutes > 0 || s.questions > 0)

    return { weekStart: startDate, weekEnd: endDate, totalStudyMinutes, totalQuestions, totalCorrect, accuracy, studyDays, dailyBreakdown, subjectBreakdown }
  },

  // Export data as text for sharing
  async exportWeeklyReportText(): Promise<string> {
    const report = await this.generateWeeklyReport()
    const dayNames = ['日', '一', '二', '三', '四', '五', '六']
    let text = `📊 高三学习周报\n`
    text += `📅 ${report.weekStart} ~ ${report.weekEnd}\n\n`
    text += `📈 本周概览\n`
    text += `• 学习时长：${report.totalStudyMinutes} 分钟\n`
    text += `• 做题数量：${report.totalQuestions} 道\n`
    text += `• 正确数量：${report.totalCorrect} 道\n`
    text += `• 正确率：${report.accuracy}%\n`
    text += `• 学习天数：${report.studyDays}/7 天\n\n`

    text += `📅 每日明细\n`
    report.dailyBreakdown.forEach(d => {
      const date = new Date(d.date)
      const dayName = dayNames[date.getDay()]
      text += `• 周${dayName} ${d.date.slice(5)}：${d.minutes}分钟 | ${d.questions}题 | ${d.correct}正确\n`
    })

    if (report.subjectBreakdown.length > 0) {
      text += `\n📚 科目分布\n`
      report.subjectBreakdown.forEach(s => {
        text += `• ${s.name}：${s.minutes}分钟 | ${s.questions}题 | ${s.accuracy}%\n`
      })
    }

    text += `\n💪 继续加油！`
    return text
  }
}
