import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateSaju } from '@/lib/saju'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name, gender, phone, email, address, familyInfo,
      marriageDate, divorceDate, spouseBirth, childrenInfo,
      majorEvents, bodyType, healthStatus,
      birthDate, birthTime, birthCity, birthCountry,
      calendarType, leapMonth, category, question
    } = body

    const saju = calculateSaju(birthDate, birthTime, birthCity, calendarType, leapMonth)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 1. 고객 저장
    const { data: customer, error: custErr } = await supabase
      .from('customers')
      .insert({
        name, gender, phone,
        email: email || null,
        address: address || null,
        family_info: familyInfo || null,
        marriage_date: marriageDate || null,
        divorce_date: divorceDate || null,
        spouse_birth: spouseBirth || null,
        children_info: childrenInfo || null,
        major_events: majorEvents || null,
        body_type: bodyType || null,
        health_status: healthStatus || null,
        birth_date: birthDate,
        birth_time: birthTime,
        birth_city: birthCity,
        birth_country: birthCountry || '대한민국',
      })
      .select().single()

    if (custErr) throw custErr

    // 2. 상담 레코드 생성 (1초 완료)
    const { data: consultation, error: consultErr } = await supabase
      .from('consultations')
      .insert({
        customer_id: customer?.id,
        customer_name: name,
        category,
        question: question || '',
        report_html: '',
        saju_data: { ...saju, calendarType, leapMonth },
        status: 'pending',
        progress: 0,
      })
      .select().single()

    if (consultErr) throw consultErr

    return NextResponse.json({
      success: true,
      consultationId: consultation.id,
      customerData: customer,
      sajuData: { ...saju, calendarType, leapMonth },
      formBody: body
    })

  } catch (error: any) {
    console.error('❌ 초기화 오류:', error)
    return NextResponse.json({ success: false, message: error?.message || '오류 발생' }, { status: 500 })
  }
}