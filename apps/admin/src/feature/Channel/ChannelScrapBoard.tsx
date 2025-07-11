import { css } from '@styled-system/css';

type ChannelScrapBoardProps = {
  youtubeInfo: {
    title: string;
    thumbnail: string;
  }[];
};

export function ChannelScrapBoard({ youtubeInfo }: ChannelScrapBoardProps) {
  return (
    <div
      className={css({
        display: 'flex',
        justifyContent: 'left',
        alignItems: 'center',
        flexDir: 'column',
        w: '50%',
      })}
    >
      {youtubeInfo.length === 0 && '스크랩 대상이 없습니다'}
      {youtubeInfo.length !== 0 && (
        <div>
          <ul>
            {youtubeInfo.map((info) => (
              <li key={info.title}>{info.title}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
