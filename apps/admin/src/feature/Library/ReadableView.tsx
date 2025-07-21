import { css } from '@styled-system/css';
import { MdMenuBook, MdWarning } from 'react-icons/md';
import type { VideoData } from './downloadUtils';
import { InsightCard } from './InsightCard';
import { PanelCard } from './PanelCard';
import type { PanelipsJsonData } from './types';
import { VideoInfoCard } from './VideoInfoCard';

interface ReadableViewProps {
  video: VideoData;
}

function parseJsonData(jsonData: any): PanelipsJsonData | null {
  try {
    // jsonData가 이미 파싱된 객체인지 확인
    if (typeof jsonData === 'object' && jsonData !== null) {
      return jsonData as PanelipsJsonData;
    }

    // 문자열인 경우 파싱 시도
    if (typeof jsonData === 'string') {
      return JSON.parse(jsonData) as PanelipsJsonData;
    }

    return null;
  } catch (error) {
    console.error('JSON 데이터 파싱 오류:', error);
    return null;
  }
}

export function ReadableView({ video }: ReadableViewProps) {
  // JSON 데이터가 없는 경우
  if (!video.hasJson || !video.jsonData) {
    return (
      <div
        className={css({
          p: '2rem',
          bg: 'yellow.50',
          border: '1px solid',
          borderColor: 'yellow.200',
          borderRadius: '12px',
          textAlign: 'center',
        })}
      >
        <MdWarning className={css({ fontSize: '3rem', color: 'yellow.600', mb: '1rem' })} />
        <h3
          className={css({
            fontSize: '1.2rem',
            fontWeight: '600',
            color: 'yellow.800',
            mb: '0.5rem',
          })}
        >
          읽기 데이터 없음
        </h3>
        <p className={css({ fontSize: '0.9rem', color: 'yellow.700', m: 0 })}>
          이 영상에는 분석된 JSON 데이터가 없습니다.
        </p>
      </div>
    );
  }

  // JSON 데이터 파싱
  const parsedData = parseJsonData(video.jsonData);

  if (!parsedData) {
    return (
      <div
        className={css({
          p: '2rem',
          bg: 'red.50',
          border: '1px solid',
          borderColor: 'red.200',
          borderRadius: '12px',
          textAlign: 'center',
        })}
      >
        <MdWarning className={css({ fontSize: '3rem', color: 'red.600', mb: '1rem' })} />
        <h3
          className={css({
            fontSize: '1.2rem',
            fontWeight: '600',
            color: 'red.800',
            mb: '0.5rem',
          })}
        >
          데이터 파싱 오류
        </h3>
        <p className={css({ fontSize: '0.9rem', color: 'red.700', m: 0 })}>
          JSON 데이터를 읽을 수 없습니다. 데이터 형식을 확인해주세요.
        </p>
      </div>
    );
  }

  // isRelatedAsset이 false인 경우
  if (!parsedData.isRelatedAsset) {
    return (
      <div
        className={css({
          p: '2rem',
          bg: 'gray.50',
          border: '1px solid',
          borderColor: 'gray.200',
          borderRadius: '12px',
          textAlign: 'center',
        })}
      >
        <MdMenuBook className={css({ fontSize: '3rem', color: 'gray.500', mb: '1rem' })} />
        <h3
          className={css({
            fontSize: '1.2rem',
            fontWeight: '600',
            color: 'gray.700',
            mb: '0.5rem',
          })}
        >
          투자 관련 내용 없음
        </h3>
        <p className={css({ fontSize: '0.9rem', color: 'gray.600', mb: '1rem', m: 0 })}>
          이 영상은 투자 자산과 직접적인 관련이 없는 내용입니다.
        </p>
        {parsedData.reason && (
          <div
            className={css({
              p: '1rem',
              bg: 'white',
              border: '1px solid',
              borderColor: 'gray.200',
              borderRadius: '8px',
              textAlign: 'left',
            })}
          >
            <h4
              className={css({
                fontSize: '0.9rem',
                fontWeight: '600',
                color: 'gray.700',
                mb: '0.5rem',
              })}
            >
              판단 이유
            </h4>
            <p className={css({ fontSize: '0.85rem', color: 'gray.600', m: 0, lineHeight: '1.5' })}>
              {parsedData.reason}
            </p>
          </div>
        )}
      </div>
    );
  }

  // 정상적인 읽기 모드 표시
  return (
    <div
      className={css({
        mt: '1rem',
        p: '1.5rem',
        bg: 'background.primary',
        border: '2px solid',
        borderColor: 'primary.200',
        borderRadius: '16px',
      })}
    >
      {/* 헤더 */}
      <div
        className={css({
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          mb: '2rem',
          pb: '1rem',
          borderBottom: '2px solid',
          borderColor: 'primary.100',
        })}
      >
        <MdMenuBook className={css({ fontSize: '1.5rem', color: 'primary.600' })} />
        <h2
          className={css({
            fontSize: '1.4rem',
            fontWeight: '700',
            color: 'primary.800',
            m: 0,
          })}
        >
          읽기 모드
        </h2>
        <div
          className={css({
            px: '0.75rem',
            py: '0.25rem',
            bg: 'primary.100',
            color: 'primary.700',
            borderRadius: '16px',
            fontSize: '0.75rem',
            fontWeight: '600',
          })}
        >
          v{parsedData.version}
        </div>
      </div>

      {/* 영상 정보 */}
      <VideoInfoCard
        jsonData={parsedData}
        channelTitle={video.channelTitle}
        publishedAt={video.publishedAt}
      />

      {/* 패널리스트 정보 */}
      {parsedData.panels && parsedData.panels.length > 0 && (
        <PanelCard panels={parsedData.panels} />
      )}

      {/* 인사이트 정보 */}
      {parsedData.insights && parsedData.insights.length > 0 ? (
        <InsightCard insights={parsedData.insights} />
      ) : (
        <div
          className={css({
            p: '2rem',
            bg: 'orange.50',
            border: '1px solid',
            borderColor: 'orange.200',
            borderRadius: '12px',
            textAlign: 'center',
          })}
        >
          <MdWarning className={css({ fontSize: '2rem', color: 'orange.600', mb: '1rem' })} />
          <h3
            className={css({
              fontSize: '1.1rem',
              fontWeight: '600',
              color: 'orange.800',
              mb: '0.5rem',
            })}
          >
            인사이트 없음
          </h3>
          <p className={css({ fontSize: '0.9rem', color: 'orange.700', m: 0 })}>
            이 영상에서는 중요도 3점 이상의 핵심 인사이트가 발견되지 않았습니다.
          </p>
        </div>
      )}

      {/* 푸터 정보 */}
      <div
        className={css({
          mt: '2rem',
          pt: '1rem',
          borderTop: '1px solid',
          borderColor: 'gray.200',
          fontSize: '0.8rem',
          color: 'text.tertiary',
          textAlign: 'center',
        })}
      >
        이 데이터는 AI에 의해 자동 분석된 결과입니다. 투자 결정 시 참고용으로만 활용하시기 바랍니다.
      </div>
    </div>
  );
}
