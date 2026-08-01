/**
 * `lumo check` entry: prints whole-file catch results and exits.
 */
import { runCheck } from './run-check.js';

const args = process.argv.slice(2).filter((a) => a !== 'check');
const failOnLoud = args.includes('--ci') || process.env['LUMO_FAIL_ON_LOUD'] === 'true';
const paths = args.filter((a) => a !== '--ci' && a !== '--fail-on-loud');

const { lines, exitCode } = await runCheck(paths, { failOnLoud });
for (const line of lines) {
  console.log(line);
}
process.exitCode = exitCode;
