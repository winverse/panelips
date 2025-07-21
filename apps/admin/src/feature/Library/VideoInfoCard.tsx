import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { format } from 'date-fns';
import { MdPlayCircleOutline } from 'react-icons/md';
import type { PanelipsJsonData } from './types';

interface VideoInfoCardProps {
  jsonData: PanelipsJsonData;
  channelTitle: string;
  publishedAt: Date;
}

export function VideoInfoCard({ jsonData, channelTitle, publishedAt }: VideoInfoCardProps) {
  const { videoInfo } = jsonData;

  return (
    <div
      className={css({
        p: '1rem',
        bg: 'blue.50',
        border: '1px solid',
        borderColor: 'blue.100',
        borderRadius: 'md',
        mb: '1rem',
      })}
    >
      <div className={flex({ alignItems: 'center', gap: '0.5rem', mb: '0.75rem' })}>
        <MdPlayCircleOutline className={css({ color: 'blue.600', fontSize: '1.2rem' })} />
        <h4
          className={css({
            fontSize: '1.1rem',
            fontWeight: 'bold',
            color: 'text.primary',
            m: 0,
          })}
        >
          {videoInfo.title}
        </h4>
      </div>
      <div
        className={css({ fontSize: '0.9rem', color: 'text.secondary', mb: '1rem', pl: '1.75rem' })}
      >
        {channelTitle} | {format(publishedAt, 'yyyy-MM-dd')}
      </div>
      {videoInfo.summary && (
        <p className={css({ fontSize: '0.9rem', color: 'text.secondary', m: 0, pl: '1.75rem' })}>
          {videoInfo.summary}
        </p>
      )}
    </div>
  );
}
