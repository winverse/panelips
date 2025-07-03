import { $ } from 'bun';

console.log('🧹 Cleaning dist directory...');
await $`rm -rf dist`;

console.log('🔨 Initial build...');
await $`bunx swc src -d dist --config-file .swcrc`;

console.log('👀 Starting development mode...');
console.log('🔄 Watching for changes...');

// SWC watch와 서버 실행을 병렬로 실행
await Promise.all([
  $`bunx swc src -d dist --config-file .swcrc -w`,
  $`bun run --watch src/main.ts`
]);