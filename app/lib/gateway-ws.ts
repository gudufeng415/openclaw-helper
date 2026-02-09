/**
 * OpenClaw Gateway RPC 客户端
 * 通过 `openclaw gateway call` CLI 调用 Gateway 方法
 * CLI 自动处理设备认证和权限（包括 operator.admin），比直接 WebSocket 更可靠
 */
import { execa } from 'execa'
import { extractJson } from './utils'

/**
 * 调用 Gateway 方法
 * @param method  方法名，如 'web.login.start'、'web.login.wait'、'status'
 * @param params  方法参数对象
 * @param timeoutMs  超时时间（毫秒），默认 60 秒
 */
export async function callGatewayMethod(
  method: string,
  params: Record<string, any> = {},
  timeoutMs = 60000,
): Promise<any> {
  try {
    const { stdout } = await execa('openclaw', [
      'gateway',
      'call',
      method,
      '--params',
      JSON.stringify(params),
      '--json',
      '--timeout',
      String(timeoutMs),
    ])

    // 从输出中提取 JSON（跳过 config warnings 等装饰文本）
    const result = extractJson(stdout)
    if (result === null) {
      throw new Error('Gateway 返回了无效的响应')
    }
    return result
  } catch (error: any) {
    // execa 在命令失败时抛出异常，提取有用的错误信息
    const stderr = error.stderr || ''
    const stdout = error.stdout || ''
    const combined = stderr + '\n' + stdout

    // 尝试从输出中提取错误消息
    const errorMatch = combined.match(/Error:\s*(.+)/i)
    if (errorMatch) {
      throw new Error(errorMatch[1].trim())
    }
    throw new Error(error.message || 'Gateway 调用失败')
  }
}
