import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { db } from '../db'
import { Play, Pause, Square, Clock, Flame, BookOpen, PenTool, RotateCcw } from 'lucide-react'

export default function StudyTimer() {
  const { subjects } = useStore()
  const [subjectId, setSubjectId] = useState<number | null>(null)
  const [sessionType, setSessionType] = useState<'study' | 'practice' | 'review'>('study')
  const [isRunning, setIsRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [todayMinutes, setTodayMinutes] = useState(0)
  const [streak, setStreak] = useState(0)
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  const intervalRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    loadStats()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const loadStats = async () => {
    setTodayMinutes(Math.round(await db.getTodayStudyMinutes()))
    setStreak(await db.getStudyStreak())
    const sessions = await db.getStudySessions(7)
    const subjects = await db.getSubjects()
    setRecentSessions(sessions.slice(0, 10).map(s => ({
      ...s,
      subject_name: subjects.find(sub => sub.id === s.subject_id)?.name || '综合'
    })))
  }

  const startTimer = async () => {
    const id = await db.startStudySession(subjectId, sessionType)
    setSessionId(id as number)
    setIsRunning(true)
    startTimeRef.current = Date.now()
    intervalRef.current = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
  }

  const pauseTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsRunning(false)
  }

  const resumeTimer = () => {
    startTimeRef.current = Date.now() - elapsed * 1000
    intervalRef.current = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
    setIsRunning(true)
  }

  const stopTimer = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (sessionId && elapsed > 0) {
      await db.endStudySession(sessionId, elapsed)
    }
    setIsRunning(false)
    setElapsed(0)
    setSessionId(null)
    loadStats()
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const sessionTypes = [
    { key: 'study' as const, label: '自习', icon: BookOpen, color: 'bg-blue-500' },
    { key: 'practice' as const, label: '刷题', icon: PenTool, color: 'bg-green-500' },
    { key: 'review' as const, label: '复习', icon: RotateCcw, color: 'bg-purple-500' },
  ]

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">学习计时</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">记录学习时长，养成学习习惯</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:gap-4">
        <div className="card text-center">
          <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayMinutes}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">今日学习（分钟）</p>
        </div>
        <div className="card text-center">
          <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{streak}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">连续学习（天）</p>
        </div>
      </div>

      <div className="card">
        <div className="text-center mb-6">
          <div className="text-5xl lg:text-6xl font-mono font-bold text-gray-900 dark:text-white mb-4">
            {formatTime(elapsed)}
          </div>
          <div className="w-full max-w-xs mx-auto h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, (elapsed / 3600) * 100)}%` }}
            />
          </div>
        </div>

        {!isRunning && elapsed === 0 && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">学习类型</label>
              <div className="grid grid-cols-3 gap-2">
                {sessionTypes.map(({ key, label, icon: Icon, color }) => (
                  <button
                    key={key}
                    onClick={() => setSessionType(key)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      sessionType === key
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mx-auto mb-1 ${sessionType === key ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className={`text-xs ${sessionType === key ? 'text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-500'}`}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">科目</label>
              <select className="input-field" value={subjectId || ''} onChange={e => setSubjectId(e.target.value ? Number(e.target.value) : null)}>
                <option value="">综合学习</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <button onClick={startTimer} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              <Play className="w-5 h-5" /> 开始计时
            </button>
          </>
        )}

        {isRunning && (
          <div className="flex gap-3">
            <button onClick={pauseTimer} className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3">
              <Pause className="w-5 h-5" /> 暂停
            </button>
            <button onClick={stopTimer} className="btn-danger flex-1 flex items-center justify-center gap-2 py-3">
              <Square className="w-5 h-5" /> 结束
            </button>
          </div>
        )}

        {!isRunning && elapsed > 0 && (
          <div className="flex gap-3">
            <button onClick={resumeTimer} className="btn-primary flex-1 flex items-center justify-center gap-2 py-3">
              <Play className="w-5 h-5" /> 继续
            </button>
            <button onClick={stopTimer} className="btn-success flex-1 flex items-center justify-center gap-2 py-3">
              <Square className="w-5 h-5" /> 保存并结束
            </button>
          </div>
        )}
      </div>

      {recentSessions.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">最近学习记录</h3>
          <div className="space-y-2">
            {recentSessions.map(s => (
              <div key={s.id} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{s.subject_name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    {s.session_type === 'study' ? '自习' : s.session_type === 'practice' ? '刷题' : '复习'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{Math.round(s.duration / 60)}分钟</span>
                  <span className="text-xs text-gray-400 ml-2">{new Date(s.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
