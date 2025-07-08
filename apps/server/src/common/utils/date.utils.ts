/**
 * YouTube API의 ISO 8601 형식 기간(예: 'PT1H30M5S')을 초 단위로 변환합니다.
 * @param duration - ISO 8601 형식의 기간 문자열
 * @returns 총 초 단위 시간
 */
export function parseISO8601Duration(duration: string): number {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = duration.match(regex);

  if (!matches) return 0;

  const hours = Number.parseInt(matches[1] || '0', 10);
  const minutes = Number.parseInt(matches[2] || '0', 10);
  const seconds = Number.parseInt(matches[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}
