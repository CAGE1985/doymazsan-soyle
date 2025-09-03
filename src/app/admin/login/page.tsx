'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

// Basit hash fonksiyonu (demo amaçlı)
const simpleHash = (str: string): string => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 32bit integer'a dönüştür
  }
  return hash.toString()
}

// SHA-256 hash fonksiyonu
const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export default function AdminLogin() {
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!supabase) {
        setError('Veritabanı bağlantısı mevcut değil')
        setLoading(false)
        return
      }
      
      // Veritabanından admin kullanıcısını kontrol et
      const { data: adminUser, error: dbError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', credentials.username)
        .single()

      if (dbError || !adminUser) {
        setError('Geçersiz kullanıcı adı veya şifre')
        setLoading(false)
        return
      }

      // Şifre kontrolü - hem eski hash hem de yeni hash ile kontrol et
      const oldPasswordHash = simpleHash(credentials.password)
      const newPasswordHash = hashPassword(credentials.password)
      
      const isPasswordValid = adminUser.password_hash === oldPasswordHash || 
                             adminUser.password_hash === newPasswordHash
      
      if (!isPasswordValid) {
        setError('Geçersiz kullanıcı adı veya şifre')
        setLoading(false)
        return
      }

      // Başarılı giriş - session storage'a token kaydet
      const token = btoa(`${credentials.username}:${Date.now()}`)
      sessionStorage.setItem('admin_token', token)
      sessionStorage.setItem('admin_login_time', Date.now().toString())
      sessionStorage.setItem('admin_user_id', adminUser.id.toString())
      
      // Admin paneline yönlendir
      router.push('/admin')
      
    } catch (error) {
      console.error('Giriş hatası:', error)
      setError('Giriş sırasında bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20"
      >
        {/* Logo ve Başlık */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-20 h-20 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <span className="text-3xl">🔐</span>
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-2">Yönetici Girişi</h1>
          <p className="text-gray-300 text-sm">Doymazsan Söyle Admin Paneli</p>
        </div>

        {/* Giriş Formu */}
        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent backdrop-blur-sm"
              placeholder="Kullanıcı adınızı girin"
              required
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Şifre
            </label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent backdrop-blur-sm"
              placeholder="Şifrenizi girin"
              required
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-orange-600 to-yellow-600 text-white py-3 rounded-lg font-bold text-lg hover:from-orange-700 hover:to-yellow-700 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Giriş yapılıyor...</span>
              </div>
            ) : (
              'Giriş Yap'
            )}
          </motion.button>
        </form>

        {/* Ana Sayfaya Dön */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-gray-300 hover:text-white text-sm transition-colors duration-300"
          >
            ← Ana Sayfaya Dön
          </button>
        </div>


      </motion.div>
    </div>
  )
}