import { $, build } from 'bun';

await $`rm -rf dist`;

const optionalRequirePackages = [
  'class-transformer',
  'class-validator',
  '@nestjs/microservices',
  '@nestjs/websockets',
  '@fastify/static',
  '@fastify/view',
];

const result = await build({
  entrypoints: ['./src/main.ts'],
  outdir: './dist',
  target: 'bun',
  format: 'esm',
  minify: {
    syntax: true,
    whitespace: true,
  },
  external: optionalRequirePackages.filter((pkg) => {
    try {
      require(pkg);
      return false;
    } catch (_) {
      return true;
    }
  }),
  splitting: true,
});

if (!result.success) {
  console.log(result.logs[0]);
  process.exit(1);
}

console.log('Built successfully!');
