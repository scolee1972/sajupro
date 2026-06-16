'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f1729',
      color: 'white',
      fontFamily: 'sans-serif',
      overflow: 'hidden',
    }}>

      {/* 헤더 네비 */}
      <nav style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        background: 'rgba(15, 23, 41, 0.9)',
        backdropFilter: 'blur(10px)',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100,
        borderBottom: '1px solid rgba(201, 168, 76, 0.2)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          fontSize: '18px', fontWeight: 'bold',
        }}>
          <span style={{ fontSize: '26px' }}>🔮</span>
          <span style={{
            background: 'linear-gradient(135deg, #c9a84c, #d4b86a)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            명리당
          </span>
        </div>
        <Link href="/admin" style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: '13px',
          textDecoration: 'none',
          padding: '6px 14px',
          borderRadius: '6px',
          border: '1px solid rgba(255,255,255,0.15)',
        }}>
          관리자
        </Link>
      </nav>

      {/* 히어로 섹션 */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '100px 20px 60px',
        background: 'radial-gradient(ellipse at center top, #1a2744 0%, #0f1729 70%)',
        position: 'relative',
      }}>
        {/* 배경 별 효과 */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `
            radial-gradient(2px 2px at 20% 30%, rgba(201,168,76,0.3), transparent),
            radial-gradient(2px 2px at 60% 70%, rgba(201,168,76,0.2), transparent),
            radial-gradient(1px 1px at 50% 50%, rgba(255,255,255,0.3), transparent),
            radial-gradient(1px 1px at 80% 10%, rgba(201,168,76,0.2), transparent),
            radial-gradient(2px 2px at 90% 60%, rgba(255,255,255,0.2), transparent),
            radial-gradient(1px 1px at 33% 80%, rgba(201,168,76,0.3), transparent)
          `,
          backgroundSize: '200% 200%',
          opacity: 0.6,
        }} />

        <div style={{
          maxWidth: '900px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* 메인 타이틀 */}
          <div style={{
            display: 'inline-block',
            padding: '8px 20px',
            background: 'rgba(201, 168, 76, 0.15)',
            border: '1px solid rgba(201, 168, 76, 0.4)',
            borderRadius: '50px',
            fontSize: '13px',
            color: '#c9a84c',
            marginBottom: '24px',
            letterSpacing: '0.05em',
          }}>
            ⭐ 30년 경력 명리학 AI 대가
          </div>

          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 64px)',
            fontWeight: 'bold',
            margin: '0 0 20px',
            lineHeight: 1.2,
            fontFamily: "'Noto Serif KR', serif",
          }}>
            당신의 인생,<br />
            <span style={{
              background: 'linear-gradient(135deg, #c9a84c, #d4b86a, #b8973b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              사주에 답이 있습니다
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 2.5vw, 20px)',
            color: 'rgba(255,255,255,0.7)',
            margin: '0 0 40px',
            lineHeight: 1.7,
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            정통 자평명리학 기반의 AI 심층 분석<br />
            과거 검증부터 미래 30년 로드맵까지
          </p>

          {/* CTA 버튼 */}
          <div style={{
            display: 'flex', gap: '12px',
            justifyContent: 'center', flexWrap: 'wrap',
            marginBottom: '60px',
          }}>
            <Link href="/booking" style={{
              display: 'inline-block',
              padding: '18px 40px',
              background: 'linear-gradient(135deg, #c9a84c, #b8973b)',
              color: 'white',
              borderRadius: '14px',
              textDecoration: 'none',
              fontSize: '18px',
              fontWeight: 'bold',
              boxShadow: '0 8px 24px rgba(201, 168, 76, 0.4)',
              border: 'none',
            }}>
              🔮 지금 사주 분석받기
            </Link>
            <a href="#features" style={{
              display: 'inline-block',
              padding: '18px 40px',
              background: 'rgba(255,255,255,0.05)',
              color: 'white',
              borderRadius: '14px',
              textDecoration: 'none',
              fontSize: '18px',
              fontWeight: 'bold',
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
              📖 자세히 보기
            </a>
          </div>

          {/* 신뢰 지표 */}
          <div style={{
            display: 'flex', gap: '32px',
            justifyContent: 'center', flexWrap: 'wrap',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '14px',
          }}>
            <div>✨ 12장 심층 분석</div>
            <div>📊 사주 시각화</div>
            <div>📄 PDF 다운로드</div>
            <div>💬 추가 질문 가능</div>
          </div>
        </div>
      </section>

      {/* 특징 섹션 */}
      <section id="features" style={{
        padding: '100px 20px',
        background: '#1a2744',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{
              display: 'inline-block',
              padding: '6px 16px',
              background: 'rgba(201, 168, 76, 0.15)',
              borderRadius: '50px',
              fontSize: '12px',
              color: '#c9a84c',
              marginBottom: '16px',
            }}>
              SERVICE FEATURES
            </div>
            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              margin: '0 0 16px',
              fontFamily: "'Noto Serif KR', serif",
            }}>
              왜 <span style={{ color: '#c9a84c' }}>명리당</span>인가?
            </h2>
            <p style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '16px',
              maxWidth: '600px',
              margin: '0 auto',
            }}>
              일반 사주 풀이와는 차원이 다른<br />
              30년 명인급 AI 분석을 경험해보세요
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
          }}>
            {[
              { icon: '🔮', title: '12장 심층 분석', desc: '사주 원국부터 12장에 걸친 매우 상세한 분석 보고서' },
              { icon: '🎯', title: '과거 검증', desc: '실제 과거 사건과 사주를 매칭하여 신뢰도 검증' },
              { icon: '📊', title: '시각화 차트', desc: '사주표와 오행 분포를 한눈에 보는 차트 제공' },
              { icon: '💪', title: '건강 가이드', desc: '체질별 음식과 운동, 주의 질환까지 구체 제시' },
              { icon: '👨‍👩‍👧', title: '육친 분석', desc: '조상/부모/배우자/자녀와의 관계 심층 분석' },
              { icon: '💎', title: '맞춤 답변', desc: '연애/직장/사업 등 관심 분야 깊이있는 분석' },
              { icon: '☯️', title: '궁합 분석', desc: '연인/부부/동료 등 8가지 관계별 궁합' },
              { icon: '📅', title: '미래 3년', desc: '월별/년별 운세 흐름과 핵심 전략 제공' },
            ].map((f, i) => (
              <div key={i} className="hover-lift" style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '28px',
                border: '1px solid rgba(201, 168, 76, 0.15)',
              }}>
                <div style={{ fontSize: '40px', marginBottom: '14px' }}>{f.icon}</div>
                <h3 style={{
                  fontSize: '18px',
                  margin: '0 0 10px',
                  color: '#c9a84c',
                  fontFamily: "'Noto Serif KR', serif",
                }}>
                  {f.title}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: 1.7,
                  margin: 0,
                }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 가격 섹션 */}
      <section style={{
        padding: '100px 20px',
        background: '#0f1729',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{
              display: 'inline-block',
              padding: '6px 16px',
              background: 'rgba(201, 168, 76, 0.15)',
              borderRadius: '50px',
              fontSize: '12px',
              color: '#c9a84c',
              marginBottom: '16px',
            }}>
              PRICING
            </div>
            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              margin: '0 0 16px',
              fontFamily: "'Noto Serif KR', serif",
            }}>
              합리적인 가격<br />
              <span style={{ color: '#c9a84c' }}>최상의 품질</span>
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            maxWidth: '900px',
            margin: '0 auto',
          }}>
            {[
              {
                name: '기본 상담',
                price: '9,900',
                desc: '핵심 사주 분석',
                features: ['사주 원국 분석', '오행/십성 분석', '대운/세운', 'PDF 다운로드'],
                color: '#5b8a72',
                popular: false,
              },
              {
                name: '프리미엄 상담',
                price: '29,000',
                desc: '12장 심층 분석',
                features: ['모든 기본 분석', '12장 전체 보고서', '추가 질문 3회', '사주 시각화 PDF'],
                color: '#c9a84c',
                popular: true,
              },
              {
                name: 'VIP 상담',
                price: '99,000',
                desc: '평생 동반 상담',
                features: ['프리미엄 모든 내용', '평생 추가 질문', '궁합 1회 무료', '연간 운세 업데이트'],
                color: '#b8714a',
                popular: false,
              },
            ].map((p, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '20px',
                padding: '36px 28px',
                border: p.popular ? `2px solid ${p.color}` : '1px solid rgba(255,255,255,0.1)',
                position: 'relative',
                transform: p.popular ? 'scale(1.05)' : 'scale(1)',
              }}>
                {p.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px', left: '50%',
                    transform: 'translateX(-50%)',
                    background: p.color,
                    color: 'white',
                    padding: '4px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}>
                    가장 인기
                  </div>
                )}

                <h3 style={{
                  fontSize: '20px',
                  margin: '0 0 6px',
                  color: p.color,
                  fontFamily: "'Noto Serif KR', serif",
                }}>
                  {p.name}
                </h3>
                <p style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.6)',
                  margin: '0 0 24px',
                }}>
                  {p.desc}
                </p>

                <div style={{
                  marginBottom: '24px',
                }}>
                  <span style={{
                    fontSize: '36px',
                    fontWeight: 'bold',
                    color: 'white',
                  }}>
                    {p.price}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.5)', marginLeft: '4px' }}>원</span>
                </div>

                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 28px',
                }}>
                  {p.features.map((f, j) => (
                    <li key={j} style={{
                      padding: '8px 0',
                      fontSize: '14px',
                      color: 'rgba(255,255,255,0.8)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <span style={{ color: p.color }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href="/booking" style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '14px',
                  background: p.popular ? p.color : 'rgba(255,255,255,0.05)',
                  color: 'white',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  border: p.popular ? 'none' : `1px solid ${p.color}`,
                }}>
                  선택하기
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section style={{
        padding: '80px 20px',
        background: 'linear-gradient(135deg, #1a2744, #0f1729)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🔮</div>
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 36px)',
            margin: '0 0 16px',
            fontFamily: "'Noto Serif KR', serif",
          }}>
            지금 바로 시작하세요
          </h2>
          <p style={{
            fontSize: '17px',
            color: 'rgba(255,255,255,0.7)',
            margin: '0 0 32px',
            lineHeight: 1.7,
          }}>
            당신의 사주가 어떤 비밀을 담고 있는지<br />
            30년 경력의 명리학 대가가 알려드립니다
          </p>
          <Link href="/booking" style={{
            display: 'inline-block',
            padding: '18px 50px',
            background: 'linear-gradient(135deg, #c9a84c, #b8973b)',
            color: 'white',
            borderRadius: '14px',
            textDecoration: 'none',
            fontSize: '18px',
            fontWeight: 'bold',
            boxShadow: '0 10px 30px rgba(201, 168, 76, 0.4)',
          }}>
            🔮 사주 분석 시작하기
          </Link>
        </div>
      </section>

      {/* 푸터 */}
      <footer style={{
        padding: '40px 20px',
        background: '#0a0f1a',
        borderTop: '1px solid rgba(201, 168, 76, 0.1)',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.4)',
        fontSize: '13px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '12px',
        }}>
          <span style={{ fontSize: '20px' }}>🔮</span>
          <span style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#c9a84c',
            fontFamily: "'Noto Serif KR', serif",
          }}>
            명리당
          </span>
        </div>
        <p style={{ margin: '8px 0' }}>
          정통 자평명리학 기반 AI 사주 분석 서비스
        </p>
        <p style={{ margin: '8px 0', fontSize: '11px' }}>
          본 서비스는 참고 자료로 활용하시기 바랍니다.
        </p>
        <p style={{ margin: '12px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
          © 2026 명리당. All rights reserved.
        </p>
      </footer>
    </div>
  )
}