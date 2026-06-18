import { useState, useEffect } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { db } from '../db'

const DEFAULT_PASSWORD = '2024'

export default function PasswordLock({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [savedPassword, setSavedPassword] = useState(DEFAULT_PASSWORD)

  useEffect(() => {
    db.getSetting('password').then(p => {
      if (p) setSavedPassword(p)
    })
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === savedPassword) {
      db.setSetting('lastAuth', Date.now())
      onUnlock()
    } else {
      setError('密码错误，请重试')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">高三复习系统</h1>
          <p className="text-blue-200 mt-1">重庆专版 · 请输入密码</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 text-center text-lg tracking-widest"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="请输入访问密码"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <p className="text-red-300 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-white text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
          >
            进入系统
          </button>
        </form>

        <p className="text-center text-blue-200/50 text-xs mt-6">
          默认密码：{DEFAULT_PASSWORD}
        </p>
      </div>
    </div>
  )
}
