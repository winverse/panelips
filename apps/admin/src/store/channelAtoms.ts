import { uniqBy } from 'es-toolkit';
import { atom } from 'jotai';

export const channelsAtom = atom<string[]>([]);

export const channelUrlAtom = atom<string>('');

export const scrapTargetChannelsAtom = atom<ScrapChannel[]>([]);

export const isScrapingInProgressAtom = atom<boolean>(false);

export const addChannelAtom = atom(
  null,
  (get, set, url: string): { success: boolean; message: string } => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      return { success: false, message: 'URL을 입력해주세요.' };
    }

    try {
      const parseUrl = new URL(trimmedUrl);
      const { origin, pathname } = parseUrl;

      if (!origin.includes('youtube.com') && !origin.includes('youtu.be')) {
        return { success: false, message: '유튜브 URL만 입력 가능합니다.' };
      }

      const channelId = pathname.split('/')[1];
      if (!channelId) {
        return { success: false, message: '유효하지 않은 채널 URL 형식입니다.' };
      }

      const normalizedUrl = decodeURIComponent(`${origin}/${channelId}`);
      const currentChannels = get(channelsAtom);

      if (currentChannels.includes(normalizedUrl)) {
        return { success: false, message: '이미 추가된 채널입니다.' };
      }

      set(channelsAtom, [...currentChannels, normalizedUrl]);
      return { success: true, message: '채널이 성공적으로 추가되었습니다.' };
    } catch (_error) {
      return { success: false, message: '올바른 URL 형식이 아닙니다.' };
    }
  },
);

export const removeChannelAtom = atom(null, (get, set, url: string) => {
  const currentChannels = get(channelsAtom);
  set(
    channelsAtom,
    currentChannels.filter((channel) => channel !== url),
  );
});

export const addScrapChannelAtom = atom(null, (get, set, channels: ScrapChannel[]) => {
  const current = get(scrapTargetChannelsAtom);
  const uniqueChannels = uniqBy([...current, ...channels], (channel) => channel.url);
  set(scrapTargetChannelsAtom, uniqueChannels);
});

export const removeScrapTargetChannelAtom = atom(null, (get, set, url: string) => {
  const currentTargetChannels = get(scrapTargetChannelsAtom);
  set(
    scrapTargetChannelsAtom,
    currentTargetChannels.filter((channel) => channel.url !== url),
  );
});

export const clearAllChannelsAtom = atom(null, (_get, set) => {
  set(channelsAtom, []);
});

export const clearAllScrapTargetChannelsAtom = atom(null, (_get, set) => {
  set(scrapTargetChannelsAtom, []);
});

export type ScrapChannel = {
  title: string;
  url: string;
  thumbnail?: string | undefined;
  description: string;
  channelId: string;
};
