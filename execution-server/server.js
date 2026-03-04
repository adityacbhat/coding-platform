require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const app = express();
app.use(express.json({ limit: '2mb' }));

const PYTHON_CMD = process.env.PYTHON_EXECUTABLE ?? 'python';
const EXEC_TIMEOUT_MS = 10_000;

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/execute', (req, res) => {
  const { code } = req.body;
  const id = crypto.randomBytes(8).toString('hex');
  const tmpFile = path.join(os.tmpdir(), `exec_${id}.py`);

  fs.writeFileSync(tmpFile, code, 'utf8');

  let stdout = '';
  let stderr = '';
  let finished = false;

  const proc = spawn(PYTHON_CMD, [tmpFile]);

  const timer = setTimeout(() => {
    if (finished) return;
    finished = true;
    proc.kill();
    fs.unlink(tmpFile, () => {});
    res.json({ stdout: '', stderr: 'Time limit exceeded', exitCode: 1 });
  }, EXEC_TIMEOUT_MS);

  proc.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
  proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

  proc.on('close', (code) => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    fs.unlink(tmpFile, () => {});
    res.json({ stdout, stderr, exitCode: code ?? 0 });
  });
});

const PORT = parseInt(process.env.PORT ?? '3001', 10);
app.listen(PORT, () => console.log(`Execution server running on http://localhost:${PORT}`));
