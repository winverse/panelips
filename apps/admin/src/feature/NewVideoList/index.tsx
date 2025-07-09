// apps/admin/src/feature/NewVideoList/index.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';

interface Video {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
}

interface NewVideoListProps {
  channelUrl: string | null;
}

export function NewVideoList({ channelUrl }: NewVideoListProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (channelUrl) {
      // TODO: Call tRPC to fetch new videos for the selected channel
      // For now, simulate fetching
      setLoading(true);
      setTimeout(() => {
        setVideos([
          { id: 'video1', title: '새 동영상 1', url: 'https://youtube.com/watch?v=video1', publishedAt: '2025-07-01' },
          { id: 'video2', title: '새 동영상 2', url: 'https://youtube.com/watch?v=video2', publishedAt: '2025-07-02' },
        ]);
        setLoading(false);
      }, 1000);
    } else {
      setVideos([]);
    }
  }, [channelUrl]);

  const handleScrapVideo = (videoId: string) => {
    // TODO: Call tRPC to trigger scraping for this video
    console.log(`동영상 스크래핑: ${videoId}`);
    alert(`동영상 스크래핑: ${videoId}`);
  };

  return (
    <div className={css({ p: '1rem', border: '1px solid #eee', borderRadius: '8px', width: '400px' })}>
      <h2 className={css({ fontSize: '1.2rem', fontWeight: 'bold', mb: '1rem' })}>새 동영상</h2>
      {!channelUrl ? (
        <p className={css({ color: '#666' })}>새 동영상을 보려면 채널을 선택해주세요.</p>
      ) : (
        <>
          <p className={css({ mb: '1rem' })}>채널: <span className={css({ fontWeight: 'bold' })}>{channelUrl}</span></p>
          {loading ? (
            <p>새 동영상을 불러오는 중...</p>
          ) : videos.length === 0 ? (
            <p className={css({ color: '#666' })}>이 채널에 새 동영상이 없습니다.</p>
          ) : (
            <ul className={css({ listStyle: 'none', p: 0 })}>
              {videos.map((video) => (
                <li
                  key={video.id}
                  className={flex({
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    mb: '0.5rem',
                  })}
                >
                  <div className={css({ flexGrow: 1 })}>
                    <a href={video.url} target="_blank" rel="noopener noreferrer" className={css({ fontWeight: 'bold', color: '#007bff', textDecoration: 'none', _hover: { textDecoration: 'underline' } })}> 
                      {video.title}
                    </a>
                    <p className={css({ fontSize: '0.8rem', color: '#666' })}>{video.publishedAt}</p>
                  </div>
                  <button
                    onClick={() => handleScrapVideo(video.id)}
                    className={css({
                      p: '0.4rem 0.8rem',
                      bg: '#28a745',
                      color: 'white',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      _hover: { bg: '#218838' },
                    })}
                  >
                    스크랩
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}