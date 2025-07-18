import { css } from '@styled-system/css';
import type { VideoData } from './downloadUtils';

interface VideoDetailsProps {
  video: VideoData;
}

export function VideoDetails({ video }: VideoDetailsProps) {
  return (
    <div className={css({ mt: '1rem', p: '1rem', bg: 'gray.50', borderRadius: '6px' })}>
      <div className={css({ mb: '1rem' })}>
        <strong>YouTube URL:</strong>{' '}
        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className={css({ color: 'primary.600', textDecoration: 'underline' })}
        >
          {video.url}
        </a>
      </div>

      {video.hasScript && video.scriptData && (
        <div className={css({ mb: '1rem' })}>
          <strong>스크립트 데이터 미리보기:</strong>
          <pre
            className={css({
              fontSize: '0.7rem',
              bg: 'white',
              p: '0.5rem',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '200px',
              mt: '0.5rem',
            })}
          >
            {JSON.stringify(video.scriptData, null, 2).substring(0, 500)}...
          </pre>
        </div>
      )}

      {video.hasJson && video.jsonData && (
        <div>
          <strong>JSON 데이터 미리보기:</strong>
          <pre
            className={css({
              fontSize: '0.7rem',
              bg: 'white',
              p: '0.5rem',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '200px',
              mt: '0.5rem',
            })}
          >
            {JSON.stringify(video.jsonData, null, 2).substring(0, 500)}...
          </pre>
        </div>
      )}
    </div>
  );
}
