/**
 * 剥离 ANSI 转义码（颜色、样式等）
 */
export function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '')
}

/**
 * 从 CLI stdout 中提取纯文本值（剥离 ANSI + 取最后一行非空内容）
 */
export function extractPlainValue(stdout: string): string {
  const clean = stripAnsi(stdout)
  const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean)
  return lines.length ? lines[lines.length - 1] : ''
}

/**
 * 从 CLI stdout 中提取 JSON 对象
 */
export function extractJson(stdout: string) {
  const clean = stripAnsi(stdout)
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  try {
    return JSON.parse(clean.slice(start, end + 1))
  } catch {
    return null
  }
}
