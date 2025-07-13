import { css } from '@styled-system/css';
import { MdLightbulb, MdTv } from 'react-icons/md';

export function ChannelEmptyState() {
  return (
    <li
      className={css({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: '3rem',
        px: '2rem',
        bg: 'background.secondary',
        border: '2px dashed',
        borderColor: 'border.primary',
        borderRadius: '12px',
        textAlign: 'center',
        transition: 'all 0.2s ease',
        _hover: {
          bg: 'background.tertiary',
          borderColor: 'border.secondary',
        },
      })}
    >
      <div
        className={css({
          fontSize: '3rem',
          mb: '1rem',
          opacity: 0.6,
        })}
      >
        <MdTv />
      </div>
      <h4
        className={css({
          fontSize: '1.1rem',
          fontWeight: '600',
          color: 'text.primary',
          mb: '0.5rem',
          m: 0,
        })}
      >
        채널이 없습니다
      </h4>
      <p
        className={css({
          fontSize: '0.9rem',
          color: 'text.secondary',
          mb: '1rem',
          m: 0,
          lineHeight: 1.5,
        })}
      >
        위의 입력창에 유튜브 채널 URL을 입력하여
        <br />첫 번째 채널을 추가해보세요
      </p>
      <div
        className={css({
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          px: '1rem',
          py: '0.5rem',
          bg: 'primary.100',
          color: 'primary.700',
          borderRadius: '20px',
          fontSize: '0.8rem',
          fontWeight: '500',
        })}
      >
        <span>
          <MdLightbulb />
        </span>
        <span>예: https://www.youtube.com/@channelname</span>
      </div>
    </li>
  );
}
