export const meta = {
  name: 'tdd',
  description: 'Two-agent TDD: test-writer writes failing tests (red, verified), implementer makes them pass without touching them (green, verified)',
  whenToUse: 'The user asks for test-driven development, red/green, or "tester + implementer" on a change. args: a task string, or { task, suite?, maxAttempts?, id? }.',
  phases: [
    { title: 'Red', detail: 'test-writer writes tests; gate checks they exist and FAIL, then fingerprints them' },
    { title: 'Green', detail: 'implementer makes them pass; gate checks tests are untouched and PASS' },
  ],
}

// ---------------------------------------------------------------------------
// args: "add a slugify(str) helper ..."  or
//       { task: "...", suite: "npm test", maxAttempts: 3, id: "slugify" }
//   task         what to build (required)
//   suite        optional full-suite command the green gate must also pass
//   maxAttempts  implementer attempts before giving up (default 3)
//   id           optional name for the state dir (default: hash of task)
//
// Hard guarantees come from shell gates, not from the agents' word:
//   red gate   -> manifest exists, every listed test file exists, the test
//                 command FAILS; then sha256 of every test file is recorded.
//   green gate -> sha256 of every test file unchanged, test command PASSES,
//                 and the optional suite passes.
// State lives in /tmp/pi-tdd/<id>/ (files, cmd, sha, *.log).
// ---------------------------------------------------------------------------

const input = typeof args === 'string' ? { task: args } : (args || {})
const task = String(input.task || '').trim()
if (!task) throw new Error('tdd workflow needs a task: pass a string or { task }')
const maxAttempts = Math.max(1, Number(input.maxAttempts) || 3)
const suite = input.suite ? String(input.suite) : ''

function hash(s) {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0
  return h.toString(36)
}
const id = String(input.id || hash(task)).replace(/[^A-Za-z0-9._-]/g, '-')
const D = '/tmp/pi-tdd/' + id

const SH_PRELUDE = [
  `D='${D}'`,
  'H() { if command -v sha256sum >/dev/null 2>&1; then sha256sum "$@"; else shasum -a 256 "$@"; fi; }',
].join('\n')

const RED_GATE = [
  SH_PRELUDE,
  'test -s "$D/files" || { echo "RED GATE: manifest $D/files is missing or empty"; exit 1; }',
  'test -s "$D/cmd" || { echo "RED GATE: test command file $D/cmd is missing or empty"; exit 1; }',
  ': > "$D/sha"',
  'while IFS= read -r f || [ -n "$f" ]; do',
  '  [ -n "$f" ] || continue',
  '  [ -f "$f" ] || { echo "RED GATE: listed test file not found: $f"; exit 1; }',
  '  H "$f" >> "$D/sha" || exit 1',
  'done < "$D/files"',
  'if sh "$D/cmd" > "$D/red.log" 2>&1; then',
  '  echo "RED GATE: tests PASS before any implementation, so they do not capture the new behavior."',
  '  tail -n 30 "$D/red.log"; exit 1',
  'fi',
  'echo "red confirmed: tests fail"; tail -n 20 "$D/red.log"',
].join('\n')

const GREEN_GATE = [
  SH_PRELUDE,
  'if ! H -c "$D/sha" > "$D/tamper.log" 2>&1; then',
  '  echo "TAMPERED: test files changed since the red step:"; grep -v ": OK$" "$D/tamper.log"; exit 3',
  'fi',
  'if ! sh "$D/cmd" > "$D/green.log" 2>&1; then',
  '  echo "GREEN GATE: target tests still fail:"; tail -n 40 "$D/green.log"; exit 1',
  'fi',
  suite
    ? `if ! ( ${suite} ) > "$D/suite.log" 2>&1; then echo "GREEN GATE: full suite fails:"; tail -n 40 "$D/suite.log"; exit 1; fi`
    : ':',
  'echo "green confirmed: tests untouched and passing"',
].join('\n')

