export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname === 'www.youtube.com' || parsedUrl.hostname === 'youtube.com') {
      const videoId = parsedUrl.searchParams.get('v');
      if (videoId) {
        return videoId;
      }
    }

    if (parsedUrl.hostname === 'youtu.be') {
      const videoId = parsedUrl.pathname.slice(1); // '/' 제거
      if (videoId) {
        return videoId;
      }
    }

    // 임베드 URL (https://www.youtube.com/embed/VIDEO_ID)
    if (parsedUrl.pathname.startsWith('/embed/')) {
      const videoId = parsedUrl.pathname.split('/embed/')[1];
      if (videoId) {
        return videoId;
      }
    }

    return null;
  } catch (error) {
    console.error('YouTube URL 파싱 중 오류 발생:', error);
    return null;
  }
}
