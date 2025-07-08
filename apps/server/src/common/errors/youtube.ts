export const YOUTUBE_ERROR = {
  CANNOT_EXTRACT_KEYWORD: (url: string) =>
    `Could not extract keyword from '${url}'.`,
  CHANNEL_NOT_FOUND: (searchQuery: string) =>
    `Cannot find a channel corresponding to '${searchQuery}'.`,
  CANNOT_GET_CHANNEL_INFO:
    'Failed to get channel information from API response.',
  WRONG_URL: (url) => `${url} is not a valid YouTube URL.`,
};
