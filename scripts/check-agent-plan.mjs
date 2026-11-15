import { spawnSync } from 'node:child_process';
import path from 'node:path';

console.log('Running unit test verification for AI agent and guided actions...');
const tsxCli = path.resolve('node_modules', 'tsx', 'dist', 'cli.mjs');
const testResult = spawnSync(process.execPath, [tsxCli, '--test', 'tests/guided-actions.test.ts', 'tests/ai-agent-tools.test.ts'], {
  stdio: 'inherit',
});

if (testResult.status !== 0) {
  console.error('Unit tests failed with code', testResult.status);
  process.exit(testResult.status || 1);
}

console.log('All plan verification checks passed.');
