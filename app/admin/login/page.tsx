'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleLogin() {
    // 관리자 비밀번호 확인
    if (password === 'saju2026!') {
      localStorage.setItem('admin_auth', 'true')
      localStorage.setItem('admin_auth_time', String(Date.now()))
      router.push('/admin')
    } else {
      setError('비밀번호가 틀렸습니다')
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
          style={{
            width: '100%',
            padding: '14px 16px',
            border: error ? '2px solid #ef4444' : '2px solid #ddd',
            borderRadius: '10px',
            fontSize: '16px',
            textAlign: 'center',
            marginBottom: '12px',
            outline: 'none',
          }}
        />

        {error && (
          <p style={{ color: '#ef4444', fontSize: '14px', margin: '0 0 12px' }}>
            ⚠️ {error}
          </p>
        )}

        <button
          onClick={handleLogin}
          style={{
            width: '100%',
            padding: '14px',
            background: '#1a2744',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          🔓 로그인
        </button>

        <p style={{ marginTop: '20px', fontSize: '12px', color: '#aaa' }}>
          초기 비밀번호: saju2026!
        </p>
      </div>
    </div>
  )
}