export type YouTubeThumbnail = {
  default: {
    url: string;
  };
  medium: {
    url: string;
  };
  high: {
    url: string;
  };
};

export type YoutubeVideo = {
  title: string;
  url: string;
  description: string;
  thumbnail: string;
};
