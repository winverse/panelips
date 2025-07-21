export interface VideoData {
  id: string;
  videoId: string;
  title: string;
  url: string;
  publishedAt: Date;
  channelTitle: string;
  channelIsLiked: boolean;
  hasScript: boolean;
  hasJson: boolean;
  scriptData?: any;
  jsonData?: any;
}

export const downloadData = (data: any, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadBulkScripts = async (
  videoData: VideoData[],
  startDate: string,
  endDate: string,
) => {
  if (!videoData || videoData.length === 0) return;

  const scriptsWithData = videoData.filter((video) => video.hasScript && video.scriptData);
  if (scriptsWithData.length === 0) {
    alert('다운로드할 스크립트 데이터가 없습니다.');
    return;
  }

  // 모든 스크립트 데이터를 하나의 배열로 통합
  const consolidatedData = {
    exportDate: new Date().toISOString(),
    totalVideos: scriptsWithData.length,
    scripts: scriptsWithData.map((video) => ({
      videoInfo: {
        id: video.id,
        videoId: video.videoId,
        title: video.title,
        url: video.url,
        publishedAt: video.publishedAt,
        channelTitle: video.channelTitle,
        channelIsLiked: video.channelIsLiked,
      },
      scriptData: video.scriptData,
    })),
  };

  const blob = new Blob([JSON.stringify(consolidatedData, null, 2)], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `[script]_${startDate}-${endDate}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadBulkJsons = async (
  videoData: VideoData[],
  startDate: string,
  endDate: string,
) => {
  if (!videoData || videoData.length === 0) return;

  const jsonsWithData = videoData.filter(
    (video) => video.hasJson && video.jsonData && video.jsonData.isRelatedAsset === true,
  );
  if (jsonsWithData.length === 0) {
    alert('다운로드할 JSON 데이터가 없습니다. (isRelatedAsset: true인 데이터만 다운로드 가능)');
    return;
  }

  // 모든 JSON 데이터를 하나의 배열로 통합
  const consolidatedData = {
    exportDate: new Date().toISOString(),
    totalVideos: jsonsWithData.length,
    filterCriteria: 'isRelatedAsset: true',
    jsonData: jsonsWithData.map((video) => ({
      videoInfo: {
        id: video.id,
        videoId: video.videoId,
        title: video.title,
        url: video.url,
        publishedAt: video.publishedAt,
        channelTitle: video.channelTitle,
        channelIsLiked: video.channelIsLiked,
      },
      analysisData: video.jsonData,
    })),
  };

  const blob = new Blob([JSON.stringify(consolidatedData, null, 2)], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `[json]_${startDate}-${endDate}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
