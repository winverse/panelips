import { Button } from '@src/components/Button';
import { Input } from '@src/components/Input';
import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { MdSearch } from 'react-icons/md';

interface SearchFiltersProps {
  startDate: string;
  endDate: string;
  channelFilter: string;
  isLoading: boolean;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onChannelFilterChange: (filter: string) => void;
  onSearch: () => void;
}

export function SearchFilters({
  startDate,
  endDate,
  channelFilter,
  isLoading,
  onStartDateChange,
  onEndDateChange,
  onChannelFilterChange,
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
