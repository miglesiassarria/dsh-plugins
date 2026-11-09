#!/usr/bin/env node
/**
 * Minimal MCP stdio server used to verify the Tools settings page.
 *
 * Implements the JSON-RPC subset the page and the agent need: initialize,
 * ping, tools/list, and tools/call with newline-delimited framing.
 */
import { createInterface } from 'node:readline'

const PROTOCOL_VERSION = '2025-06-18'

const TOOLS = [
  {
    name: 'echo',
    description: 'Echoes back the provided text.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to echo back.' },
      },
      required: ['text'],
      additionalProperties: false,
    },
  },
  {
    name: 'add',
    description: 'Adds two numbers and returns the sum.',
    inputSchema: {
      type: 'object',
      properties: {
        a: { type: 'number', description: 'First addend.' },
        b: { type: 'number', description: 'Second addend.' },
      },
      required: ['a', 'b'],
      additionalProperties: false,
    },
  },
  {
    name: 'server_info',
    description: 'Reports the host process facts for this demo server.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
]

/** @returns {string} JSON-RPC response line. */
function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`)
}

function reply(id, result) {
  send({ jsonrpc: '2.0', id, result })
}

function replyError(id, code, message) {
  send({ jsonrpc: '2.0', id, error: { code, message } })
}

function callTool(name, args) {
  switch (name) {
    case 'echo':
      return { content: [{ type: 'text', text: String(args.text ?? '') }] }
    case 'add':
      return {
        content: [{ type: 'text', text: String(Number(args.a ?? 0) + Number(args.b ?? 0)) }],
        structuredContent: { sum: Number(args.a ?? 0) + Number(args.b ?? 0) },
      }
    case 'server_info':
      return {
        content: [{
          type: 'text',
          text: `pid=${String(process.pid)} node=${process.version} platform=${process.platform}`,
        }],
      }
    default:
      return { isError: true, content: [{ type: 'text', text: `unknown tool: ${name}` }] }
  }
}

const input = createInterface({ input: process.stdin, crlfDelay: Infinity })
input.on('line', line => {
  const text = line.trim()
  if (text.length === 0) return
  let message
  try {
    message = JSON.parse(text)
  } catch {
    return
  }
  if (message.method === undefined) return
  if (message.id === undefined) return
  switch (message.method) {
    case 'initialize':
      reply(message.id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'dsh-demo-tools', version: '1.0.0' },
        instructions: 'Demo tool server used to check the Tools settings page.',
      })
      break
    case 'ping':
      reply(message.id, {})
      break
    case 'tools/list':
      reply(message.id, { tools: TOOLS })
      break
    case 'tools/call':
      reply(message.id, callTool(message.params?.name, message.params?.arguments ?? {}))
      break
    case 'resources/list':
      reply(message.id, { resources: [] })
      break
    default:
      replyError(message.id, -32601, `method not supported: ${message.method}`)
      break
  }
})

input.on('close', () => {
  process.exit(0)
})
