import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// SHA-256 해시 함수
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

    // DB에서 저장된 비밀번호 해시 가져오기
    const { data, error } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'admin_password_hash')
      .maybeSingle()

    if (error || !data) {
      // DB에 비밀번호가 없으면 초기 비밀번호로 확인
      if (password === 'saju2026!') {
        return NextResponse.json({ success: true })
      }
      return NextResponse.json({ success: false, message: '비밀번호가 틀렸습니다' })
    }

    // 입력한 비밀번호를 해시하여 비교
    const inputHash = hashPassword(password)
    
    if (inputHash === data.value) {
      return NextResponse.json({ success: true })
    }

    // 초기 비밀번호로도 확인 (마이그레이션용)
    if (password === 'saju2026!' && data.value === '5e8b1b2c7bce8e3f7f8e2d3c4b5a6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c') {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, message: '비밀번호가 틀렸습니다' })

  } catch (error) {
    console.error('❌ 로그인 오류:', error)
    return NextResponse.json({ success: false, message: '오류가 발생했습니다' }, { status: 500 })
  }
}

// PUT: 비밀번호 변경
export async function PUT(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ 
        success: false, 
        message: '현재 비밀번호와 새 비밀번호를 모두 입력하세요' 
      })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ 
        success: false, 
        message: '새 비밀번호는 6자 이상이어야 합니다' 
      })
    }

        const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 현재 비밀번호 확인
    const { data: currentData } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'admin_password_hash')
      .maybeSingle()

    const currentHash = hashPassword(currentPassword)
    const initialHash = '5e8b1b2c7bce8e3f7f8e2d3c4b5a6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c'
    
    // 초기 비밀번호이거나, 저장된 비밀번호와 일치해야 함
    const isValidCurrent = 
      currentPassword === 'saju2026!' || 
      (currentData && currentHash === currentData.value)

    if (!isValidCurrent) {
      return NextResponse.json({ 
        success: false, 
        message: '현재 비밀번호가 틀렸습니다' 
      })
    }

    // 새 비밀번호 해시하여 저장
    const newHash = hashPassword(newPassword)

    const { error } = await supabase
      .from('admin_settings')
      .upsert({
        key: 'admin_password_hash',
        value: newHash,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'key'
      })

    if (error) {
      console.error('❌ 저장 오류:', error)
      return NextResponse.json({ 
        success: false, 
        message: '비밀번호 변경 실패: ' + error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: '비밀번호가 변경되었습니다' })

  } catch (error) {
    console.error('❌ 변경 오류:', error)
    return NextResponse.json({ 
      success: false, 
      message: '오류가 발생했습니다' 
    }, { status: 500 })
  }
}