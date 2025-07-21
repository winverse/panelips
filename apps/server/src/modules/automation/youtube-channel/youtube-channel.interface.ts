export interface YoutubeChannelScrapArgs {
  title: string;
  url: string;
  description: string;
  channelId: string;
  publishedAt: string;
}

export type JsonPromptResult = {
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
  panels: {
    name: string;
    expertise: string[];
    affiliation: {
      ko: string;
      en: string;
    };
    position: string;
  }[];
  insights: {
    panelistName: string;
    statement: string;
    context: string;
    citationUrl: string;
    startTimestamp: number;
    endTimestamp: number;
    significance: number;
    relatedTargets: {
      type: string;
      target: {
        ticker: string;
        name: string;
        exchange: string;
      };
      opinion: string;
      justification: {
        quote: string;
        citation: string;
        startTimestamp: number;
      };
    }[];
  }[];
  response: string;
};

export type ScriptPromptResult = {
  videoInfo: {
    videoId: string;
    url: string;
    title: string;
    description: string;
    analysisType: string;
  };
  summary: {
    text: string;
    time: string;
  }[];
  metadata: {
    totalSegments: string;
    coverageNote: string;
    contextualDepth: string;
    response: string;
  };
};
