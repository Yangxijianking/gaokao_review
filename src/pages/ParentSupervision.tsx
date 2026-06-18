import { useState, useEffect } from 'react'
import { db } from '../db'
import { WeeklyReport } from '../types'
import { BarChart3, Clock, Target, Calendar, Download, Share2, TrendingUp, Flame } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function ParentSupervision() {
  const [report, setReport] = useState<WeeklyReport | null>(null)
  const [todayMinutes, setTodayMinutes] = useState(0)
  const [streak, setStreak] = useState(0)
  const [totalStats, setTotalStats] = useState({ questions: 0, correct: 0, time: 0 })
  const [copied, setCopied] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const [r, tm, st, ss] = await Promise.all([
      db.generateWeeklyReport(),
      db.getTodayStudyMinutes(),
      db.getStudyStreak(),
      db.getSubjectStats()
    ])
    setReport(r)
    setTodayMinutes(Math.round(tm))
    setStreak(st)
    setTotalStats({
      questions: ss.reduce((s, x) => s + x.total_questions, 0),
      correct: ss.reduce((s, x) => s + x.total_correct, 0),
      time: ss.reduce((s, x) => s + x.total_time, 0)
    })
  }

  const copyReport = async () => {
    const text = await db.exportWeeklyReportText()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const overallAccuracy = totalStats.questions > 0 ? Math.round((totalStats.correct / totalStats.questions) * 100) : 0

  const dayNames = ['一', '二', '三', '四', '五', '六', '日']

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">家长监督</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">学习数据统计与周报</p>
        </div>
        <button
          onClick={copyReport}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          {copied ? <Target className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          {copied ? '已复制' : '复制周报'}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[
          { icon: Clock, label: '今日学习', value: `${todayMinutes}分`, color: 'blue' },
          { icon: Flame, label: '连续天数', value: `${streak}天`, color: 'orange' },
          { icon: Target, label: '总正确率', value: `${overallAccuracy}%`, color: 'green' },
          { icon: BarChart3, label: '总做题量', value: totalStats.questions, color: 'purple' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card">
            <div className="flex items-center gap-2">
              <div className={`w-9 h-9 bg-${color}-100 dark:bg-${color}-900/30 rounded-lg flex items-center justify-center`}>
                <Icon className={`w-4 h-4 text-${color}-600 dark:text-${color}-400`} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {report && (
        <>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">本周学习周报</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">{report.weekStart} ~ {report.weekEnd}</span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{report.totalStudyMinutes}</p>
                <p className="text-xs text-gray-500">学习分钟</p>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{report.totalQuestions}</p>
                <p className="text-xs text-gray-500">做题数量</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{report.accuracy}%</p>
                <p className="text-xs text-gray-500">正确率</p>
              </div>
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{report.studyDays}/7</p>
                <p className="text-xs text-gray-500">学习天数</p>
              </div>
            </div>

            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">每日学习时长</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={report.dailyBreakdown.map((d, i) => ({ ...d, day: dayNames[i] }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: 12 }} />
                <Bar dataKey="minutes" fill="#3b82f6" radius={[4, 4, 0, 0]} name="学习分钟" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">每日做题量</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={report.dailyBreakdown.map((d, i) => ({ ...d, day: dayNames[i] }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: 12 }} />
                  <Bar dataKey="questions" fill="#22c55e" radius={[4, 4, 0, 0]} name="做题数" />
                  <Bar dataKey="correct" fill="#86efac" radius={[4, 4, 0, 0]} name="正确数" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">科目分布</h3>
              {report.subjectBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={report.subjectBreakdown} cx="50%" cy="50%" outerRadius={70} dataKey="minutes" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {report.subjectBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">暂无数据</div>
              )}
            </div>
          </div>

          {report.subjectBreakdown.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">科目详情</h3>
              <div className="space-y-2">
                {report.subjectBreakdown.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>{s.minutes}分钟</span>
                      <span>{s.questions}题</span>
                      <span className={s.accuracy >= 80 ? 'text-green-600' : s.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'}>{s.accuracy}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">周报预览（可复制发给家长）</h3>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
              {`📊 高三学习周报
📅 ${report.weekStart} ~ ${report.weekEnd}

📈 本周概览
• 学习时长：${report.totalStudyMinutes} 分钟
• 做题数量：${report.totalQuestions} 道
• 正确率：${report.accuracy}%
• 学习天数：${report.studyDays}/7 天

📅 每日明细
${report.dailyBreakdown.map((d, i) => `• 周${dayNames[i]} ${d.date.slice(5)}：${d.minutes}分钟 | ${d.questions}题 | ${d.correct}正确`).join('\n')}

${report.subjectBreakdown.length > 0 ? `📚 科目分布\n${report.subjectBreakdown.map(s => `• ${s.name}：${s.minutes}分钟 | ${s.questions}题 | ${s.accuracy}%`).join('\n')}` : ''}

💪 继续加油！`}
            </div>
            <button onClick={copyReport} className="btn-secondary w-full mt-3 flex items-center justify-center gap-2 text-sm">
              <Download className="w-4 h-4" /> {copied ? '已复制到剪贴板' : '复制周报内容'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
