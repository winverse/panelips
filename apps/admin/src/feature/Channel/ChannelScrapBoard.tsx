import { scrapTargetChannelsAtom } from '@src/store';
import { css } from '@styled-system/css';
import { useAtom } from 'jotai';

type ChannelScrapBoardProps = {};

export function ChannelScrapBoard() {
  const [channls] = useAtom(scrapTargetChannelsAtom);
  return (
    <div
      className={css({
        display: 'flex',
        alignItems: 'left',
        flexDir: 'column',
        w: '60%',
      })}
    >
      {channls.length === 0 && '스크랩 대상이 없습니다'}
      {channls.length !== 0 && (
        <div>
          <ul>
            {channls.map((info) => (
              <li key={info.title}>
                {info.title}
                {info.thumbnail}
                {info.url}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
