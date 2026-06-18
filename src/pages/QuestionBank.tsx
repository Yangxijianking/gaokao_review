import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { db } from '../db'
import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS } from '../types'
import { GraduationCap, Plus, Upload, Search, Trash2, FileJson, Download } from 'lucide-react'

export default function QuestionBank() {
  const { subjects } = useStore()
  const [questions, setQuestions] = useState<any[]>([])
  const [subjectId, setSubjectId] = useState<number | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    subject_id: 1, type: 'single' as any, difficulty: 3,
    content: '', options: '', answer: '', explanation: '',
    knowledge_point_id: null as number | null, source: '', year: 2024, region: '重庆'
  })

  useEffect(() => { loadQuestions() }, [subjectId])

  const loadQuestions = async () => {
    const filters: any = {}
    if (subjectId) filters.subject_id = subjectId
    const qs = await db.getQuestions(filters)
    setTotalCount(await db.getQuestionCount())
    setQuestions(qs.slice(0, 50))
  }

  const addQuestion = async () => {
    if (!form.content || !form.answer) { alert('请填写题目内容和答案'); return }
    await db.addQuestion(form)
    setForm({ ...form, content: '', options: '', answer: '', explanation: '' })
    setShowAdd(false); loadQuestions()
  }

  const filtered = searchTerm
    ? questions.filter(q => q.content.includes(searchTerm) || q.answer.includes(searchTerm))
    : questions

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const items = Array.isArray(data) ? data : data.questions || data.data || [data]
      let success = 0, failed = 0
      for (const item of items) {
        try {
          const subjectName = item.subject || item.subject_name || ''
          const matchedSubject = subjects.find(s => s.name === subjectName || s.name.includes(subjectName))
          await db.addQuestion({
            subject_id: matchedSubject?.id || item.subject_id || 1,
            type: item.type || 'single',
            difficulty: item.difficulty || 3,
            content: item.content || item.question || item.title || '',
            options: typeof item.options === 'string' ? item.options : Array.isArray(item.options) ? item.options.join('\n') : '',
            answer: item.answer || '',
            explanation: item.explanation || item解析 || '',
            source: item.source || file.name,
            year: item.year || new Date().getFullYear(),
            region: item.region || '全国',
            knowledge_point_id: item.knowledge_point_id || null
          })
          success++
        } catch { failed++ }
      }
      setImportResult({ success, failed })
      loadQuestions()
    } catch (err) {
      alert('JSON解析失败，请检查文件格式')
    }
    setImporting(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const downloadTemplate = () => {
    const template = [
      {
        subject: '数学', type: 'single', difficulty: 3,
        content: '函数f(x)=x²的最小值是（ ）',
        options: ['-1', '0', '1', '2'],
        answer: 'B', explanation: 'f(x)=x²≥0，当x=0时取最小值0',
        source: '示例题', year: 2024, region: '全国'
      }
    ]
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = '题库模板.json'; a.click()
    URL.revokeObjectURL(url)
  }

  const importSample = async () => {
    const samples = [
      // ===== 语文 =====
      { subject_id: 1, type: 'fill' as const, difficulty: 3, content: '补写出下列名篇名句中的空缺部分：\n（1）_______，不尽长江滚滚来。（杜甫《登高》）', options: '', answer: '无边落木萧萧下', explanation: '杜甫《登高》中的名句', source: '高考真题', year: 2024, region: '全国', knowledge_point_id: null },
      { subject_id: 1, type: 'fill' as const, difficulty: 3, content: '补写出下列名篇名句中的空缺部分：\n_______，长河落日圆。（王维《使至塞上》）', options: '', answer: '大漠孤烟直', explanation: '王维《使至塞上》描绘边塞壮丽风光', source: '高考真题', year: 2023, region: '全国', knowledge_point_id: null },
      { subject_id: 1, type: 'fill' as const, difficulty: 2, content: '补写出下列名篇名句中的空缺部分：\n_______，病树前头万木春。（刘禹锡《酬乐天扬州初逢席上见赠》）', options: '', answer: '沉舟侧畔千帆过', explanation: '刘禹锡表达乐观豁达的人生态度', source: '高考真题', year: 2023, region: '全国', knowledge_point_id: null },
      { subject_id: 1, type: 'fill' as const, difficulty: 3, content: '补写出下列名篇名句中的空缺部分：\n人生如梦，_______。（苏轼《念奴娇·赤壁怀古》）', options: '', answer: '一尊还酹江月', explanation: '苏轼以酒酹月，表达旷达胸怀', source: '高考真题', year: 2022, region: '全国', knowledge_point_id: null },
      { subject_id: 1, type: 'fill' as const, difficulty: 2, content: '补写出下列名篇名句中的空缺部分：\n_______，一览众山小。（杜甫《望岳》）', options: '', answer: '会当凌绝顶', explanation: '杜甫《望岳》表达登高望远的豪情', source: '高考真题', year: 2022, region: '全国', knowledge_point_id: null },
      { subject_id: 1, type: 'single' as const, difficulty: 3, content: '下列词语中，没有错别字的一组是（ ）', options: '寒暄  安详  走投无路\n脉搏  诀窍  金榜题名\n精粹  膏粱  委曲求全\n竣工  修葺  鼎力相助', answer: 'B', explanation: 'A项"寒暄"应为"寒暄"；C项"膏粱"应为"膏粱"；D项"鼎力相助"应为"鼎力相助"', source: '模拟题', year: 2024, region: '重庆', knowledge_point_id: null },
      { subject_id: 1, type: 'single' as const, difficulty: 2, content: '下列句子中，加点的成语使用恰当的一项是（ ）', options: '这部小说情节跌宕起伏，抑扬顿挫，具有很强的感染力。\n他在演讲中旁征博引，妙语连珠，听众无不拍手称快。\n这篇文章内容浅显，但观点鲜明，针砭时弊，入木三分。\n面对这道难题，他苦思冥想，终于豁然开朗，真是妙手偶得。', answer: 'C', explanation: 'A项"抑扬顿挫"形容声音；B项"拍手称快"用于仇恨消除；D项"妙手偶得"指偶然得到', source: '模拟题', year: 2024, region: '重庆', knowledge_point_id: null },
      { subject_id: 1, type: 'single' as const, difficulty: 3, content: '下列各句中，没有语病的一项是（ ）', options: '通过这次活动，使我认识到了团结的重要性。\n能否刻苦学习是取得好成绩的关键。\n他不但学习好，而且品德高尚。\n我们要及时解决并发现学习中的问题。', answer: 'C', explanation: 'A项缺主语；B项两面对一面；D项语序不当', source: '模拟题', year: 2024, region: '重庆', knowledge_point_id: null },

      // ===== 数学 =====
      { subject_id: 2, type: 'single' as const, difficulty: 2, content: '已知集合A={1,2,3}，B={2,3,4}，则A∩B=（ ）', options: '{1,2}\n{2,3}\n{3,4}\n{1,4}', answer: 'B', explanation: 'A∩B取两个集合的公共元素{2,3}', source: '高考真题', year: 2024, region: '全国', knowledge_point_id: null },
      { subject_id: 2, type: 'single' as const, difficulty: 2, content: '已知i是虚数单位，则(1+i)/(1-i)=（ ）', options: '-1\n1\n-i\ni', answer: 'D', explanation: '(1+i)/(1-i) = (1+i)²/[(1-i)(1+i)] = (1+2i-1)/2 = i', source: '高考真题', year: 2024, region: '全国', knowledge_point_id: null },
      { subject_id: 2, type: 'single' as const, difficulty: 3, content: '函数f(x)=x²-2x+1的最小值是（ ）', options: '-1\n0\n1\n2', answer: 'B', explanation: 'f(x)=(x-1)²≥0，当x=1时取最小值0', source: '高考真题', year: 2024, region: '全国', knowledge_point_id: null },
      { subject_id: 2, type: 'single' as const, difficulty: 3, content: '等差数列{an}中，a₁=1，d=2，则a₁₀=（ ）', options: '17\n19\n21\n23', answer: 'B', explanation: 'a₁₀=a₁+9d=1+9×2=19', source: '高考真题', year: 2023, region: '全国', knowledge_point_id: null },
      { subject_id: 2, type: 'single' as const, difficulty: 3, content: '已知sinα=3/5，α∈(π/2,π)，则cosα=（ ）', options: '4/5\n-4/5\n3/4\n-3/4', answer: 'B', explanation: 'sin²α+cos²α=1，cos²α=1-9/25=16/25，α在第二象限cosα<0，所以cosα=-4/5', source: '高考真题', year: 2023, region: '全国', knowledge_point_id: null },
      { subject_id: 2, type: 'single' as const, difficulty: 2, content: 'log₂8=（ ）', options: '2\n3\n4\n5', answer: 'B', explanation: 'log₂8=log₂2³=3', source: '高考真题', year: 2023, region: '全国', knowledge_point_id: null },
      { subject_id: 2, type: 'single' as const, difficulty: 4, content: '已知函数f(x)=x³-3x²+2，则f(x)的极大值为（ ）', options: '-2\n0\n2\n4', answer: 'C', explanation: "f'(x)=3x²-6x=3x(x-2)，令f'(x)=0得x=0或x=2。f(0)=2为极大值，f(2)=-2为极小值", source: '高考真题', year: 2024, region: '全国', knowledge_point_id: null },
      { subject_id: 2, type: 'single' as const, difficulty: 2, content: '不等式|x-1|<2的解集是（ ）', options: '{x|-1<x<3}\n{x|x<-1或x>3}\n{x|x>3}\n{x|x<-1}', answer: 'A', explanation: '|x-1|<2 → -2<x-1<2 → -1<x<3', source: '高考真题', year: 2022, region: '全国', knowledge_point_id: null },
      { subject_id: 2, type: 'single' as const, difficulty: 3, content: '已知向量a⃗=(1,2)，b⃗=(x,1)，若a⃗⊥b⃗，则x=（ ）', options: '-2\n-1\n1\n2', answer: 'A', explanation: 'a⃗⊥b⃗ → a⃗·b⃗=0 → 1×x+2×1=0 → x=-2', source: '高考真题', year: 2022, region: '全国', knowledge_point_id: null },
      { subject_id: 2, type: 'single' as const, difficulty: 4, content: '椭圆x²/4+y²/3=1的离心率为（ ）', options: '1/2\n√3/2\n√2/2\n1/4', answer: 'A', explanation: 'a²=4，b²=3，c²=a²-b²=1，e=c/a=1/2', source: '高考真题', year: 2024, region: '全国', knowledge_point_id: null },

      // ===== 英语 =====
      { subject_id: 3, type: 'single' as const, difficulty: 2, content: 'The teacher asked Tom _______ he had finished his homework.', options: 'that\nwhether\nwhat\nwhich', answer: 'B', explanation: 'whether引导宾语从句，表示"是否"', source: '高考真题', year: 2024, region: '全国', knowledge_point_id: null },
      { subject_id: 3, type: 'single' as const, difficulty: 2, content: 'I _______ to the Great Wall twice since I came to Beijing.', options: 'have been\nhave gone\nwent\nhad been', answer: 'A', explanation: 'have been to表示"去过某地（已回来）"，twice提示用现在完成时', source: '高考真题', year: 2024, region: '全国', knowledge_point_id: null },
      { subject_id: 3, type: 'single' as const, difficulty: 3, content: 'It is necessary _______ we learn English well.', options: 'that\nwhat\nwhich\nwhether', answer: 'A', explanation: 'It is + adj. + that从句，that引导主语从句', source: '高考真题', year: 2023, region: '全国', knowledge_point_id: null },
      { subject_id: 3, type: 'single' as const, difficulty: 2, content: 'This is the book _______ I bought yesterday.', options: 'who\nwhich\nwhat\nwhere', answer: 'B', explanation: 'which引导定语从句，修饰先行词book', source: '高考真题', year: 2023, region: '全国', knowledge_point_id: null },
      { subject_id: 3, type: 'single' as const, difficulty: 3, content: 'Not until he finished his homework _______ to play.', options: 'he was allowed\nwas he allowed\ndid he allow\nhe allowed', answer: 'B', explanation: 'Not until位于句首，主句用部分倒装', source: '高考真题', year: 2023, region: '全国', knowledge_point_id: null },
      { subject_id: 3, type: 'single' as const, difficulty: 2, content: 'She is _______ than her sister.', options: 'more beautiful\nmost beautiful\nbeautiful\nthe most beautiful', answer: 'A', explanation: 'than提示用比较级，beautiful→more beautiful', source: '高考真题', year: 2022, region: '全国', knowledge_point_id: null },
      { subject_id: 3, type: 'single' as const, difficulty: 3, content: 'The reason _______ he was late was _______ he missed the bus.', options: 'why; that\nthat; why\nwhy; because\nthat; that', answer: 'A', explanation: 'The reason why...was that...固定句型', source: '高考真题', year: 2022, region: '全国', knowledge_point_id: null },
      { subject_id: 3, type: 'single' as const, difficulty: 2, content: 'He suggested that we _______ early.', options: 'start\nstarted\nstarting\nwould start', answer: 'A', explanation: 'suggest后接that从句用虚拟语气，should+动词原形，should可省略', source: '高考真题', year: 2024, region: '全国', knowledge_point_id: null },
      { subject_id: 3, type: 'single' as const, difficulty: 3, content: '_______ is known to all, the earth goes around the sun.', options: 'It\nAs\nThat\nWhat', answer: 'B', explanation: 'As引导非限制性定语从句，"正如..."', source: '高考真题', year: 2024, region: '全国', knowledge_point_id: null },

      // ===== 物理 =====
      { subject_id: 4, type: 'single' as const, difficulty: 3, content: '一个物体从静止开始做匀加速直线运动，第3s内的位移是3m，则第5s内的位移是（ ）', options: '5m\n7m\n9m\n11m', answer: 'C', explanation: '第n秒内位移xₙ=(2n-1)x₁=3m→x₁=1m，第5s内x₅=9×1=9m', source: '高考真题', year: 2024, region: '全国', knowledge_point_id: null },
      { subject_id: 4, type: 'single' as const, difficulty: 2, content: '下列物理量中，属于矢量的是（ ）', options: '质量\n时间\n速度\n温度', answer: 'C', explanation: '速度有大小和方向，是矢量；质量、时间、温度只有大小，是标量', source: '高考真题', year: 2024, region: '全国', knowledge_point_id: null },
      { subject_id: 4, type: 'single' as const, difficulty: 3, content: '一个质量为2kg的物体，受到6N的合力作用，其加速度为（ ）', options: '3m/s²\n6m/s²\n8m/s²\n12m/s²', answer: 'A', explanation: '由牛顿第二定律F=ma，a=F/m=6/2=3m/s²', source: '高考真题', year: 2023, region: '全国', knowledge_point_id: null },
      { subject_id: 4, type: 'single' as const, difficulty: 3, content: '自由落体运动中，物体在第2s末的速度为（g=10m/s²）（ ）', options: '10m/s\n15m/s\n20m/s\n25m/s', answer: 'C', explanation: 'v=gt=10×2=20m/s', source: '高考真题', year: 2023, region: '全国', knowledge_point_id: null },
      { subject_id: 4, type: 'single' as const, difficulty: 4, content: '一个物体以20m/s的初速度竖直上抛，不计空气阻力，物体到达最高点的时间为（g=10m/s²）（ ）', options: '1s\n2s\n3s\n4s', answer: 'B', explanation: '最高点速度为0，v=v₀-gt，0=20-10t，t=2s', source: '高考真题', year: 2023, region: '全国', knowledge_point_id: null },
      { subject_id: 4, type: 'single' as const, difficulty: 2, content: '下列单位中，属于国际单位制中基本单位的是（ ）', options: 'm/s\nN\nkg\nJ', answer: 'C', explanation: 'kg（千克）是质量的基本单位，m/s、N、J是导出单位', source: '高考真题', year: 2022, region: '全国', knowledge_point_id: null },
      { subject_id: 4, type: 'single' as const, difficulty: 3, content: '关于牛顿第一定律，下列说法正确的是（ ）', options: '物体只有在不受力时才能保持匀速直线运动\n牛顿第一定律可以通过实验直接验证\n力是改变物体运动状态的原因\n惯性大小与物体运动速度有关', answer: 'C', explanation: '牛顿第一定律说明力是改变运动状态的原因，不是维持运动的原因', source: '高考真题', year: 2022, region: '全国', knowledge_point_id: null },
      { subject_id: 4, type: 'single' as const, difficulty: 4, content: '汽车以10m/s的速度行驶，刹车后做匀减速运动，加速度大小为2m/s²，则刹车后6s内的位移为（ ）', options: '24m\n25m\n30m\n36m', answer: 'B', explanation: '刹车时间t=v₀/a=10/2=5s，5s后停止。位移x=v₀t-at²/2=10×5-2×25/2=50-25=25m', source: '高考真题', year: 2024, region: '全国', knowledge_point_id: null },

      // ===== 化学 =====
      { subject_id: 5, type: 'single' as const, difficulty: 2, content: '下列物质中，属于电解质的是（ ）', options: '铜\n蔗糖\nNaCl溶液\nNaOH', answer: 'D', explanation: 'NaOH是化合物，在水溶液中能导电，属于电解质', source: '高考真题', year: 2024, region: '全国', knowledge_point_id: null },
      { subject_id: 5, type: 'single' as const, difficulty: 2, content: '下列气体中，能使澄清石灰水变浑浊的是（ ）', options: 'N₂\nO₂\nCO₂\nH₂', answer: 'C', explanation: 'CO₂+Ca(OH)₂=CaCO₃↓+H₂O，生成碳酸钙沉淀', source: '高考真题', year: 2024, region: '全国', knowledge_point_id: null },
      { subject_id: 5, type: 'single' as const, difficulty: 3, content: '下列反应中，属于氧化还原反应的是（ ）', options: 'CaO+H₂O=Ca(OH)₂\nNaOH+HCl=NaCl+H₂O\n2Na+2H₂O=2NaOH+H₂↑\nCaCO₃=CaO+CO₂↑', answer: 'C', explanation: 'Na元素化合价升高（0→+1），H元素化合价降低（+1→0），有化合价变化', source: '高考真题', year: 2023, region: '全国', knowledge_point_id: null },
      { subject_id: 5, type: 'single' as const, difficulty: 3, content: '下列离子方程式正确的是（ ）', options: '铁与稀硫酸反应：2Fe+6H⁺=2Fe³⁺+3H₂↑\n氢氧化钡与硫酸反应：Ba²⁺+SO₄²⁻=BaSO₄↓\n碳酸钙与盐酸反应：CaCO₃+2H⁺=Ca²⁺+H₂O+CO₂↑\n铜与稀硝酸反应：Cu+4H⁺+2NO₃⁻=Cu²⁺+2NO₂↑+2H₂O', answer: 'C', explanation: 'A项应生成Fe²⁺；B项漏写OH⁻与H⁺反应；D项应生成NO', source: '高考真题', year: 2023, region: '全国', knowledge_point_id: null },
      { subject_id: 5, type: 'single' as const, difficulty: 2, content: '下列元素中，原子半径最大的是（ ）', options: 'Na\nMg\nAl\nSi', answer: 'A', explanation: '同周期从左到右原子半径减小，Na在最左边', source: '高考真题', year: 2022, region: '全国', knowledge_point_id: null },
      { subject_id: 5, type: 'single' as const, difficulty: 3, content: '下列有机物中，能使酸性高锰酸钾溶液褪色的是（ ）', options: '甲烷\n乙烯\n苯\n乙醇', answer: 'B', explanation: '乙烯含有碳碳双键，能被酸性高锰酸钾氧化', source: '高考真题', year: 2022, region: '全国', knowledge_point_id: null },
      { subject_id: 5, type: 'single' as const, difficulty: 4, content: '某溶液中含有Cl⁻、SO₄²⁻、CO₃²⁻，欲将三种离子逐一沉淀出来，加入试剂的顺序正确的是（ ）', options: 'Ba²⁺、Ag⁺、H⁺\nAg⁺、Ba²⁺、H⁺\nBa²⁺、H⁺、Ag⁺\nH⁺、Ba²⁺、Ag⁺', answer: 'D', explanation: '先加H⁺沉淀CO₃²⁻，再加Ba²⁺沉淀SO₄²⁻，最后加Ag⁺沉淀Cl⁻', source: '高考真题', year: 2024, region: '全国', knowledge_point_id: null },

      // ===== 生物 =====
      { subject_id: 6, type: 'single' as const, difficulty: 2, content: '下列属于相对性状的是（ ）', options: '豌豆的高茎和矮茎\n兔的长毛和狗的短毛\n人的身高和体重\n豌豆的圆粒和黄色', answer: 'A', explanation: '相对性状是同种生物同一性状的不同表现类型', source: '高考真题', year: 2024, region: '全国', knowledge_point_id: null },
      { subject_id: 6, type: 'single' as const, difficulty: 2, content: '细胞中含量最多的化合物是（ ）', options: '蛋白质\n水\n脂质\n糖类', answer: 'B', explanation: '水是细胞中含量最多的化合物，约占细胞鲜重的85%-90%', source: '高考真题', year: 2024, region: '全国', knowledge_point_id: null },
      { subject_id: 6, type: 'single' as const, difficulty: 3, content: '光合作用中，暗反应的场所是（ ）', options: '叶绿体外膜\n叶绿体内膜\n类囊体薄膜\n叶绿体基质', answer: 'D', explanation: '暗反应（卡尔文循环）发生在叶绿体基质中', source: '高考真题', year: 2023, region: '全国', knowledge_point_id: null },
      { subject_id: 6, type: 'single' as const, difficulty: 3, content: '下列关于DNA复制的叙述，正确的是（ ）', options: '以一条链为模板\n只在细胞核中进行\n遵循碱基互补配对原则\n需要DNA酶的催化', answer: 'C', explanation: 'DNA复制以两条链为模板，在细胞核和线粒体中进行，需要DNA聚合酶', source: '高考真题', year: 2023, region: '全国', knowledge_point_id: null },
      { subject_id: 6, type: 'single' as const, difficulty: 2, content: '人体最大的消化腺是（ ）', options: '唾液腺\n胃腺\n肝脏\n胰腺', answer: 'C', explanation: '肝脏是人体最大的消化腺，能分泌胆汁', source: '高考真题', year: 2022, region: '全国', knowledge_point_id: null },
      { subject_id: 6, type: 'single' as const, difficulty: 3, content: '基因突变的特点不包括（ ）', options: '普遍性\n随机性\n不定向性\n高频性', answer: 'D', explanation: '基因突变的特点：普遍性、随机性、低频性、不定向性、多害少利性', source: '高考真题', year: 2022, region: '全国', knowledge_point_id: null },
      { subject_id: 6, type: 'single' as const, difficulty: 4, content: '一对表现型正常的夫妇，生了一个患白化病的孩子，则他们再生一个正常孩子的概率是（ ）', options: '1/4\n1/2\n3/4\n1', answer: 'C', explanation: '父母基因型均为Aa，正常孩子概率为3/4（AA:2/4，Aa:1/4，aa:1/4）', source: '高考真题', year: 2024, region: '全国', knowledge_point_id: null },
      { subject_id: 6, type: 'single' as const, difficulty: 2, content: '下列不属于生态系统组成成分的是（ ）', options: '生产者\n消费者\n分解者\n食物链', answer: 'D', explanation: '生态系统组成成分：非生物的物质和能量、生产者、消费者、分解者', source: '高考真题', year: 2024, region: '全国', knowledge_point_id: null },
      { subject_id: 6, type: 'single' as const, difficulty: 3, content: '减数分裂过程中，同源染色体分离发生在（ ）', options: '减数第一次分裂前期\n减数第一次分裂后期\n减数第二次分裂前期\n减数第二次分裂后期', answer: 'B', explanation: '同源染色体分离发生在减数第一次分裂后期', source: '高考真题', year: 2023, region: '全国', knowledge_point_id: null },
    ]
    for (const s of samples) await db.addQuestion(s)
    loadQuestions()
    alert(`已导入 ${samples.length} 道示例题目（语文${samples.filter(s=>s.subject_id===1).length}道、数学${samples.filter(s=>s.subject_id===2).length}道、英语${samples.filter(s=>s.subject_id===3).length}道、物理${samples.filter(s=>s.subject_id===4).length}道、化学${samples.filter(s=>s.subject_id===5).length}道、生物${samples.filter(s=>s.subject_id===6).length}道）`)
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">题库管理</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">共 {totalCount} 道题目</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadTemplate} className="btn-secondary flex items-center gap-2 text-sm"><Download className="w-4 h-4" /> 模板</button>
          <button onClick={() => fileInputRef.current?.click()} className="btn-secondary flex items-center gap-2 text-sm" disabled={importing}>
            <FileJson className="w-4 h-4" /> {importing ? '导入中...' : '导入JSON'}
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          <button onClick={importSample} className="btn-secondary flex items-center gap-2 text-sm"><Upload className="w-4 h-4" /> 导入示例</button>
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> 添加题目</button>
        </div>
      </div>

      {importResult && (
        <div className={`p-3 rounded-lg text-sm ${importResult.failed > 0 ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300' : 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'}`}>
          导入完成：成功 {importResult.success} 道{importResult.failed > 0 ? `，失败 ${importResult.failed} 道` : ''}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input-field pl-10" placeholder="搜索题目..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <select className="input-field w-full sm:w-40" value={subjectId || ''} onChange={e => setSubjectId(e.target.value ? Number(e.target.value) : null)}>
          <option value="">全部科目</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {showAdd && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">添加题目</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">科目</label>
              <select className="input-field text-sm" value={form.subject_id} onChange={e => setForm({ ...form, subject_id: Number(e.target.value) })}>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">题型</label>
              <select className="input-field text-sm" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })}>
                {Object.entries(QUESTION_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">难度</label>
              <select className="input-field text-sm" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: Number(e.target.value) })}>
                {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">题目内容 *</label>
              <textarea className="input-field h-24 resize-none text-sm" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="输入题目内容..." />
            </div>
            {['single', 'multi', 'judge'].includes(form.type) && (
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">选项（每行一个）</label>
                <textarea className="input-field h-24 resize-none text-sm" value={form.options} onChange={e => setForm({ ...form, options: e.target.value })} placeholder="选项A&#10;选项B&#10;选项C&#10;选项D" />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">正确答案 *</label>
                <input className="input-field text-sm" value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} placeholder="如：A 或 具体答案" />
              </div>
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">来源</label>
                <input className="input-field text-sm" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="如：2024高考真题" />
              </div>
            </div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">解析</label>
              <textarea className="input-field h-20 resize-none text-sm" value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })} placeholder="输入解析..." />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={addQuestion} className="btn-primary text-sm">添加</button>
            <button onClick={() => setShowAdd(false)} className="btn-secondary text-sm">取消</button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <GraduationCap className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">题库为空</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">点击"导入示例"快速添加样题</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(q => (
            <div key={q.id} className="card">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="badge badge-blue">{subjects.find(s => s.id === q.subject_id)?.name}</span>
                <span className="badge badge-yellow">{QUESTION_TYPE_LABELS[q.type]}</span>
                <span className="badge badge-green">{DIFFICULTY_LABELS[q.difficulty]}</span>
                {q.year && <span className="badge badge-blue">{q.year}年</span>}
              </div>
              <p className="text-sm text-gray-900 dark:text-white line-clamp-2 mb-2">{q.content}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">答案：{q.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
