import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { db } from '../db'
import { Question, DIFFICULTY_LABELS } from '../types'
import { FileText, Clock, Trophy, ChevronLeft, ChevronRight, Plus, CheckCircle2 } from 'lucide-react'

export default function MockExam() {
  const { subjects } = useStore()
  const [exams, setExams] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [examName, setExamName] = useState('')
  const [subjectId, setSubjectId] = useState<number | null>(null)
  const [duration, setDuration] = useState(120)
  const [questionCount, setQuestionCount] = useState(20)
  const [examState, setExamState] = useState<any>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])

  useEffect(() => { loadExams() }, [])

  useEffect(() => {
    if (examState && !examState.submitted && examState.timeLeft > 0) {
      const timer = setInterval(() => {
        setExamState((prev: any) => {
          if (!prev || prev.submitted) return prev
          const newTime = prev.timeLeft - 1
          if (newTime <= 0) { submitExam(); return { ...prev, timeLeft: 0, submitted: true } }
          return { ...prev, timeLeft: newTime }
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [examState?.submitted, examState?.timeLeft])

  const loadExams = async () => { setExams(await db.getMockExams()) }

  const createExam = async () => {
    if (!examName) { alert('请输入考试名称'); return }
    const result = await db.createMockExam({ name: examName, subject_id: subjectId, total_score: 150, duration })
    const filters: any = { limit: questionCount }
    if (subjectId) filters.subject_id = subjectId
    const questions = await db.getQuestions(filters)
    if (questions.length === 0) { alert('题库中没有足够的题目，请先添加题目'); return }
    setExamState({ id: result as number, questions, currentIndex: 0, answers: new Map(), startTime: Date.now(), timeLeft: duration * 60, submitted: false, score: 0, totalScore: questions.length * 5 })
    setShowCreate(false); setUserAnswer(''); setSelectedOptions([])
  }

  const toggleOption = (opt: string) => {
    if (!examState || examState.submitted) return
    const q = examState.questions[examState.currentIndex]
    if (q.type === 'single') setSelectedOptions([opt])
    else setSelectedOptions(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt])
  }

  const saveAnswer = () => {
    if (!examState) return
    const q = examState.questions[examState.currentIndex]
    let answer = ''
    if (['single', 'multi', 'judge'].includes(q.type)) answer = selectedOptions.sort().join(',')
    else answer = userAnswer.trim()
    const newAnswers = new Map(examState.answers); newAnswers.set(q.id, answer)
    setExamState({ ...examState, answers: newAnswers })
  }

  const goToQuestion = (index: number) => {
    if (!examState) return; saveAnswer()
    setExamState({ ...examState, currentIndex: index })
    const q = examState.questions[index]; const saved = examState.answers.get(q.id) || ''
    if (['single', 'multi', 'judge'].includes(q.type)) { setSelectedOptions(saved ? saved.split(',') : []); setUserAnswer('') }
    else { setUserAnswer(saved); setSelectedOptions([]) }
  }

  const submitExam = async () => {
    if (!examState) return; saveAnswer()
    let score = 0
    for (const q of examState.questions) {
      const answer = examState.answers.get(q.id) || ''; const correct = answer === q.answer
      if (correct) score += 5
      await db.submitExamAnswer({ exam_id: examState.id, question_id: q.id, user_answer: answer, is_correct: correct ? 1 : 0, score: correct ? 5 : 0 })
      if (!correct) await db.addMistake({ question_id: q.id, user_answer: answer, error_type: 'exam', note: '' })
    }
    await db.completeExam({ exam_id: examState.id, score })
    setExamState({ ...examState, submitted: true, score }); loadExams()
  }

  const formatTime = (s: number) => `${Math.floor(s / 3600).toString().padStart(2, '0')}:${Math.floor((s % 3600) / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const parseOptions = (s: string | null): string[] => { if (!s) return []; try { return JSON.parse(s) } catch { return s.split('\n').filter(Boolean) } }

  if (examState) {
    const q = examState.questions[examState.currentIndex]; const options = parseOptions(q.options)
    const answeredCount = examState.answers.size

    if (examState.submitted) {
      const accuracy = Math.round((examState.score / examState.totalScore) * 100)
      return (
        <div className="space-y-6">
          <div className="text-center"><Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" /><h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">考试完成！</h1></div>
          <div className="card max-w-md mx-auto text-center">
            <div className="text-5xl lg:text-6xl font-bold text-blue-600 mb-2">{examState.score}</div>
            <div className="text-gray-500 dark:text-gray-400 mb-4">满分 {examState.totalScore}</div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div><div className="text-xl lg:text-2xl font-bold text-green-600">{accuracy}%</div><div className="text-sm text-gray-500">正确率</div></div>
              <div><div className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{answeredCount}/{examState.questions.length}</div><div className="text-sm text-gray-500">已答题</div></div>
            </div>
            <button onClick={() => setExamState(null)} className="btn-primary w-full">返回考试列表</button>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4 lg:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">模拟考试</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">已答 {answeredCount}/{examState.questions.length} 题</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-base lg:text-lg font-mono">
              <Clock className="w-5 h-5 text-red-500" />
              <span className={examState.timeLeft < 300 ? 'text-red-500' : 'text-gray-900 dark:text-white'}>{formatTime(examState.timeLeft)}</span>
            </div>
            <button onClick={submitExam} className="btn-danger text-sm">交卷</button>
          </div>
        </div>
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${((examState.currentIndex + 1) / examState.questions.length) * 100}%` }} /></div>
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          <div className="flex-1">
            <div className="card">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="badge badge-blue">第 {examState.currentIndex + 1} 题</span>
                <span className="badge badge-yellow">{DIFFICULTY_LABELS[q.difficulty]}</span>
              </div>
              <div className="text-base lg:text-lg text-gray-900 dark:text-white leading-relaxed mb-6 whitespace-pre-wrap">{q.content}</div>
              {options.length > 0 && (
                <div className="space-y-3 mb-6">
                  {options.map((opt: string, i: number) => {
                    const letter = String.fromCharCode(65 + i); const isSelected = selectedOptions.includes(letter)
                    return (
                      <button key={i} onClick={() => toggleOption(letter)} className={`w-full text-left p-3 lg:p-4 rounded-lg border-2 transition-colors ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'}`}>
                        <span className="font-medium mr-2">{letter}.</span><span className="text-sm lg:text-base text-gray-900 dark:text-white">{opt}</span>
                      </button>
                    )
                  })}
                </div>
              )}
              {['fill', 'essay', 'calculation'].includes(q.type) && (
                <textarea className="input-field h-28 lg:h-32 resize-none mb-6" value={userAnswer} onChange={e => setUserAnswer(e.target.value)} placeholder="请输入答案..." />
              )}
              <div className="flex items-center justify-between">
                <button onClick={() => goToQuestion(examState.currentIndex - 1)} disabled={examState.currentIndex === 0} className="btn-secondary disabled:opacity-50 text-sm">上一题</button>
                <button onClick={() => { saveAnswer(); if (examState.currentIndex < examState.questions.length - 1) goToQuestion(examState.currentIndex + 1) }} className="btn-primary text-sm">
                  {examState.currentIndex === examState.questions.length - 1 ? '完成' : '下一题'}
                </button>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-64">
            <div className="card">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">答题卡</h3>
              <div className="grid grid-cols-10 lg:grid-cols-5 gap-2">
                {examState.questions.map((_: any, i: number) => {
                  const answered = examState.answers.has(examState.questions[i].id)
                  return (
                    <button key={i} onClick={() => goToQuestion(i)} className={`w-9 h-9 rounded-lg text-xs font-medium transition-colors ${i === examState.currentIndex ? 'bg-blue-600 text-white' : answered ? 'bg-green-100 text-green-700 border border-green-300 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>{i + 1}</button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">模拟考试</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">模拟真实高考环境</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> 新建考试</button>
      </div>
      {showCreate && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">新建模拟考试</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">考试名称</label><input className="input-field" value={examName} onChange={e => setExamName(e.target.value)} placeholder="如：第一次模拟考试" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">科目</label><select className="input-field" value={subjectId || ''} onChange={e => setSubjectId(e.target.value ? Number(e.target.value) : null)}><option value="">全科综合</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">考试时长（分钟）</label><input type="number" className="input-field" value={duration} onChange={e => setDuration(Number(e.target.value))} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">题目数量</label><input type="number" className="input-field" value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))} /></div>
          </div>
          <div className="flex gap-3 mt-4"><button onClick={createExam} className="btn-primary">开始考试</button><button onClick={() => setShowCreate(false)} className="btn-secondary">取消</button></div>
        </div>
      )}
      {exams.length === 0 ? (
        <div className="card text-center py-12"><FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" /><p className="text-gray-500 dark:text-gray-400">还没有考试记录</p></div>
      ) : (
        <div className="space-y-3">
          {exams.map(exam => (
            <div key={exam.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{exam.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>{exam.subject_name || '全科'}</span><span>{exam.duration}分钟</span><span>{new Date(exam.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  {exam.status === 'completed' ? <div><div className="text-xl lg:text-2xl font-bold text-blue-600">{exam.score}分</div><span className="badge badge-green">已完成</span></div> : <span className="badge badge-blue">待开始</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
