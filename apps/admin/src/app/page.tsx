import { Button } from '@src/components/Button/Button';
import { flex } from '@styled-system/patterns';

export default function Home() {
  return (
    <div className={flex({ fontWeight: 'bold' })}>
      <Button size="lg" variant="primary">
        RUN
      </Button>
    </div>
  );
}
