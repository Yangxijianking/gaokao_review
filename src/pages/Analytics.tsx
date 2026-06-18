import { useState, useEffect } from 'react'
import { db } from '../db'
import { TrendingUp, Clock, Target, BookOpen } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899']

export default function Analytics() {
  const [subjectStats, setSubjectStats] = useState<any[]>([])
  const [dailyStats, setDailyStats] = useState<any[]>([])
  const [accuracy, setAccuracy] = useState<any[]>([])
  const [weakPoints, setWeakPoints] = useState<any[]>([])
  const [period, setPeriod] = useState(30)

  useEffect(() => { loadData() }, [period])

  const loadData = async () => {
    const [stats, daily, acc, weak] = await Promise.all([
      db.getSubjectStats(), db.getDailyStats(period), db.getRecentAccuracy(period), db.getWeakPoints()
    ])
    setSubjectStats(stats)
    setDailyStats(daily.reduce((acc: any[], d: any) => {
      const existing = acc.find(a => a.date === d.date)
      if (existing) { existing.questions_done += d.questions_done; existing.correct_count += d.correct_count; existing.time_spent += d.time_spent }
      else acc.push({ ...d, date: d.date.slice(5) })
      return acc
    }, []))
    setAccuracy(acc.map((d: any) => ({ ...d, date: d.date.slice(5), accuracy: d.accuracy || 0 })))
    setWeakPoints(weak)
  }

  const totalQuestions = subjectStats.reduce((s, x) => s + x.total_questions, 0)
  const totalCorrect = subjectStats.reduce((s, x) => s + x.total_correct, 0)
  const totalTime = subjectStats.reduce((s, x) => s + x.total_time, 0)
  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
  const pieData = subjectStats.filter(s => s.total_questions > 0).map((s, i) => ({ name: s.name, value: s.total_questions, color: COLORS[i % COLORS.length] }))
  const radarData = subjectStats.map(s => ({ subject: s.name, accuracy: s.total_questions > 0 ? Math.round((s.total_correct / s.total_questions) * 100) : 0 }))

  const tooltipStyle = { borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: 12 }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">成绩分析</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">全方位学习数据洞察</p>
        </div>
        <select className="input-field w-28 text-sm" value={period} onChange={e => setPeriod(Number(e.target.value))}>
          <option value={7}>近7天</option><option value={14}>近14天</option><option value={30}>近30天</option><option value={90}>近90天</option>
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[
          { icon: BookOpen, label: '总做题量', value: totalQuestions, color: 'blue' },
          { icon: Target, label: '总正确率', value: `${overallAccuracy}%`, color: 'green' },
          { icon: Clock, label: '学习时长', value: `${Math.round(totalTime / 60)}分`, color: 'purple' },
          { icon: TrendingUp, label: '科目覆盖', value: `${subjectStats.filter(s => s.total_questions > 0).length}/6`, color: 'yellow' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card">
            <div className="flex items-center gap-2">
              <div className={`w-9 h-9 bg-${color}-100 dark:bg-${color}-900/30 rounded-lg flex items-center justify-center`}>
                <Icon className={`w-4 h-4 text-${color}-600 dark:text-${color}-400`} />
              </div>
              <div><p className="text-xs text-gray-500 dark:text-gray-400">{label}</p><p className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">{value}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">正确率趋势</h3>
          {accuracy.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}><LineChart data={accuracy}><CartesianGrid strokeDasharray="3 3" stroke="#374151" /><XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" /><YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#9ca3af" /><Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, '正确率']} /><Line type="monotone" dataKey="accuracy" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} /></LineChart></ResponsiveContainer>
          ) : <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">暂无数据</div>}
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">每日做题量</h3>
          {dailyStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}><BarChart data={dailyStats}><CartesianGrid strokeDasharray="3 3" stroke="#374151" /><XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" /><YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="questions_done" fill="#3b82f6" radius={[4, 4, 0, 0]} name="做题数" /><Bar dataKey="correct_count" fill="#22c55e" radius={[4, 4, 0, 0]} name="正确数" /></BarChart></ResponsiveContainer>
          ) : <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">暂无数据</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">各科占比</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart></ResponsiveContainer>
          ) : <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">暂无数据</div>}
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">能力雷达</h3>
          {radarData.some(d => d.accuracy > 0) ? (
            <ResponsiveContainer width="100%" height={220}><RadarChart data={radarData}><PolarGrid /><PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} /><PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} /><Radar name="正确率" dataKey="accuracy" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} /><Tooltip contentStyle={tooltipStyle} /></RadarChart></ResponsiveContainer>
          ) : <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">暂无数据</div>}
        </div>
      </div>

      {weakPoints.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">薄弱知识点 TOP10</h3>
          <div className="space-y-2">
            {weakPoints.map((wp, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{wp.title}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{wp.chapter} · {wp.subject_name}</span>
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
