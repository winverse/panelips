import { Button } from '@src/components/Button/Button';
import { css } from '../../styled-system/css';

export default function Home() {
  return (
    <div className={css({ fontSize: '4xl', fontWeight: 'bold', bg: 'red' })}>
      Hello 🐼!
      <p className={css({ bg: 'gold', p: 0, m: 0 })}>hello</p>
      <Button size="sm" variant="primary">
        hello
      </Button>
    </div>
  );
}
