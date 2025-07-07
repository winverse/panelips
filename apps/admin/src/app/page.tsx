import { GetNewVideo } from '@src/feature/GetNewVideo';
import { RunScrap } from '@src/feature/RunScrap';
import { flex } from '@styled-system/patterns';

export default function Home() {
  return (
    <div className={flex({ p: '0.5rem', gap: '1rem' })}>
      <GetNewVideo />
      <RunScrap />
    </div>
  );
}
