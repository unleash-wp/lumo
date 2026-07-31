/**
 * `lumo skills`: one grip to both layers of the stack.
 *
 * The WordPress agent skills (github.com/WordPress/agent-skills,
 * GPL-2.0-or-later) are the MANUAL: how to build blocks, themes, REST routes,
 * plugins the current way. Lumo is the WATCHER: what just broke, what is
 * deprecated, what your AI got wrong. The two are designed as companions.
 * Lumo's own marketplace copy says exactly that.
 *
 * Deliberately NOT vendored into this package: the skills are actively
 * maintained upstream with their own installer and their own licence. A frozen
 * copy inside Lumo would rot from day one: the freshness product must not
 * ship staling copies. This command delegates to the official installer and
 * inherits the terminal so their prompts reach the user directly.
 */

import { spawn } from 'node:child_process';

export function installWordPressAgentSkills(): Promise<void> {
  console.log(
    [
      'Installing the WordPress agent skills (WordPress/agent-skills).',
      'They are the manual; Lumo is the watcher, built to run side by side.',
      'Licence: GPL-2.0-or-later, published in the WordPress GitHub organisation.',
      '',
    ].join('\n'),
  );

  return new Promise((resolve) => {
    const child = spawn('npx', ['-y', 'skills', 'add', 'WordPress/agent-skills'], {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.on('error', () => {
      console.error(
        'Could not run npx. Install the skills manually:\n' +
          '  npx skills add WordPress/agent-skills\n' +
          'or clone github.com/WordPress/agent-skills and run its installer.',
      );
      process.exitCode = 1;
      resolve();
    });
    child.on('close', (code) => {
      if (code !== 0) {
        console.error(
          '\nThe official installer exited with code ' + code + '. Manual path:\n' +
            '  npx skills add WordPress/agent-skills',
        );
        process.exitCode = code ?? 1;
      }
      resolve();
    });
  });
}
