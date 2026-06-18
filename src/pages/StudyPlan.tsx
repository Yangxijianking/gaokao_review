import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { db } from '../db'
import { StudyPlan as PlanType } from '../types'
import { Calendar, Plus, Target, Clock, ChevronDown, ChevronRight } from 'lucide-react'

export default function StudyPlan() {
  const { subjects } = useStore()
  const [plans, setPlans] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [subjectId, setSubjectId] = useState<number | null>(null)
  const [description, setDescription] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [expandedPlan, setExpandedPlan] = useState<number | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskCount, setNewTaskCount] = useState(10)

  useEffect(() => { loadPlans() }, [])

  const loadPlans = async () => { setPlans(await db.getStudyPlans()) }

  const createPlan = async () => {
    if (!title) { alert('请输入计划名称'); return }
    await db.createStudyPlan({ title, subject_id: subjectId, description, target_date: targetDate })
    setTitle(''); setDescription(''); setTargetDate(''); setShowCreate(false); loadPlans()
  }

  const addTask = async (planId: number) => {
    if (!newTaskTitle) return
    await db.createPlanTask({ plan_id: planId, title: newTaskTitle, task_type: 'practice', target_count: newTaskCount, due_date: targetDate })
    setNewTaskTitle(''); loadPlans()
  }

  const getProgress = (plan: any) => plan.total_tasks ? Math.round(((plan.done_tasks || 0) / plan.total_tasks) * 100) : 0
  const getDaysLeft = (date: string | null) => date ? Math.ceil((new Date(date).getTime() - Date.now()) / 86400000) : null

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">学习计划</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">制定并追踪复习进度</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> 新建计划</button>
      </div>
      {showCreate && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">新建学习计划</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">计划名称</label><input className="input-field" value={title} onChange={e => setTitle(e.target.value)} placeholder="如：数学函数专题突破" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">科目</label><select className="input-field" value={subjectId || ''} onChange={e => setSubjectId(e.target.value ? Number(e.target.value) : null)}><option value="">全科</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">目标日期</label><input type="date" className="input-field" value={targetDate} onChange={e => setTargetDate(e.target.value)} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">描述</label><input className="input-field" value={description} onChange={e => setDescription(e.target.value)} placeholder="可选" /></div>
          </div>
          <div className="flex gap-3 mt-4"><button onClick={createPlan} className="btn-primary">创建</button><button onClick={() => setShowCreate(false)} className="btn-secondary">取消</button></div>
        </div>
      )}
      {plans.length === 0 ? (
        <div className="card text-center py-12"><Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" /><p className="text-gray-500 dark:text-gray-400">还没有学习计划</p></div>
      ) : (
        <div className="space-y-3">
          {plans.map(plan => {
            const progress = getProgress(plan); const daysLeft = getDaysLeft(plan.target_date)
            return (
              <div key={plan.id} className="card">
                <div className="cursor-pointer" onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{plan.title}</h3>
                        {plan.subject_name && <span className="badge badge-blue">{plan.subject_name}</span>}
                        {daysLeft !== null && <span className={`badge ${daysLeft < 7 ? 'badge-red' : 'badge-green'}`}>{daysLeft > 0 ? `剩${daysLeft}天` : '已到期'}</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {plan.done_tasks || 0}/{plan.total_tasks || 0} 任务</span>
                        {plan.target_date && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {plan.target_date}</span>}
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1"><span className="text-gray-500">进度</span><span className="font-medium text-gray-900 dark:text-white">{progress}%</span></div>
                        <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
                      </div>
                    </div>
                    <div className="ml-3">{expandedPlan === plan.id ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}</div>
                  </div>
                </div>
                {expandedPlan === plan.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2">
                      <input className="input-field flex-1" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="添加任务..." />
                      <input type="number" className="input-field w-20" value={newTaskCount} onChange={e => setNewTaskCount(Number(e.target.value))} />
                      <button onClick={() => addTask(plan.id)} className="btn-primary text-sm">添加</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
