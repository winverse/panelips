import { Button } from '@src/components/Button';
import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { MdDownload, MdMenuBook } from 'react-icons/md';
import type { VideoData } from './downloadUtils';
import type { PanelipsJsonData } from './types';

interface SearchResultsHeaderProps {
  videoCount: number;
  videos: VideoData[];
  onDownloadBulkScripts: () => void;
  onDownloadBulkJsons: () => void;
  onOpenReadableView: () => void;
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
  } catch {
    return null;
  }
}

export function SearchResultsHeader({
  videoCount,
  videos,
  onDownloadBulkScripts,
  onDownloadBulkJsons,
  onOpenReadableView,
}: SearchResultsHeaderProps) {
  // 읽기 가능한 영상이 있는지 확인
  const hasReadableVideos = videos.some((video) => {
    if (!video.hasJson || !video.jsonData) return false;
    const parsedData = parseJsonData(video.jsonData);
    return parsedData?.isRelatedAsset === true;
  });

  const readableVideoCount = videos.filter((video) => {
    if (!video.hasJson || !video.jsonData) return false;
    const parsedData = parseJsonData(video.jsonData);
    return parsedData?.isRelatedAsset === true;
  }).length;
  return (
    <div
      className={flex({
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      })}
    >
      <div className={css({ fontSize: '1.1rem', fontWeight: '600', color: 'text.primary' })}>
        검색 결과: {videoCount}개의 영상
      </div>

      {videoCount > 0 && (
        <div className={flex({ gap: '0.5rem' })}>
          {hasReadableVideos && (
            <Button
              type="button"
              onClick={onOpenReadableView}
              variant="primary"
              size="md"
              className={css({
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                bg: 'green.600',
                _hover: {
                  bg: 'green.700',
                },
              })}
            >
              <MdMenuBook />
              읽기 ({readableVideoCount}개)
            </Button>
          )}

          <Button
            type="button"
            onClick={onDownloadBulkScripts}
            variant="primary"
            size="md"
            className={css({
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            })}
          >
            <MdDownload />
            스크립트 일괄다운로드
          </Button>

          <Button
            type="button"
            onClick={onDownloadBulkJsons}
            variant="secondary"
            size="md"
            className={css({
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              bg: 'primary.500',
              _hover: {
                bg: 'primary.600',
              },
            })}
          >
            <MdDownload />
            JSON 일괄다운로드
          </Button>
        </div>
      )}
    </div>
  );
}
