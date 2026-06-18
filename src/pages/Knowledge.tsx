import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { db } from '../db'
import { KnowledgePoint } from '../types'
import { BookOpen, ChevronDown, ChevronRight, Star } from 'lucide-react'

export default function Knowledge() {
  const { subjects } = useStore()
  const [points, setPoints] = useState<KnowledgePoint[]>([])
  const [subjectId, setSubjectId] = useState<number | null>(null)
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null)

  useEffect(() => { loadPoints() }, [subjectId])

  const loadPoints = async () => {
    setPoints(await db.getKnowledgePoints(subjectId || undefined))
  }

  const chapters = points.reduce<Record<string, KnowledgePoint[]>>((acc, p) => {
    const key = `${p.chapter}${p.section ? ` - ${p.section}` : ''}`
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})

  const importanceStars = (n: number) => Array.from({ length: n }, (_, i) => (
    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
  ))

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">知识点复习</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">按章节浏览知识点</p>
      </div>
      <select className="input-field w-full sm:w-48" value={subjectId || ''} onChange={e => setSubjectId(e.target.value ? Number(e.target.value) : null)}>
        <option value="">全部科目</option>
        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      {Object.keys(chapters).length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">暂无知识点数据</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">可在题库管理中添加知识点</p>
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(chapters).map(([chapter, kps]) => (
            <div key={chapter} className="card">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedChapter(expandedChapter === chapter ? null : chapter)}>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white text-sm">{chapter}</span>
                  <span className="badge badge-blue">{kps.length}个</span>
                </div>
                {expandedChapter === chapter ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
              </div>
              {expandedChapter === chapter && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  {kps.map(kp => (
                    <div key={kp.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{kp.title}</span>
                        <div className="flex items-center gap-0.5">{importanceStars(kp.importance)}</div>
                      </div>
                      {kp.content && <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{kp.content}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
