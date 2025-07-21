'use client';

import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { useState } from 'react';
import {
  MdExpandLess,
  MdExpandMore,
  MdInfoOutline,
  MdLightbulbOutline,
  MdPeopleOutline,
} from 'react-icons/md';
import type { VideoData } from './downloadUtils';
import { InsightCard } from './InsightCard';
import { PanelCard } from './PanelCard';
import type { Insight, Panel, PanelipsJsonData } from './types';
import { VideoInfoCard } from './VideoInfoCard';

// ... (기존 인터페이스 및 파싱 함수는 동일하게 유지)
interface IntegratedReadableViewProps {
  videos: VideoData[];
}

interface ProcessedVideoData {
  video: VideoData;
  parsedData: PanelipsJsonData;
  insights: Insight[];
  panels: Panel[];
}

function parseJsonData(jsonData: any): PanelipsJsonData | null {
  try {
    if (typeof jsonData === 'object' && jsonData !== null) {
      return jsonData as PanelipsJsonData;
    }
    if (typeof jsonData === 'string') {
      return JSON.parse(jsonData) as PanelipsJsonData;
    }
    return null;
  } catch (error) {
    console.error('JSON 데이터 파싱 오류:', error);
    return null;
  }
}

// 섹션 헤더 컴포넌트
const SectionHeader = ({
  icon,
  title,
  count,
  isOpen,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    onClick={onToggle}
    className={css({
      w: '100%',
      p: '1rem 1.5rem',
      bg: 'gray.50',
      borderBottom: '1px solid',
      borderColor: 'gray.200',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      _hover: { bg: 'gray.100' },
      borderTopRadius: 'lg',
    })}
  >
    <div className={flex({ alignItems: 'center', gap: '0.75rem' })}>
      {icon}
      <span className={css({ fontSize: '1.2rem', fontWeight: '600', color: 'text.primary' })}>
        {title} ({count})
      </span>
    </div>
    {isOpen ? (
      <MdExpandLess className={css({ color: 'text.secondary', fontSize: '1.5rem' })} />
    ) : (
      <MdExpandMore className={css({ color: 'text.secondary', fontSize: '1.5rem' })} />
    )}
  </button>
);

export function IntegratedReadableView({ videos }: IntegratedReadableViewProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const processedVideos: ProcessedVideoData[] = videos
    .map((video) => {
      const parsedData = parseJsonData(video.jsonData);
      if (!parsedData || !parsedData.isRelatedAsset) return null;
      return {
        video,
        parsedData,
        insights: parsedData.insights || [],
        panels: parsedData.panels || [],
      };
    })
    .filter((item): item is ProcessedVideoData => item !== null);

  const allInsights = processedVideos
    .flatMap((item) =>
      item.insights.map((insight, index) => ({
        ...insight,
        videoInfo: item.video,
        uniqueId: `${item.video.id}-${index}`,
      })),
    )
    .sort((a, b) => b.significance - a.significance);

  const allPanels = Array.from(
    new Map(processedVideos.flatMap((item) => item.panels).map((p) => [p.name, p])).values(),
  );

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (processedVideos.length === 0) {
    return (
      <div className={css({ p: '3rem', textAlign: 'center', color: 'text.secondary' })}>
        <MdInfoOutline className={css({ fontSize: '3rem', color: 'gray.400', mb: '1rem' })} />
        <h3 className={css({ fontSize: '1.2rem', fontWeight: '600', color: 'gray.600' })}>
          읽을 수 있는 인사이트가 없습니다
        </h3>
      </div>
    );
  }

  return (
    <div className={css({ bg: 'gray.50', p: '0.5rem', borderRadius: 'lg' })}>
      <div className={css({ display: 'flex', flexDirection: 'column', gap: '1.5rem' })}>
        {/* 전체 인사이트 */}
        <div
          className={css({
            bg: 'white',
            borderRadius: 'lg',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'gray.200',
          })}
        >
          <SectionHeader
            icon={
              <MdLightbulbOutline className={css({ color: 'primary.600', fontSize: '1.5rem' })} />
            }
            title="종합 인사이트"
            count={allInsights.length}
            isOpen={expandedSections.allInsights !== false} // 기본적으로 열려있음
            onToggle={() => toggleSection('allInsights')}
          />
          {expandedSections.allInsights !== false && (
            <div className={css({ p: '1.5rem' })}>
              {allInsights.length > 0 ? (
                <div className={css({ display: 'grid', gap: '1.5rem' })}>
                  {allInsights.map((insight, _index) => (
                    <div
                      key={insight.uniqueId}
                      className={css({
                        border: '1px solid',
                        borderColor: 'gray.100',
                        borderRadius: 'md',
                        p: '1rem',
                      })}
                    >
                      <VideoInfoCard
                        jsonData={parseJsonData(insight.videoInfo.jsonData)!}
                        channelTitle={insight.videoInfo.channelTitle}
                        publishedAt={insight.videoInfo.publishedAt}
                      />
                      <InsightCard insights={[insight]} />
                    </div>
                  ))}
                </div>
              ) : (
                <p>중요도 3점 이상의 인사이트가 없습니다.</p>
              )}
            </div>
          )}
        </div>

        {/* 전체 패널 */}
        <div
          className={css({
            bg: 'white',
            borderRadius: 'lg',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'gray.200',
          })}
        >
          <SectionHeader
            icon={<MdPeopleOutline className={css({ color: 'purple.600', fontSize: '1.5rem' })} />}
            title="전체 패널리스트"
            count={allPanels.length}
            isOpen={!!expandedSections.allPanels}
            onToggle={() => toggleSection('allPanels')}
          />
          {expandedSections.allPanels && (
            <div className={css({ p: '1.5rem' })}>
              <PanelCard panels={allPanels} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
