'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('error')
  const [loading, setLoading] = useState(false)

  // 로그인 체크
  useEffect(() => {
    const auth = localStorage.getItem('admin_auth')
    if (!auth) {
      router.push('/admin/login')
    }
  }, [router])

  async function handleChangePassword() {
    setMessage('')
    
    // 검증
    if (!currentPassword) {
      setMessageType('error')
      setMessage('현재 비밀번호를 입력하세요')
      return
    }
    if (!newPassword) {
      setMessageType('error')
      setMessage('새 비밀번호를 입력하세요')
      return
    }
    if (newPassword.length < 6) {
      setMessageType('error')
      setMessage('새 비밀번호는 6자 이상이어야 합니다')
      return
    }
    if (newPassword !== confirmPassword) {
      setMessageType('error')
      setMessage('새 비밀번호가 일치하지 않습니다')
      return
    }
    if (currentPassword === newPassword) {
      setMessageType('error')
      setMessage('새 비밀번호는 현재 비밀번호와 달라야 합니다')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/admin-auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()

      if (data.success) {
        setMessageType('success')
        setMessage('✅ 비밀번호가 성공적으로 변경되었습니다!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')

        // 3초 후 관리자 페이지로 이동
        setTimeout(() => {
          router.push('/admin')
        }, 3000)
      } else {
        setMessageType('error')
        setMessage(data.message || '비밀번호 변경에 실패했습니다')
      }
    } catch (err) {
      setMessageType('error')
      setMessage('오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid #ddd',
    borderRadius: '10px',
    fontSize: '16px',
    marginTop: '6px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'sans-serif',
  }

  const labelStyle: React.CSSProperties = {
    fontWeight: 'bold',
    color: '#444',
    fontSize: '14px',
    display: 'block',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f1f5f9',
      padding: '30px 20px',
      fontFamily: 'sans-serif',
    }}>

      <div style={{ maxWidth: '500px', margin: '0 auto 16px' }}>
        <Link href="/admin" style={{
          color: '#1a2744',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: 'bold',
        }}>
          ← 관리자 메인
        </Link>
      </div>

      <div style={{
        background: '#1a2744',
        color: 'white',
        padding: '20px',
        borderRadius: '16px',
        maxWidth: '500px',
        margin: '0 auto 16px',
      }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>🔐 비밀번호 변경</h1>
        <p style={{ margin: '6px 0 0', color: '#93c5fd', fontSize: '13px' }}>
          보안을 위해 정기적으로 변경하세요
        </p>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '30px',
        maxWidth: '500px',
        margin: '0 auto',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      }}>

        {/* 안내 메시지 */}
        <div style={{
          background: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '10px',
          padding: '14px',
          marginBottom: '24px',
          fontSize: '13px',
          color: '#92400e',
          lineHeight: '1.6',
        }}>
          💡 <strong>비밀번호 안내</strong>
          <ul style={{ margin: '8px 0 0', paddingLeft: '20px' }}>
            <li>최소 6자 이상</li>
            <li>영문, 숫자, 특수문자 조합 추천</li>
            <li>정기적으로 변경 권장</li>
          </ul>
        </div>

        {/* 현재 비밀번호 */}
        <div style={{ marginBottom: '18px' }}>
          <label style={labelStyle}>현재 비밀번호</label>
          <input
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="현재 비밀번호"
            disabled={loading}
            style={inputStyle}
          />
        </div>

        {/* 새 비밀번호 */}
        <div style={{ marginBottom: '18px' }}>
          <label style={labelStyle}>새 비밀번호</label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="새 비밀번호 (6자 이상)"
            disabled={loading}
            style={inputStyle}
          />
          {newPassword && newPassword.length < 6 && (
            <p style={{ 
              fontSize: '12px', 
              color: '#ef4444', 
              margin: '4px 0 0' 
            }}>
              ⚠️ 6자 이상 입력하세요
            </p>
          )}
        </div>

        {/* 새 비밀번호 확인 */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>새 비밀번호 확인</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="새 비밀번호 다시 입력"
            disabled={loading}
            onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
            style={inputStyle}
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <p style={{ 
              fontSize: '12px', 
              color: '#ef4444', 
              margin: '4px 0 0' 
            }}>
              ⚠️ 비밀번호가 일치하지 않습니다
            </p>
          )}
          {confirmPassword && newPassword === confirmPassword && newPassword.length >= 6 && (
            <p style={{ 
              fontSize: '12px', 
              color: '#22c55e', 
              margin: '4px 0 0' 
            }}>
              ✅ 비밀번호가 일치합니다
            </p>
          )}
        </div>

        {/* 메시지 */}
        {message && (
          <div style={{
            padding: '14px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '14px',
            background: messageType === 'success' ? '#f0fdf4' : '#fef2f2',
            color: messageType === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${messageType === 'success' ? '#86efac' : '#fca5a5'}`,
          }}>
            {message}
          </div>
        )}

        {/* 버튼 */}
        <button
          onClick={handleChangePassword}
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px',
            background: loading ? '#888' : '#c9a84c',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {loading ? '⏳ 변경 중...' : '🔐 비밀번호 변경'}
        </button>
      </div>
    </div>
  )
}