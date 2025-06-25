import { SSMScript } from '@packages/scripts';

const script = new SSMScript({
  packageName: 'database',
});

await script.execute();
