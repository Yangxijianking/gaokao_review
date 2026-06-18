import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { db } from '../db'
import { Mistake } from '../types'
import { AlertCircle, CheckCircle2, RotateCcw, Eye, Star } from 'lucide-react'

export default function Mistakes() {
  const { subjects } = useStore()
  const [mistakes, setMistakes] = useState<Mistake[]>([])
  const [subjectId, setSubjectId] = useState<number | null>(null)
  const [showMastered, setShowMastered] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'review'>('list')

  useEffect(() => { loadMistakes() }, [subjectId, showMastered])

  const loadMistakes = async () => {
    const filters: any = { mastered: showMastered ? 1 : 0 }
    if (subjectId) filters.subject_id = subjectId
    setMistakes(await db.getMistakes(filters))
    setCurrentIndex(0); setShowAnswer(false)
  }

  const markMastered = async (id: number) => { await db.updateMistake(id, { mastered: 1 }); loadMistakes() }
  const markUnmastered = async (id: number) => { await db.updateMistake(id, { mastered: 0 }); loadMistakes() }

  const startReview = () => { if (mistakes.length === 0) return; setViewMode('review'); setCurrentIndex(0); setShowAnswer(false) }
  const nextMistake = () => { if (currentIndex < mistakes.length - 1) { setCurrentIndex(prev => prev + 1); setShowAnswer(false) } }
  const prevMistake = () => { if (currentIndex > 0) { setCurrentIndex(prev => prev - 1); setShowAnswer(false) } }

  const currentMistake = mistakes[currentIndex]

  if (viewMode === 'review' && currentMistake) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">错题复习</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">第 {currentIndex + 1}/{mistakes.length} 题</p>
          </div>
          <button onClick={() => setViewMode('list')} className="btn-secondary text-sm">返回列表</button>
        </div>
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${((currentIndex + 1) / mistakes.length) * 100}%` }} /></div>
        <div className="card">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="badge badge-blue">{currentMistake.subject_name}</span>
            <span className="badge badge-red">错题</span>
            {currentMistake.error_type && <span className="badge badge-yellow">{currentMistake.error_type}</span>}
          </div>
          <div className="text-base lg:text-lg text-gray-900 dark:text-white leading-relaxed mb-6 whitespace-pre-wrap">{currentMistake.content}</div>
          {currentMistake.user_answer && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg mb-4">
              <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">你的答案：</p>
              <p className="text-red-700 dark:text-red-400">{currentMistake.user_answer}</p>
            </div>
          )}
          {showAnswer && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg mb-4">
              <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">正确答案：</p>
              <p className="text-green-700 dark:text-green-400">{currentMistake.correct_answer}</p>
              {currentMistake.explanation && (
                <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">解析：</p>
                  <p className="text-green-700 dark:text-green-400 whitespace-pre-wrap">{currentMistake.explanation}</p>
                </div>
              )}
            </div>
          )}
          <div className="flex items-center justify-between">
            <button onClick={prevMistake} disabled={currentIndex === 0} className="btn-secondary disabled:opacity-50 text-sm">上一题</button>
            <div className="flex gap-3">
              {!showAnswer ? (
                <button onClick={() => setShowAnswer(true)} className="btn-primary flex items-center gap-2 text-sm"><Eye className="w-4 h-4" /> 查看答案</button>
              ) : (
                <>
                  <button onClick={() => { markMastered(currentMistake.id); nextMistake() }} className="btn-success flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4" /> 已掌握</button>
                  <button onClick={nextMistake} className="btn-primary text-sm">下一题</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">错题本</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">共 {mistakes.length} 道{showMastered ? '已掌握' : '待复习'}错题</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowMastered(!showMastered)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${showMastered ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
            {showMastered ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {showMastered ? '已掌握' : '待复习'}
          </button>
          <button onClick={startReview} className="btn-primary flex items-center gap-2 text-sm" disabled={mistakes.length === 0}><RotateCcw className="w-4 h-4" /> 开始复习</button>
        </div>
      </div>
      <select className="input-field w-full sm:w-48" value={subjectId || ''} onChange={e => setSubjectId(e.target.value ? Number(e.target.value) : null)}>
        <option value="">全部科目</option>
        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      {mistakes.length === 0 ? (
        <div className="card text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{showMastered ? '还没有已掌握的错题' : '太棒了，没有待复习的错题！'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mistakes.map(m => (
            <div key={m.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="badge badge-blue">{m.subject_name}</span>
                    <span className="badge badge-red">错{m.review_count + 1}次</span>
                    {m.error_type && <span className="badge badge-yellow">{m.error_type}</span>}
                  </div>
                  <p className="text-gray-900 dark:text-white line-clamp-2 text-sm mb-2">{m.content}</p>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(m.added_at).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2 ml-3">
                  {showMastered ? (
                    <button onClick={() => markUnmastered(m.id)} className="p-2 text-gray-400 hover:text-yellow-500" title="标记为未掌握"><Star className="w-5 h-5" /></button>
                  ) : (
                    <button onClick={() => markMastered(m.id)} className="p-2 text-gray-400 hover:text-green-500" title="标记为已掌握"><CheckCircle2 className="w-5 h-5" /></button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
