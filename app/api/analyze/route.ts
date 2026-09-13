import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateSaju } from '@/lib/saju'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, gender, phone, email, address, familyInfo, birthDate, birthTime, birthCity, birthCountry, calendarType, leapMonth, category, question } = body

    const saju = calculateSaju(birthDate, birthTime, birthCity, calendarType, leapMonth)
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    const { data: customer } = await supabase.from('customers').insert({
      name, gender, phone, email, address, family_info: familyInfo, birth_date: birthDate, birth_time: birthTime, birth_city: birthCity, birth_country: birthCountry || '대한민국'
    }).select().single()

    const { data: consultation } = await supabase.from('consultations').insert({
      customer_id: customer?.id,
      customer_name: name,
      category,
      question: question || '',
      report_html: '',
      saju_data: { ...saju, calendarType, leapMonth },
      status: 'processing'
    }).select().single()

    return NextResponse.json({ success: true, consultationId: consultation?.id })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}