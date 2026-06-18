import { useEffect, useState } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { useStore } from './store'
import {
  LayoutDashboard, BookOpen, PenTool, AlertCircle,
  FileText, Calendar, BarChart3, GraduationCap,
  Sun, Moon, Menu, X, LogOut, Clock, Users
} from 'lucide-react'
import PasswordLock from './components/PasswordLock'
import Dashboard from './pages/Dashboard'
import Practice from './pages/Practice'
import Mistakes from './pages/Mistakes'
import MockExam from './pages/MockExam'
import StudyPlan from './pages/StudyPlan'
import Analytics from './pages/Analytics'
import Knowledge from './pages/Knowledge'
import QuestionBank from './pages/QuestionBank'
import StudyTimer from './pages/StudyTimer'
import ParentSupervision from './pages/ParentSupervision'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '概览' },
  { path: '/practice', icon: PenTool, label: '刷题' },
  { path: '/timer', icon: Clock, label: '计时' },
  { path: '/knowledge', icon: BookOpen, label: '知识' },
  { path: '/mistakes', icon: AlertCircle, label: '错题' },
  { path: '/exam', icon: FileText, label: '考试' },
  { path: '/plan', icon: Calendar, label: '计划' },
  { path: '/analytics', icon: BarChart3, label: '分析' },
  { path: '/parent', icon: Users, label: '监督' },
  { path: '/bank', icon: GraduationCap, label: '题库' },
]

export default function App() {
  const { loadSubjects, authenticated, setAuthenticated, darkMode, toggleDarkMode, initTheme } = useStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    initTheme()
    loadSubjects()
  }, [])

  useEffect(() => {
    setSidebarOpen(false)
  }, [location])

  if (!authenticated) {
    return <PasswordLock onUnlock={() => setAuthenticated(true)} />
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 safe-area">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white">高三复习</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">重庆专版</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {darkMode ? '浅色模式' : '深色模式'}
          </button>
          <button
            onClick={() => { localStorage.removeItem('auth'); setAuthenticated(false) }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            锁定
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile sidebar drawer */}
      <aside className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white">高三复习</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">重庆专版</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-2 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button onClick={toggleDarkMode} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400">
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {darkMode ? '浅色模式' : '深色模式'}
          </button>
          <button onClick={() => { localStorage.removeItem('auth'); setAuthenticated(false) }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400">
            <LogOut className="w-5 h-5" />
            锁定
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 safe-top">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-600 dark:text-gray-300">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-gray-900 dark:text-white">高三复习</h1>
          <button onClick={toggleDarkMode} className="p-2 -mr-2 text-gray-600 dark:text-gray-300">
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 pb-20 lg:pb-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/practice" element={<Practice />} />
              <Route path="/timer" element={<StudyTimer />} />
              <Route path="/knowledge" element={<Knowledge />} />
              <Route path="/mistakes" element={<Mistakes />} />
              <Route path="/exam" element={<MockExam />} />
              <Route path="/plan" element={<StudyPlan />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/parent" element={<ParentSupervision />} />
              <Route path="/bank" element={<QuestionBank />} />
            </Routes>
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-bottom">
          <div className="flex justify-around">
            {navItems.slice(0, 6).map(({ path, icon: Icon, label }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex flex-col items-center py-2 px-2 text-xs transition-colors ${
                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                  }`
                }
              >
                <Icon className="w-5 h-5 mb-1" />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}
