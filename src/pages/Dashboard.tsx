import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db'
import {
  PenTool, AlertCircle, FileText, Calendar, Clock,
  Target, CheckCircle2, ArrowRight, Flame
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<any[]>([])
  const [accuracy, setAccuracy] = useState<any[]>([])
  const [weakPoints, setWeakPoints] = useState<any[]>([])
  const [mistakeCount, setMistakeCount] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [totalCorrect, setTotalCorrect] = useState(0)
  const [todayMinutes, setTodayMinutes] = useState(0)
  const [streak, setStreak] = useState(0)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const [subjectStats, recentAccuracy, weak, mistakes, tm, st] = await Promise.all([
      db.getSubjectStats(), db.getRecentAccuracy(14), db.getWeakPoints(), db.getMistakeCount(),
      db.getTodayStudyMinutes(), db.getStudyStreak()
    ])
    setStats(subjectStats)
    setAccuracy(recentAccuracy.map((d: any) => ({ ...d, date: d.date.slice(5), accuracy: d.accuracy || 0 })))
    setWeakPoints(weak)
    setMistakeCount(mistakes)
    setTodayMinutes(Math.round(tm))
    setStreak(st)
    const totalQ = subjectStats.reduce((sum: number, s: any) => sum + s.total_questions, 0)
    const totalC = subjectStats.reduce((sum: number, s: any) => sum + s.total_correct, 0)
    setTotalQuestions(totalQ)
    setTotalCorrect(totalC)
  }

  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

  const quickActions = [
    { icon: PenTool, label: '开始刷题', path: '/practice', color: 'bg-blue-500' },
    { icon: Clock, label: '学习计时', path: '/timer', color: 'bg-indigo-500' },
    { icon: AlertCircle, label: '复习错题', path: '/mistakes', color: 'bg-red-500' },
    { icon: FileText, label: '模拟考试', path: '/exam', color: 'bg-purple-500' },
    { icon: Calendar, label: '学习计划', path: '/plan', color: 'bg-green-500' },
  ]

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">学习概览</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">今日学习情况一目了然</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[
          { icon: Clock, label: '今日学习', value: `${todayMinutes}分`, color: 'indigo' },
          { icon: Flame, label: '连续天数', value: `${streak}天`, color: 'orange' },
          { icon: Target, label: '正确率', value: `${overallAccuracy}%`, color: 'green' },
          { icon: AlertCircle, label: '待复习错题', value: mistakeCount, color: 'red' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className={`w-9 h-9 lg:w-10 lg:h-10 bg-${color}-100 dark:bg-${color}-900/30 rounded-lg flex items-center justify-center`}>
                <Icon className={`w-4 h-4 lg:w-5 lg:h-5 text-${color}-600 dark:text-${color}-400`} />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {quickActions.map(({ icon: Icon, label, path, color }) => (
          <button key={path} onClick={() => navigate(path)} className="card hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className={`w-10 h-10 lg:w-12 lg:h-12 ${color} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform`}>
                <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm lg:text-base font-medium text-gray-900 dark:text-white">{label}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">近14天正确率趋势</h3>
          {accuracy.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={accuracy}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} formatter={(v: number) => [`${v}%`, '正确率']} />
                <Line type="monotone" dataKey="accuracy" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">暂无数据，开始刷题后查看</div>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">各科做题量</h3>
          {stats.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
                <Bar dataKey="total_questions" fill="#3b82f6" radius={[4, 4, 0, 0]} name="做题数" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">暂无数据</div>
          )}
        </div>
      </div>

      {weakPoints.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">薄弱知识点</h3>
          <div className="space-y-2">
            {weakPoints.slice(0, 5).map((wp, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{wp.title}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{wp.chapter}</span>
                </div>
                <span className="badge badge-red">错{wp.mistake_count}次</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
