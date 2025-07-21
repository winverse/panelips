'use client';

import { Modal } from '@src/components/Modal';
import {
  downloadBulkJsons,
  downloadBulkScripts,
  downloadData,
  IntegratedReadableView,
  SearchFilters,
  SearchResultsHeader,
  type VideoData,
  VideoItem,
} from '@src/feature/Library';
import { DashboardLayout } from '@src/Layouts/DashboardLayout';
import { useTRPC } from '@src/lib/trpc';
import { css } from '@styled-system/css';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { useState } from 'react';

export default function Library() {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [channelFilter, setChannelFilter] = useState('');
  const [onlyLikedChannels, setOnlyLikedChannels] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isReadableModalOpen, setIsReadableModalOpen] = useState(false);

  const trpc = useTRPC();

  const {
    data: videoData,
    isLoading,
    refetch,
  } = useQuery({
    ...trpc.youtube.getVideoDataByDateRange.queryOptions({
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      channelFilter: channelFilter.trim() || undefined,
      onlyLikedChannels: onlyLikedChannels || undefined,
    }),
    enabled: false,
  });

  const handleSearch = () => {
    refetch();
  };

  const handleToggleDetails = (videoId: string) => {
    setSelectedVideo(selectedVideo === videoId ? null : videoId);
  };

  const handleOpenReadableModal = () => {
    setIsReadableModalOpen(true);
  };

  const handleCloseReadableModal = () => {
    setIsReadableModalOpen(false);
  };

  const handleDownloadBulkScripts = () => {
    if (videoData) {
      downloadBulkScripts(videoData as VideoData[], startDate, endDate);
    }
  };

  const handleDownloadBulkJsons = () => {
    if (videoData) {
      downloadBulkJsons(videoData as VideoData[], startDate, endDate);
    }
  };

  return (
    <DashboardLayout>
      <div className={css({ p: '1rem' })}>
        <h1
          className={css({
            fontSize: '2rem',
            fontWeight: 'bold',
            mb: '2rem',
            color: 'text.primary',
          })}
        >
          자료실
        </h1>

        <SearchFilters
          startDate={startDate}
          endDate={endDate}
          channelFilter={channelFilter}
          onlyLikedChannels={onlyLikedChannels}
          isLoading={isLoading}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onChannelFilterChange={setChannelFilter}
          onOnlyLikedChannelsChange={setOnlyLikedChannels}
          onSearch={handleSearch}
        />

        {videoData && (
          <div className={css({ display: 'flex', flexDirection: 'column', gap: '1rem' })}>
            <SearchResultsHeader
              videoCount={videoData.length}
              videos={videoData as VideoData[]}
              onDownloadBulkScripts={handleDownloadBulkScripts}
              onDownloadBulkJsons={handleDownloadBulkJsons}
              onOpenReadableView={handleOpenReadableModal}
            />

            <div className={css({ display: 'grid', gap: '1rem' })}>
              {videoData.map((video) => (
                <VideoItem
                  key={video.id}
                  video={video as VideoData}
                  isSelected={selectedVideo === video.id}
                  onToggleDetails={handleToggleDetails}
                  onDownloadScript={downloadData}
                  onDownloadJson={downloadData}
                />
              ))}
            </div>
          </div>
        )}

        {videoData && videoData.length === 0 && (
          <div
            className={css({
              textAlign: 'center',
              p: '2rem',
              color: 'text.secondary',
              fontSize: '1.1rem',
            })}
          >
            선택한 기간에 해당하는 데이터가 없습니다.
          </div>
        )}

        {/* 읽기 모달 */}
        <Modal
          isOpen={isReadableModalOpen}
          onClose={handleCloseReadableModal}
          title="인사이트 읽기"
          size="lg"
        >
          {videoData && <IntegratedReadableView videos={videoData as VideoData[]} />}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
