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

export type GetNewVideosType = {
  title: string;
  url: string;
  thumbnail: string;
};
