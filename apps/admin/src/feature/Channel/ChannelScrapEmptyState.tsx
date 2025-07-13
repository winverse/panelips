import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { MdDownload } from 'react-icons/md';

export function ChannelScrapEmptyState() {
  return (
    <div
      className={flex({
        w: '60%',
      })}
    >
      <div
        className={css({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          w: '100%',
          py: '3rem',
          px: '2rem',
          bg: 'background.secondary',
          border: '2px dashed',
          borderColor: 'border.primary',
          borderRadius: '12px',
          textAlign: 'center',
        })}
      >
        <div
          className={css({
            fontSize: '3rem',
            mb: '1rem',
            opacity: 0.6,
            color: 'text.secondary',
          })}
        >
          <MdDownload />
        </div>
        <h4
          className={css({
            fontSize: '1.1rem',
            fontWeight: '600',
            color: 'text.primary',
            mb: '0.5rem',
            m: 0,
          })}
        >
          스크랩 대상이 없습니다
        </h4>
        <p
          className={css({
            fontSize: '0.9rem',
            color: 'text.secondary',
            m: 0,
            lineHeight: 1.5,
          })}
        >
          채널에서 스크랩 버튼을 클릭하여
          <br />
          다운로드할 영상을 추가해보세요
        </p>
      </div>
    </div>
  );
}