import { atom } from 'jotai';

export const channelsAtom = atom<string[]>([]);

export const channelUrlAtom = atom<string>('');

export const isScrapingInProgressAtom = atom<boolean>(false);

export const addChannelAtom = atom(null, (get, set, url: string) => {
  const currentChannels = get(channelsAtom);
  if (!currentChannels.includes(url)) {
    set(channelsAtom, [...currentChannels, url]);
    return true;
  }
  return false;
});

export const removeChannelAtom = atom(null, (get, set, url: string) => {
  const currentChannels = get(channelsAtom);
  set(
    channelsAtom,
    currentChannels.filter((channel) => channel !== url),
  );
});

export const clearAllChannelsAtom = atom(null, (get, set) => {
  set(channelsAtom, []);
});
