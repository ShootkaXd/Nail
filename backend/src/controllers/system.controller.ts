import { Request, Response } from 'express'
import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'

const execFileAsync = promisify(execFile)
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf-8'))

async function git(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd: path.join(__dirname, '../../..') })
  return stdout.trim()
}

// Version info + whether a newer commit exists on the remote
export async function versionInfo(_req: Request, res: Response) {
  try {
    const current = await git(['rev-parse', '--short', 'HEAD'])
    let branch = 'unknown'
    try { branch = await git(['rev-parse', '--abbrev-ref', 'HEAD']) } catch { /* ignore */ }
    res.json({ version: pkg.version, commit: current, branch })
  } catch {
    res.json({ version: pkg.version, commit: 'unknown', branch: 'unknown' })
  }
}

// Check the remote for updates (does not apply them)
export async function checkUpdates(_req: Request, res: Response) {
  try {
    await git(['fetch', '--quiet'])
    const local = await git(['rev-parse', 'HEAD'])
    const branch = await git(['rev-parse', '--abbrev-ref', 'HEAD'])
    let remote = local
    try { remote = await git(['rev-parse', `origin/${branch}`]) } catch { /* ignore */ }
    const behind = local !== remote
    let log = ''
    if (behind) {
      try { log = await git(['log', '--oneline', `${local}..origin/${branch}`]) } catch { /* ignore */ }
    }
    res.json({ updateAvailable: behind, local: local.slice(0, 7), remote: remote.slice(0, 7), changes: log })
  } catch (e) {
    res.status(500).json({ error: 'Не удалось проверить обновления', detail: (e as Error).message })
  }
}
