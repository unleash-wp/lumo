// Lumo panel — the shop window inside AI Forge. Three jobs, nothing more:
// show what is installed (status), hand over the exact commands to reach the
// work surface (setup), and let the visitor see the watchdog bark once on real
// code (try box). The work itself stays in the assistant, the terminal and CI —
// this page points there, it does not replace them.
import { useState, useEffect } from 'react';
import { Box, Flex, Heading, HStack, Stack, Text, Textarea, chakra } from '@chakra-ui/react';
import { useCore } from '../../src/client/core.jsx';
import { Button } from '../../src/client/ui';

const SNIPPETS = [
  {
    label: 'Claude Code / Cursor (MCP)',
    cmd: 'claude mcp add lumo -- npx -y -p @unleashwp/lumo lumo-mcp',
  },
  {
    label: 'Terminal — scan your current changes',
    cmd: 'lumo scan',
  },
  {
    label: 'GitHub Action — review every pull request',
    cmd: '- uses: unleash-wp/lumo@v0.4.0',
  },
];

function StatusChip({ ok, children }) {
  return (
    <chakra.span
      px="2" py="0.5" borderRadius="sm" fontSize="0.75rem" fontWeight="700"
      bg={ok ? 'rgba(34,140,80,.14)' : 'rgba(190,90,20,.14)'}
      color={ok ? '#1f7a46' : '#9a5514'}
      _dark={{ bg: ok ? 'rgba(80,200,130,.18)' : 'rgba(240,150,60,.18)', color: ok ? '#7fd8a8' : '#f0b070' }}
    >
      {children}
    </chakra.span>
  );
}

export default function LumoPanel() {
  const { toast } = useCore();
  const [status, setStatus] = useState(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetch('/api/lumo/status').then((r) => r.json()).then(setStatus).catch(() => setStatus(null));
  }, []);

  const copy = (cmd) => {
    navigator.clipboard.writeText(cmd).then(() => toast('Copied'));
  };

  const runCheck = () => {
    setBusy(true);
    setResult(null);
    fetch('/api/lumo/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language: 'auto' }),
    })
      .then((r) => r.json())
      .then((d) => setResult(d.error ? { found: false, text: d.error } : d))
      .catch((e) => setResult({ found: false, text: String(e) }))
      .finally(() => setBusy(false));
  };

  return (
    <Box maxW="52rem">
      {/* Status — facts only, from the installed snapshot and the local engine. */}
      <Flex align="center" gap="3" mb="6" wrap="wrap">
        {status === null ? (
          <Text fontSize="0.875rem" color="ui.muted">Loading status…</Text>
        ) : (
          <>
            <StatusChip ok>{status.entries} entries</StatusChip>
            {status.generatedAt && <StatusChip ok>knowledge of {status.generatedAt}</StatusChip>}
            <StatusChip ok={status.engine === 'ready'}>
              {status.engine === 'ready' ? 'engine ready' : 'engine not installed'}
            </StatusChip>
          </>
        )}
      </Flex>

      {status && status.engine !== 'ready' && (
        <Text fontSize="0.8125rem" color="ui.muted" mb="6">{status.installHint}</Text>
      )}

      {/* Setup — the shortest path to where Lumo actually works. */}
      <Heading as="h3" fontSize="1rem" mb="3">Where Lumo works</Heading>
      <Stack gap="2" mb="8">
        {SNIPPETS.map((s) => (
          <Flex key={s.cmd} align="center" justify="space-between" gap="3"
            borderWidth="1px" borderColor="ui.border" borderRadius="forge" bg="ui.surface" px="3" py="2">
            <Box minW="0">
              <Text fontSize="0.75rem" color="ui.muted">{s.label}</Text>
              <chakra.code fontSize="0.8125rem" wordBreak="break-all">{s.cmd}</chakra.code>
            </Box>
            <Button size="sm" variant="outline" onClick={() => copy(s.cmd)}>Copy</Button>
          </Flex>
        ))}
      </Stack>

      {/* Try box — one live bark. Honest output, verbatim from the engine. */}
      <Heading as="h3" fontSize="1rem" mb="1">Hear it bark</Heading>
      <Text fontSize="0.8125rem" color="ui.muted" mb="3">
        Paste WordPress PHP or JS. The answer below is the engine&apos;s verbatim output —
        including its own limits.
      </Text>
      <Textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={'<?php\n$id = $_GET["user_id"];\n$rows = $wpdb->get_results( "SELECT * FROM wp_things WHERE user_id = $id" );'}
        fontFamily="mono" fontSize="0.8125rem" rows={6} mb="3"
      />
      <HStack mb="4">
        <Button onClick={runCheck} disabled={busy || !code.trim()}>
          {busy ? 'Checking…' : 'Check this code'}
        </Button>
      </HStack>

      {result && (
        <Box borderWidth="1px" borderColor="ui.border" borderRadius="forge" bg="ui.surface" p="4">
          <chakra.pre fontSize="0.8125rem" whiteSpace="pre-wrap" fontFamily="mono" m="0">
            {result.text}
          </chakra.pre>
        </Box>
      )}
    </Box>
  );
}
