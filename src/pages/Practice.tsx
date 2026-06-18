import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { db } from '../db'
import { Question, QUESTION_TYPE_LABELS, DIFFICULTY_LABELS } from '../types'
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Play, RotateCcw, Eye } from 'lucide-react'

export default function Practice() {
  const { subjects } = useStore()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [showAnswer, setShowAnswer] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [startTime, setStartTime] = useState(Date.now())
  const [subjectId, setSubjectId] = useState<number | null>(null)
  const [difficulty, setDifficulty] = useState<number | null>(null)
  const [questionType, setQuestionType] = useState('')
  const [count, setCount] = useState(10)
  const [started, setStarted] = useState(false)
  const [results, setResults] = useState({ correct: 0, total: 0 })

  const currentQuestion = questions[currentIndex]

  const startPractice = async () => {
    const filters: any = { limit: count }
    if (subjectId) filters.subject_id = subjectId
    if (difficulty) filters.difficulty = difficulty
    if (questionType) filters.type = questionType
    const qs = await db.getQuestions(filters)
    if (qs.length === 0) { alert('没有找到符合条件的题目，请先在题库管理中添加题目'); return }
    setQuestions(qs)
    setCurrentIndex(0); setUserAnswer(''); setSelectedOptions([]); setShowAnswer(false)
    setIsCorrect(null); setStartTime(Date.now()); setStarted(true); setResults({ correct: 0, total: 0 })
  }

  const toggleOption = (opt: string) => {
    if (showAnswer) return
    if (currentQuestion.type === 'single') setSelectedOptions([opt])
    else setSelectedOptions(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt])
  }

  const submitAnswer = async () => {
    if (showAnswer) return
    let answer = ''
    if (['single', 'multi', 'judge'].includes(currentQuestion.type)) answer = selectedOptions.sort().join(',')
    else answer = userAnswer.trim()
    if (!answer) { alert('请先作答'); return }
    const correct = answer === currentQuestion.answer
    const timeSpent = Math.round((Date.now() - startTime) / 1000)
    setIsCorrect(correct); setShowAnswer(true)
    setResults(prev => ({ correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 }))
    await db.submitAnswer({ question_id: currentQuestion.id, user_answer: answer, is_correct: correct ? 1 : 0, time_spent: timeSpent })
    if (!correct) await db.addMistake({ question_id: currentQuestion.id, user_answer: answer, error_type: 'practice', note: '' })
  }

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1); setUserAnswer(''); setSelectedOptions([])
      setShowAnswer(false); setIsCorrect(null); setStartTime(Date.now())
    }
  }

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1); setUserAnswer(''); setSelectedOptions([])
      setShowAnswer(false); setIsCorrect(null); setStartTime(Date.now())
    }
  }

  const parseOptions = (optionsStr: string | null): string[] => {
    if (!optionsStr) return []
    try { return JSON.parse(optionsStr) } catch { return optionsStr.split('\n').filter(Boolean) }
  }

  if (!started) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">刷题练习</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">选择条件开始练习</p>
        </div>
        <div className="card max-w-xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">科目</label>
              <select className="input-field" value={subjectId || ''} onChange={e => setSubjectId(e.target.value ? Number(e.target.value) : null)}>
                <option value="">全部科目</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">难度</label>
              <select className="input-field" value={difficulty || ''} onChange={e => setDifficulty(e.target.value ? Number(e.target.value) : null)}>
                <option value="">全部难度</option>
                {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">题型</label>
              <select className="input-field" value={questionType} onChange={e => setQuestionType(e.target.value)}>
                <option value="">全部题型</option>
                {Object.entries(QUESTION_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">题目数量</label>
              <select className="input-field" value={count} onChange={e => setCount(Number(e.target.value))}>
                <option value={5}>5题</option><option value={10}>10题</option>
                <option value={20}>20题</option><option value={50}>50题</option>
              </select>
            </div>
            <button onClick={startPractice} className="btn-primary w-full flex items-center justify-center gap-2">
              <Play className="w-4 h-4" /> 开始练习
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!currentQuestion) return null
  const options = parseOptions(currentQuestion.options)
  const progress = ((currentIndex + 1) / questions.length) * 100

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">刷题练习</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">第 {currentIndex + 1}/{questions.length} 题 | 正确 {results.correct}/{results.total}</p>
        </div>
        <button onClick={() => { setStarted(false); setQuestions([]) }} className="btn-secondary flex items-center gap-2 text-sm">
          <RotateCcw className="w-4 h-4" /> 重新开始
        </button>
      </div>
      <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="badge badge-blue">{QUESTION_TYPE_LABELS[currentQuestion.type]}</span>
          <span className="badge badge-yellow">{DIFFICULTY_LABELS[currentQuestion.difficulty]}</span>
          {currentQuestion.year && <span className="badge badge-green">{currentQuestion.year}年高考</span>}
        </div>
        <div className="text-base lg:text-lg text-gray-900 dark:text-white leading-relaxed mb-6 whitespace-pre-wrap">{currentQuestion.content}</div>

        {options.length > 0 && (
          <div className="space-y-3 mb-6">
            {options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i)
              const isSelected = selectedOptions.includes(letter)
              const isCorrectOpt = currentQuestion.answer.includes(letter)
              let optClass = 'border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30'
              if (showAnswer) {
                if (isCorrectOpt) optClass = 'border-green-500 bg-green-50 dark:bg-green-900/30'
                else if (isSelected && !isCorrectOpt) optClass = 'border-red-500 bg-red-50 dark:bg-red-900/30'
              } else if (isSelected) { optClass = 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' }
              return (
                <button key={i} onClick={() => toggleOption(letter)} className={`w-full text-left p-3 lg:p-4 rounded-lg border-2 transition-colors ${optClass}`} disabled={showAnswer}>
                  <span className="font-medium mr-2">{letter}.</span>
                  <span className="text-sm lg:text-base text-gray-900 dark:text-white">{opt}</span>
                </button>
              )
            })}
          </div>
        )}

        {['fill', 'essay', 'calculation'].includes(currentQuestion.type) && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">你的答案</label>
            <textarea className="input-field h-28 lg:h-32 resize-none" value={userAnswer} onChange={e => setUserAnswer(e.target.value)} placeholder="请输入你的答案..." disabled={showAnswer} />
          </div>
        )}

        {showAnswer && (
          <div className={`p-4 rounded-lg mb-6 ${isCorrect ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
              <span className={`font-medium ${isCorrect ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>{isCorrect ? '回答正确！' : '回答错误'}</span>
            </div>
            {!isCorrect && <p className="text-sm text-gray-700 dark:text-gray-300 mb-1"><span className="font-medium">正确答案：</span>{currentQuestion.answer}</p>}
            {currentQuestion.explanation && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">解析：</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{currentQuestion.explanation}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button onClick={prevQuestion} disabled={currentIndex === 0} className="btn-secondary flex items-center gap-2 disabled:opacity-50 text-sm">
            <ChevronLeft className="w-4 h-4" /> 上一题
          </button>
          {!showAnswer ? (
            <button onClick={submitAnswer} className="btn-primary flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4" /> 提交答案</button>
          ) : (
            <button onClick={currentIndex === questions.length - 1 ? () => { setStarted(false); setQuestions([]) } : nextQuestion} className="btn-primary flex items-center gap-2 text-sm">
              {currentIndex === questions.length - 1 ? '完成练习' : '下一题'} <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
