import { Button } from '@src/components/Button';
import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { MdDownload } from 'react-icons/md';

interface SearchResultsHeaderProps {
  videoCount: number;
  onDownloadBulkScripts: () => void;
  onDownloadBulkJsons: () => void;
}

export function SearchResultsHeader({
  videoCount,
  onDownloadBulkScripts,
  onDownloadBulkJsons,
}: SearchResultsHeaderProps) {
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
