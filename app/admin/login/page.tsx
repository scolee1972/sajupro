'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!password) {
      setError('비밀번호를 입력하세요')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()

      if (data.success) {
        localStorage.setItem('admin_auth', 'true')
        localStorage.setItem('admin_auth_time', String(Date.now()))
        router.push('/admin')
      } else {
        setError(data.message || '비밀번호가 틀렸습니다')
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a2744 0%, #2d1b4e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'sans-serif',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontSize: '60px', marginBottom: '16px' }}>🔐</div>
        <h1 style={{ color: '#1a2744', marginBottom: '8px', fontSize: '24px' }}>
          관리자 로그인
        </h1>
        <p style={{ color: '#888', fontSize: '14px', marginBottom: '30px' }}>
          관리자 비밀번호를 입력하세요
        </p>

        <input
          type="password"
          value={password}
          onChange={e => { setPassword(e.target.value); setError('') }}
          onKeyDown={handleKeyDown}
          placeholder="비밀번호 입력"
          autoFocus
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px 16px',
            border: error ? '2px solid #ef4444' : '2px solid #ddd',
            borderRadius: '10px',
            fontSize: '16px',
            textAlign: 'center',
            marginBottom: '12px',
            outline: 'none',
            boxSizing: 'border-box',
            background: loading ? '#f5f5f5' : 'white',
          }}
        />

        {error && (
          <p style={{ 
            color: '#ef4444', 
            fontSize: '14px', 
            margin: '0 0 12px',
            background: '#fef2f2',
            padding: '10px',
            borderRadius: '8px',
          }}>
            ⚠️ {error}
          </p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: loading ? '#888' : '#1a2744',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {loading ? '⏳ 확인 중...' : '🔓 로그인'}
        </button>

        <p style={{ 
          marginTop: '20px', 
          fontSize: '11px', 
          color: '#aaa',
          lineHeight: '1.6',
        }}>
          🔒 보안을 위해 정기적으로 비밀번호를 변경하세요
        </p>
      </div>
    </div>
  )
}