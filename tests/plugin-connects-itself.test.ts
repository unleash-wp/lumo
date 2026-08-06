import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * The plugin's own manifests, against the contract Claude Code actually reads.
 *
 * None of this is exercised by any other test: a plugin manifest is data a
 * different program parses, and the way it fails is that a user installs the
 * plugin, sees no `lumo_*` tools, and has no error to report. So the shape is
 * asserted directly.
 *
 * The contract was read off Anthropic's own `plugin-dev` plugin rather than
 * recalled -- `.claude-plugin/plugin.json` for the plugin, a root `.mcp.json`
 * for its servers, `type: "http"` with a `url` for a hosted one.
 */

const json = (p: string): any => JSON.parse(readFileSync(p, 'utf8'));

describe('the plugin declares the hosted server', () => {
  const mcp = json('.mcp.json');

  it('BELL: one server, over https, at the hosted MCP endpoint', () => {
    expect(Object.keys(mcp.mcpServers)).toEqual(['lumo']);
    const lumo = mcp.mcpServers.lumo;
    expect(lumo.type).toBe('http');
    expect(lumo.url).toBe('https://mcp.unleash-wp.com/mcp');
  });

  it('BELL: it carries NO Authorization header, and that is the feature', () => {
    /**
     * The absence is the whole point and it is invisible in the file, which is
     * why it is asserted here: `.mcp.json` has no comments, so nothing in it
     * can say why a header a reader expects is missing.
     *
     * With a header the plugin would need a key from somewhere -- an
     * environment variable the user sets by hand, which is the step this
     * removes. Without one the first call gets a 401 carrying
     * WWW-Authenticate, and Claude Code runs the OAuth flow on its own.
     *
     * A hardcoded token here would be worse than useless: this repository is
     * public.
     */
    expect(mcp.mcpServers.lumo.headers).toBeUndefined();
    expect(JSON.stringify(mcp)).not.toMatch(/authorization|bearer|token|key/i);
  });

  it('SILENCE: no command, no args -- nothing is spawned locally', () => {
    // A stdio entry here would run something on the user's machine at plugin
    // load. The local engine is a separate, deliberate `npx` install.
    expect(mcp.mcpServers.lumo.command).toBeUndefined();
    expect(mcp.mcpServers.lumo.args).toBeUndefined();
  });
});

describe('the manifests are the shape Claude Code reads', () => {
  it('BELL: the plugin manifest has the required identity fields', () => {
    const plugin = json('.claude-plugin/plugin.json');
    expect(plugin.name).toBe('lumo');
    expect(typeof plugin.description).toBe('string');
    expect(plugin.description.length).toBeGreaterThan(20);
    expect(plugin.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('BELL: the marketplace lists this plugin from this directory', () => {
    const market = json('.claude-plugin/marketplace.json');
    expect(market.name).toBe('unleashwp-lumo');
    const entry = market.plugins.find((p: any) => p.name === 'lumo');
    expect(entry).toBeDefined();
    // `./` -- the plugin is this repository, so `/plugin marketplace add
    // unleash-wp/lumo` followed by `/plugin install lumo` is the whole
    // install. A path pointing at a subdirectory that does not exist installs
    // nothing and says so only in a debug log.
    expect(entry.source).toBe('./');
  });

  it('BELL: the version in both manifests matches the package', () => {
    // Three files carry it. Two agreeing and one drifting is how a user
    // installs 0.4.1 and gets told it is something else.
    const pkg = json('package.json').version;
    expect(json('.claude-plugin/plugin.json').version).toBe(pkg);
    expect(
      json('.claude-plugin/marketplace.json').plugins.find((p: any) => p.name === 'lumo').version,
    ).toBe(pkg);
  });
});

describe('what the plugin tells people to do', () => {
  it('BELL: the binding skill stops asking for a key', () => {
    // It is the file that speaks when the tools are missing, so it is exactly
    // where a stale "paste your Bearer token" would be followed.
    const skill = readFileSync('skills/wp-binding/SKILL.md', 'utf8');
    // Whitespace-tolerant: the sentence is wrapped and carries emphasis
    // markers, so a literal match would fail on formatting rather than on
    // meaning -- and would keep failing every time the paragraph reflows.
    expect(skill.replace(/[*\s]+/g, ' ')).toMatch(/do not ask the user for a key/i);
    expect(skill).not.toMatch(/\+ Bearer/);
  });

  it('SILENCE: no live document names a payment provider we left', () => {
    // Dodo is merchant of record. Telling a customer to look for a Lemon
    // Squeezy licence sends them to a company that did not charge them.
    for (const file of ['README.md', 'skills/wp-binding/SKILL.md']) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/Lemon Squeezy/i);
    }
  });
});
