import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { MdAccessTime, MdLightbulb, MdLink, MdTrendingDown, MdTrendingUp } from 'react-icons/md';
import type { Insight } from './types';
import { OPINION_COLORS, SIGNIFICANCE_COLORS } from './types';

interface InsightCardProps {
  insights: Insight[];
}

function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function getSignificanceLabel(score: number): string {
  switch (score) {
    case 5:
      return '매우 중요';
    case 4:
      return '중요';
    case 3:
      return '보통';
    case 2:
      return '낮음';
    case 1:
      return '매우 낮음';
    default:
      return '알 수 없음';
  }
}

export function InsightCard({ insights }: InsightCardProps) {
  if (!insights || insights.length === 0) {
    return null;
  }

  // 중요도 순으로 정렬
  const sortedInsights = [...insights].sort((a, b) => b.significance - a.significance);

  return (
    <div
      className={css({
        p: '1.5rem',
        bg: 'green.50',
        border: '1px solid',
        borderColor: 'green.200',
        borderRadius: '12px',
        mb: '1rem',
      })}
    >
      <div className={flex({ alignItems: 'center', gap: '0.5rem', mb: '1rem' })}>
        <MdLightbulb className={css({ color: 'green.600', fontSize: '1.2rem' })} />
        <h3
          className={css({
            fontSize: '1.2rem',
            fontWeight: '700',
            color: 'green.800',
            m: 0,
          })}
        >
          핵심 인사이트 ({insights.length}개)
        </h3>
      </div>

      <div className={css({ display: 'grid', gap: '1.5rem' })}>
        {sortedInsights.map((insight, index) => {
          const significanceColor =
            SIGNIFICANCE_COLORS[insight.significance as keyof typeof SIGNIFICANCE_COLORS] ||
            SIGNIFICANCE_COLORS[3];

          return (
            <div
              key={`${insight.panelistName}-${insight.startTimestamp}-${index}`}
              className={css({
                p: '1.5rem',
                bg: 'white',
                border: '2px solid',
                borderColor: significanceColor.border,
                borderRadius: '12px',
                position: 'relative',
              })}
            >
              {/* 중요도 배지 */}
              <div
                className={css({
                  position: 'absolute',
                  top: '-10px',
                  right: '1rem',
                  px: '0.75rem',
                  py: '0.25rem',
                  bg: significanceColor.border,
                  color: 'black',
                  borderRadius: '16px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                })}
              >
                {getSignificanceLabel(insight.significance)} ({insight.significance}/5)
              </div>

              {/* 패널리스트 이름 */}
              <div className={flex({ alignItems: 'center', gap: '0.5rem', mb: '1rem' })}>
                <h4
                  className={css({
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: 'text.primary',
                    m: 0,
                  })}
                >
                  {insight.panelistName}
                </h4>
                <div className={flex({ alignItems: 'center', gap: '0.25rem' })}>
                  <MdAccessTime className={css({ color: 'text.secondary', fontSize: '0.9rem' })} />
                  <span className={css({ fontSize: '0.8rem', color: 'text.secondary' })}>
                    {formatTimestamp(insight.startTimestamp)} -{' '}
                    {formatTimestamp(insight.endTimestamp)}
                  </span>
                </div>
              </div>

              {/* 핵심 주장 */}
              <div className={css({ mb: '1rem' })}>
                <h5
                  className={css({
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: 'text.secondary',
                    mb: '0.5rem',
                  })}
                >
                  핵심 주장
                </h5>
                <p
                  className={css({
                    fontSize: '1rem',
                    lineHeight: '1.6',
                    color: 'text.primary',
                    fontWeight: '500',
                    bg: significanceColor.bg,
                    p: '1rem',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: significanceColor.border,
                    m: 0,
                  })}
                >
                  "{insight.statement}"
                </p>
              </div>

              {/* 맥락 */}
              {insight.context && (
                <div className={css({ mb: '1rem' })}>
                  <h5
                    className={css({
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: 'text.secondary',
                      mb: '0.5rem',
                    })}
                  >
                    맥락
                  </h5>
                  <p
                    className={css({
                      fontSize: '0.9rem',
                      lineHeight: '1.5',
                      color: 'text.secondary',
                      bg: 'gray.50',
                      p: '0.75rem',
                      borderRadius: '6px',
                      m: 0,
                    })}
                  >
                    {insight.context}
                  </p>
                </div>
              )}

              {/* 관련 타겟 */}
              {insight.relatedTargets && insight.relatedTargets.length > 0 && (
                <div className={css({ mb: '1rem' })}>
                  <h5
                    className={css({
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: 'text.secondary',
                      mb: '0.75rem',
                    })}
                  >
                    투자 의견
                  </h5>
                  <div className={css({ display: 'grid', gap: '0.75rem' })}>
                    {insight.relatedTargets.map((target, targetIndex) => {
                      const opinionColor =
                        OPINION_COLORS[target.opinion as keyof typeof OPINION_COLORS] ||
                        OPINION_COLORS.중립;
                      const isPositive = ['적극 매수', '매수', '상승'].includes(target.opinion);

                      return (
                        <div
                          key={`${target.type}-${target.opinion}-${targetIndex}`}
                          className={css({
                            p: '1rem',
                            bg: opinionColor.bg,
                            border: '1px solid',
                            borderColor: isPositive
                              ? 'green.200'
                              : target.opinion === '중립'
                                ? 'gray.200'
                                : 'red.200',
                            borderRadius: '8px',
                          })}
                        >
                          <div
                            className={flex({ alignItems: 'center', gap: '0.5rem', mb: '0.5rem' })}
                          >
                            {isPositive ? (
                              <MdTrendingUp
                                className={css({ color: 'green.600', fontSize: '1.1rem' })}
                              />
                            ) : target.opinion === '중립' ? (
                              <div
                                className={css({
                                  w: '1.1rem',
                                  h: '1.1rem',
                                  bg: 'gray.400',
                                  borderRadius: '50%',
                                })}
                              />
                            ) : (
                              <MdTrendingDown
                                className={css({ color: 'red.600', fontSize: '1.1rem' })}
                              />
                            )}
                            <span
                              className={css({
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                color: opinionColor.text,
                                px: '0.5rem',
                                py: '0.125rem',
                                bg: 'white',
                                borderRadius: '12px',
                              })}
                            >
                              {target.type}
                            </span>
                            <span
                              className={css({
                                fontSize: '0.9rem',
                                fontWeight: '700',
                                color: opinionColor.text,
                              })}
                            >
                              {target.opinion}
                            </span>
                          </div>

                          {target.justification?.quote && (
                            <p
                              className={css({
                                fontSize: '0.85rem',
                                lineHeight: '1.4',
                                color: 'text.secondary',
                                fontStyle: 'italic',
                                m: 0,
                              })}
                            >
                              "{target.justification.quote}"
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 인용 링크 */}
              <div className={flex({ alignItems: 'center', gap: '0.5rem' })}>
                <MdLink className={css({ color: 'blue.600', fontSize: '1rem' })} />
                <a
                  href={insight.citationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={css({
                    color: 'blue.600',
                    textDecoration: 'underline',
                    fontSize: '0.85rem',
                    _hover: { color: 'blue.700' },
                  })}
                >
                  해당 발언 구간 보기 ({formatTimestamp(insight.startTimestamp)})
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
