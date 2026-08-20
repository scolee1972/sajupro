import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// POST: 비밀번호 확인 (로그인)
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ success: false, message: '비밀번호를 입력하세요' })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'admin_password_hash')
      .maybeSingle()

    if (error || !data) {
      if (password === 'saju2026!') return NextResponse.json({ success: true })
      return NextResponse.json({ success: false, message: '비밀번호가 틀렸습니다' })
    }

    const inputHash = hashPassword(password)
    if (inputHash === data.value) return NextResponse.json({ success: true })

    if (password === 'saju2026!' && data.value === '5e8b1b2c7bce8e3f7f8e2d3c4b5a6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c') {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, message: '비밀번호가 틀렸습니다' })

  } catch (error) {
    console.error('로그인 오류:', error)
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// PUT: 비밀번호 변경
export async function PUT(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, message: '비밀번호를 모두 입력하세요' })
    }

    // ⭐ 환경변수 체크
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      console.error('환경변수 누락: SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json({ success: false, message: '서버 설정 오류 (서비스 키 누락)' }, { status: 500 })
    }

    // ⭐ 서비스 롤 키로 관리자용 클라이언트 생성 (우회 권한)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { persistSession: false } } // 중요: 세션 충돌 방지
    )

    // 1. 기존 비밀번호 확인
    const { data: currentData } = await supabaseAdmin
      .from('admin_settings')
      .select('value')
      .eq('key', 'admin_password_hash')
      .maybeSingle()

    const currentHash = hashPassword(currentPassword)
    
    const isValidCurrent = 
      currentPassword === 'saju2026!' || 
      (currentData && currentHash === currentData.value)

    if (!isValidCurrent) {
      return NextResponse.json({ success: false, message: '현재 비밀번호가 틀렸습니다' })
    }

    // 2. 새 비밀번호 저장
    const newHash = hashPassword(newPassword)

    const { error: upsertError } = await supabaseAdmin
      .from('admin_settings')
      .upsert({
        key: 'admin_password_hash',
        value: newHash,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' })

    if (upsertError) {
      console.error('DB 저장 오류:', upsertError)
      return NextResponse.json({ success: false, message: 'DB 저장 실패: ' + upsertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: '비밀번호가 변경되었습니다!' })

  } catch (error: any) {
    console.error('변경 오류:', error)
    return NextResponse.json({ success: false, message: '서버 오류: ' + error.message }, { status: 500 })
  }
}