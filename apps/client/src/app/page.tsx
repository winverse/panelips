import { flex, stack, vstack } from '@styled-system/patterns';

export default function Home() {
  return (
    <div>
      <div className={flex({ direction: 'row' })}>
        <h1 className={vstack({ color: 'red.500' })}>Hello world</h1>
      </div>
    </div>
  );
}
