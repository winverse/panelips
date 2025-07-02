import { SSMScript } from '@packages/scripts';

const script = new SSMScript({
  packageName: 'admin',
});

await script.execute();
