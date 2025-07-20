import { addDays, format, isAfter, startOfDay } from 'date-fns';

/**
 * 시작 날짜와 종료 날짜 사이의 모든 날짜를 배열로 반환합니다.
 * @param startDate 시작 날짜
 * @param endDate 종료 날짜
 * @returns 날짜 배열 (Date[])
 */
export function getDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);

  // 시작 날짜가 종료 날짜보다 늦으면 빈 배열 반환
  if (isAfter(start, end)) {
    return dates;
  }

  let currentDate = start;
  while (!isAfter(currentDate, end)) {
    dates.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }

  return dates;
}

/**
 * 날짜를 YYYY-MM-DD 형식의 문자열로 변환합니다.
 * @param date 변환할 날짜
 * @returns YYYY-MM-DD 형식의 문자열
 */
export function formatDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * 날짜 배열을 문자열 배열로 변환합니다.
 * @param dates 날짜 배열
 * @returns YYYY-MM-DD 형식의 문자열 배열
 */
export function formatDateKeys(dates: Date[]): string[] {
  return dates.map(formatDateKey);
}

/**
 * 날짜 범위의 총 일수를 계산합니다.
 * @param startDate 시작 날짜
 * @param endDate 종료 날짜
 * @returns 총 일수
 */
export function getDayCount(startDate: Date, endDate: Date): number {
  return getDateRange(startDate, endDate).length;
}