const errOf = label => (typeof agentError === 'function' ? agentError(label) : undefined) || 'unknown error'
const notUserStop = e => !/^(Skipped by user|Stopped)/.test(e)

// Cheap child whose only purpose is to run a gate after a resumed agent
// (resume cannot carry a gate itself).
const checkGate = (label, gate, ph) =>
  agent('Reply with exactly "ok". Do not use any tools.', {
    label, phase: ph, gate, agentType: 'Explore', effort: 'minimal',
  })

// ------------------------------------------------------------------- Red --
phase('Red')
log(`state dir: ${D}`)

const redPrompt = `Write failing tests for this change:

${task}

Besides your normal report, you MUST write two files (create the directory, overwrite if they exist):
- ${D}/files : the test files you created or changed, one path per line, relative to the current working directory. List only test files.
- ${D}/cmd   : a single shell command, run from the current working directory, that runs exactly these tests and exits non-zero while they fail.

After you finish, an automated gate fingerprints every listed file and runs ${D}/cmd. It must FAIL now. After this step the listed files are frozen: the implementer cannot change them.`

let red = await agent(redPrompt, { label: 'test-writer', agentType: 'test-writer', gate: RED_GATE })

let redErrLabel = 'test-writer'
for (let i = 1; red === null && i <= 2; i++) {
  const err = errOf(redErrLabel)
  if (!notUserStop(err)) return { status: 'stopped', step: 'red', error: err, stateDir: D }
  log(`red gate failed (fix ${i}/2): ${err.split('\n')[0]}`)
  const fixed = await agent(
    `The automated red gate rejected your work:\n\n${err}\n\nFix it. Remember ${D}/files and ${D}/cmd, and the tests must FAIL for the right reason.`,
    { label: 'test-writer', resume: 'test-writer' },
  )
  if (fixed === null) break
  const ok = await checkGate(`red-gate-${i}`, RED_GATE, 'Red')
  if (ok !== null) red = fixed
  redErrLabel = `red-gate-${i}`
}
if (red === null) return { status: 'red-failed', error: errOf(redErrLabel), stateDir: D }

// ----------------------------------------------------------------- Green --
phase('Green')

const greenPrompt = `Make the failing tests pass.

The requested change was:
${task}

The test-writer agent reported:
${red}

The frozen test files are listed in ${D}/files and the target test command is in ${D}/cmd (run it with: sh ${D}/cmd).
${suite ? `The full suite command is: ${suite}\n` : ''}
An automated gate fingerprints those test files: any change to them (edit, delete, rename, reformat) fails the run immediately and cannot be fixed later. Change implementation code only. If a test is wrong, stop and explain instead.`

let green = await agent(greenPrompt, { label: 'implementer', agentType: 'implementer', gate: GREEN_GATE })
let attempt = 1

while (green === null && attempt < maxAttempts) {
  const err = errOf(attempt === 1 ? 'implementer' : `green-gate-${attempt - 1}`)
  if (!notUserStop(err)) return { status: 'stopped', step: 'green', error: err, stateDir: D, red }
  if (/^TAMPERED/.test(err)) return { status: 'tampered', error: err, stateDir: D, red }
  log(`green gate failed (attempt ${attempt}/${maxAttempts}): ${err.split('\n')[0]}`)
  const fixed = await agent(
    `The automated green gate rejected your work:\n\n${err}\n\nKeep going. Implementation code only; the tests are frozen.`,
    { label: 'implementer', resume: 'implementer' },
  )
  if (fixed === null) break
  const ok = await checkGate(`green-gate-${attempt}`, GREEN_GATE, 'Green')
  if (ok !== null) green = fixed
  attempt++
}

if (green === null) {
  const err = errOf(attempt === 1 ? 'implementer' : `green-gate-${attempt - 1}`)
  return { status: /^TAMPERED/.test(err) ? 'tampered' : 'green-failed', attempts: attempt, error: err, stateDir: D, red }
}

log('red -> green verified by gates. Review with: git status && git diff')
return { status: 'green', attempts: attempt, stateDir: D, red, green }
