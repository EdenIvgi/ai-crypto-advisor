#!/usr/bin/env node
/**
 * PreToolUse hook: the first time in a session that a history-changing git command is
 * attempted, block it once and point at the workflow doc. Subsequent git commands in the
 * same session run untouched, so this reminds without nagging.
 *
 * Exit 0 = allow. Exit 2 = block and send stderr back to Claude.
 */
import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const GIT_COMMANDS_WORTH_REMINDING =
  /\bgit\s+(commit|push|switch|checkout|branch|merge|rebase|tag)\b|\bgh\s+(pr|repo)\b/

const readHookInput = async () => {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return {}
  }
}

const hookInput = await readHookInput()
const attemptedCommand = hookInput?.tool_input?.command ?? ''

if (!GIT_COMMANDS_WORTH_REMINDING.test(attemptedCommand)) process.exit(0)

const sessionId = hookInput?.session_id ?? 'unknown-session'
const alreadyRemindedMarkerPath = join(
  tmpdir(),
  `ai-crypto-advisor-git-doc-${sessionId}.marker`
)

if (existsSync(alreadyRemindedMarkerPath)) process.exit(0)

writeFileSync(alreadyRemindedMarkerPath, new Date().toISOString())

process.stderr.write(
  'Blocked once, on purpose: read .claude/docs/git-workflow.md before running git or gh ' +
    'commands in this repo (branch naming, Conventional Commits, PR flow, what needs ' +
    'approval). Read it, then re-run the command — this reminder fires only once per session.\n'
)
process.exit(2)
