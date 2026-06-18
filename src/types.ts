export interface Subject {
  id: number
  name: string
  icon: string
}

export interface Question {
  id: number
  subject_id: number
  knowledge_point_id: number | null
  type: 'single' | 'multi' | 'judge' | 'fill' | 'essay' | 'calculation'
  difficulty: number
  content: string
  options: string | null
  answer: string
  explanation: string | null
  source: string | null
  year: number | null
  region: string | null
  created_at: string
}

export interface PracticeRecord {
  id: number
  question_id: number
  user_answer: string
  is_correct: number
  time_spent: number | null
  practiced_at: string
}

export interface Mistake {
  id: number
  question_id: number
  user_answer: string | null
  error_type: string | null
  note: string | null
  mastered: number
  review_count: number
  last_review: string | null
  added_at: string
  content?: string
  correct_answer?: string
  explanation?: string
  type?: string
  subject_id?: number
  subject_name?: string
}

export interface MockExam {
  id: number
  name: string
  subject_id: number | null
  total_score: number
  duration: number
  status: 'pending' | 'in_progress' | 'completed'
  score: number | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  subject_name?: string
}

export interface StudyPlan {
  id: number
  title: string
  subject_id: number | null
  description: string | null
  target_date: string | null
  status: 'active' | 'completed' | 'cancelled'
  created_at: string
  subject_name?: string
  total_tasks?: number
  done_tasks?: number
}

export interface PlanTask {
  id: number
  plan_id: number
  title: string
  task_type: string | null
  target_count: number
  completed_count: number
  due_date: string | null
  status: 'pending' | 'in_progress' | 'completed'
}

export interface DailyStat {
  id: number
  date: string
  subject_id: number
  questions_done: number
  correct_count: number
  time_spent: number
  subject_name?: string
}

export interface KnowledgePoint {
  id: number
  subject_id: number
  chapter: string
  section: string | null
  title: string
  content: string | null
  importance: number
  subject_name?: string
}

export interface StudySession {
  id?: number
  subject_id: number | null
  start_time: string
  end_time: string | null
  duration: number
  session_type: 'study' | 'practice' | 'review'
  note: string
  created_at: string
}

export interface WeeklyReport {
  weekStart: string
  weekEnd: string
  totalStudyMinutes: number
  totalQuestions: number
  totalCorrect: number
  accuracy: number
  studyDays: number
  dailyBreakdown: { date: string; minutes: number; questions: number; correct: number }[]
  subjectBreakdown: { name: string; minutes: number; questions: number; accuracy: number }[]
}

export type QuestionType = Question['type']

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  single: '单选题',
  multi: '多选题',
  judge: '判断题',
  fill: '填空题',
  essay: '解答题',
  calculation: '计算题'
}

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: '基础',
  2: '简单',
  3: '中等',
  4: '较难',
  5: '困难'
}

export const SUBJECT_COLORS: Record<string, string> = {
  '语文': '#ef4444',
  '数学': '#3b82f6',
  '英语': '#22c55e',
  '物理': '#f59e0b',
  '化学': '#8b5cf6',
  'biology': '#ec4899'
}
