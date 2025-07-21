// JSON 데이터 구조 타입 정의
export interface PanelipsJsonData {
  version: string;
  isRelatedAsset: boolean;
  videoInfo: {
    videoId: string;
    url: string;
    title: string;
    summary: string;
    relatedStocks: string[];
    channelId: string;
    publishedAt: string;
  };
  panels: Panel[] | null;
  insights: Insight[] | null;
  reason?: string; // isRelatedAsset이 false인 경우
}

export interface Panel {
  name: string;
  expertise: string[];
  affiliation: {
    ko: string;
    en: string;
  };
  position: string;
}

export interface Insight {
  panelistName: string;
  statement: string;
  context: string;
  citationUrl: string;
  startTimestamp: number;
  endTimestamp: number;
  significance: number; // 1-5 점수
  relatedTargets: RelatedTarget[];
}

export interface RelatedTarget {
  type: 'STOCK' | 'THEME' | 'FX' | 'COMMODITY';
  target: Record<string, any>;
  opinion: '적극 매수' | '매수' | '중립' | '매도' | '적극 매도' | '상승' | '하락';
  justification: {
    quote: string;
    citation: string;
    startTimestamp: number;
  };
}

// 중요도별 색상 매핑
export const SIGNIFICANCE_COLORS = {
  5: { bg: 'red.50', border: 'red.500', text: 'red.700' }, // 매우 중요
  4: { bg: 'orange.50', border: 'orange.500', text: 'orange.700' }, // 중요
  3: { bg: 'yellow.50', border: 'yellow.500', text: 'yellow.700' }, // 보통
  2: { bg: 'blue.50', border: 'blue.500', text: 'blue.700' }, // 낮음
  1: { bg: 'gray.50', border: 'gray.500', text: 'gray.700' }, // 매우 낮음
} as const;

// 투자 의견별 색상 매핑
export const OPINION_COLORS = {
  '적극 매수': { bg: 'green.100', text: 'green.800' },
  매수: { bg: 'green.50', text: 'green.700' },
  중립: { bg: 'gray.50', text: 'gray.700' },
  매도: { bg: 'red.50', text: 'red.700' },
  '적극 매도': { bg: 'red.100', text: 'red.800' },
  상승: { bg: 'blue.50', text: 'blue.700' },
  하락: { bg: 'red.50', text: 'red.700' },
} as const;
