import { Button } from '@src/components/Button';
import { Input } from '@src/components/Input';
import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { MdSearch } from 'react-icons/md';

interface SearchFiltersProps {
  startDate: string;
  endDate: string;
  channelFilter: string;
  onlyLikedChannels: boolean;
  isLoading: boolean;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onChannelFilterChange: (filter: string) => void;
  onOnlyLikedChannelsChange: (checked: boolean) => void;
  onSearch: () => void;
}

export function SearchFilters({
  startDate,
  endDate,
  channelFilter,
  onlyLikedChannels,
  isLoading,
  onStartDateChange,
  onEndDateChange,
  onChannelFilterChange,
  onOnlyLikedChannelsChange,
  onSearch,
}: SearchFiltersProps) {
  return (
    <div className={flex({ gap: '1rem', mb: '2rem', alignItems: 'end', flexWrap: 'wrap' })}>
      <div>
        <Input
          label="시작 날짜"
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          size="md"
          variant="outline"
        />
      </div>

      <div>
        <Input
          label="종료 날짜"
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          size="md"
          variant="outline"
        />
      </div>

      <div>
        <Input
          label="채널 검색"
          type="text"
          placeholder="채널 ID 또는 채널명"
          value={channelFilter}
          onChange={(e) => onChannelFilterChange(e.target.value)}
          size="md"
          variant="outline"
          style={{ minWidth: '200px' }}
        />
      </div>

      <div className={css({ display: 'flex', alignItems: 'center', gap: '0.5rem', mb: '0.5rem' })}>
        <input
          id="onlyLikedChannels"
          type="checkbox"
          checked={onlyLikedChannels}
          onChange={(e) => onOnlyLikedChannelsChange(e.target.checked)}
          className={css({
            w: '1rem',
            h: '1rem',
            cursor: 'pointer',
          })}
        />
        <label
          htmlFor="onlyLikedChannels"
          className={css({
            fontSize: '0.9rem',
            fontWeight: '500',
            color: 'text.secondary',
            cursor: 'pointer',
          })}
        >
          좋아요한 채널만
        </label>
      </div>

      <Button
        type="button"
        onClick={onSearch}
        disabled={isLoading}
        variant="primary"
        size="md"
        isLoading={isLoading}
        loadingText="검색 중..."
        className={css({
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        })}
      >
        <MdSearch />
        검색
      </Button>
    </div>
  );
}
