#!/usr/bin/env node
/**
 * Minimal MCP Streamable HTTP server used to verify the Remote URL transport.
 *
 * Serves JSON responses (no SSE) and, when DEMO_TOKEN is set, requires a
 * matching Bearer token.
 */
import { createServer } from 'node:http'

const PORT = Number(process.env.PORT ?? 7345)
const TOKEN = process.env.DEMO_TOKEN

const TOOLS = [
  {
    name: 'http_echo',
    description: 'Echoes text over the HTTP transport.',
    inputSchema: {
      type: 'object',
      properties: { text: { type: 'string' } },
      required: ['text'],
      additionalProperties: false,
    },
  },
]

function send(response, status, payload) {
  const body = JSON.stringify(payload)
  response.writeHead(status, {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(body),
  })
  response.end(body)
}

const server = createServer((request, response) => {
  if (request.method !== 'POST') {
    send(response, 405, { error: 'method not allowed' })
    return
  }
  if (TOKEN !== undefined) {
    if (request.headers.authorization !== `Bearer ${TOKEN}`) {
      send(response, 401, { error: 'unauthorized' })
      return
    }
  }
  const chunks = []
  request.on('data', chunk => chunks.push(chunk))
  request.on('end', () => {
    let message
    try {
      message = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    } catch {
      send(response, 400, { error: 'invalid json' })
      return
    }
    const id = message.id
    switch (message.method) {
      case 'initialize':
        response.setHeader('mcp-session-id', 'demo-session')
        send(response, 200, {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2025-03-26',
            capabilities: { tools: { listChanged: false } },
            serverInfo: { name: 'dsh-demo-http', version: '1.0.0' },
          },
        })
        return
      case 'notifications/initialized':
        response.writeHead(202)
        response.end()
        return
      case 'tools/list':
        send(response, 200, { jsonrpc: '2.0', id, result: { tools: TOOLS } })
        return
      case 'tools/call': {
        const text = String(message.params?.arguments?.text ?? '')
        send(response, 200, {
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: `http: ${text}` }] },
        })
        return
      }
      case 'ping':
        send(response, 200, { jsonrpc: '2.0', id, result: {} })
        return
      default:
        send(response, 200, {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `method not supported: ${String(message.method)}` },
        })
    }
  })
})

server.listen(PORT, '127.0.0.1', () => {
  process.stdout.write(`demo http mcp server on http://127.0.0.1:${String(PORT)}/mcp\n`)
})
