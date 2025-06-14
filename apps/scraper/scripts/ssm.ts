import { SSMScript } from '@packages/scripts';

const script = new SSMScript({
  packageName: 'scraper',
});

await script.execute();
