#!/usr/bin/env node
// dsh-mobile — 把 DeepSeek Harness 装进你的口袋
//
// 用法：
//   dsh-mobile                 # 局域网模式：手机同一 WiFi 扫码访问
//   dsh-mobile --public        # 公网模式：cloudflared 隧道，人在外面也能访问
//   dsh-mobile --port 3081     # 自定义代理端口（默认 3081；dsh web 保持 3080）
//
// 前提：dsh web 已在 127.0.0.1:3080 运行。
// 手机看到的界面 = 电脑上的界面，实时同步（WebSocket 流式透传）。

import { networkInterfaces } from 'node:os';
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { randomBytes, randomInt } from 'node:crypto';
import { createPocketProxy, classifyHost } from '../lib/proxy.mjs';
import { startQuickTunnel } from '../lib/tunnel.mjs';

const require = createRequire(import.meta.url);

/** 自定义密码的最短长度（issue #40：别让人设 `1234`）。 */
export const MIN_PIN_LENGTH = 6;

export function parseArgs(argv) {
  const args = {
    port: 3081,
    host: '0.0.0.0',
    public: false,
    upstream: { host: '127.0.0.1', port: 3080 },
    pin: null,
    noAuth: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--public') args.public = true;
    else if (a === '--port') args.port = Number(argv[++i]) || 3081;
    else if (a === '--host') args.host = argv[++i] ?? '0.0.0.0';
    else if (a === '--pin') args.pin = String(argv[++i] ?? '');
    else if (a === '--no-auth') args.noAuth = true;
    else if (a === '--help' || a === '-h') { printHelp(); process.exit(0); }
  }
  return args;
}

/**
 * 决定本次运行用哪个访问密码（issue #90 第 8 条）。
 *
 * CLI 此前**完全不构造 auth**，且默认监听 `0.0.0.0`——任何能连到这个端口的人都能
 * 直接操作 dsh web，而 dsh web 能在宿主机上执行任意代码。插件版一直有 PIN，
 * 只有 CLI 这条路是裸的，属实是缺陷而非取舍。
 *
 * 修法上刻意**不改默认监听地址**：CLI 的主用法就是「手机连同一 WiFi 扫码」，
 * 默认绑 loopback 等于把这个功能废掉。改成默认生成 PIN，并把它内嵌进二维码的
 * `?token=` —— 扫码体验完全不变，手动敲地址的人才会看到登录页。
 *
 * 优先级：`--pin` > `DSH_MOBILE_PIN` > CSPRNG 随机生成。
 * @returns {{ pin: string|null, source: 'flag'|'env'|'generated'|'disabled', error?: string }}
 */
export function resolvePin({ pin = null, noAuth = false } = {}, env = {}) {
  if (noAuth) return { pin: null, source: 'disabled' };
  const explicit = pin != null && pin !== '' ? { value: String(pin), source: 'flag' }
    : (env.DSH_MOBILE_PIN ? { value: String(env.DSH_MOBILE_PIN), source: 'env' } : null);
  if (explicit) {
    if (explicit.value.length < MIN_PIN_LENGTH) {
      return {
        pin: null,
        source: explicit.source,
        error: `La contraseña de acceso debe tener al menos ${MIN_PIN_LENGTH} caracteres (ahora tiene ${explicit.value.length}).`
          + ` Una contraseña débil no aguanta ni unos minutos en internet.`,
      };
    }
    return { pin: explicit.value, source: explicit.source };
  }
  return { pin: String(randomInt(10_000_000, 100_000_000)), source: 'generated' };
}

/**
 * 构造给 createPocketProxy 的 auth（issue #90 第 8 条）。
 * `isProtected` 与插件版语义保持一致：本机免密（能在本机直连本来就说明已经上了机器），
 * 局域网与公网一律要密码。返回 null 表示不启用认证（`--no-auth`）。
 */
export function buildAuth(pin) {
  if (!pin) return null;
  return {
    sessionKey: randomBytes(32).toString('hex'),
    isProtected: (host) => classifyHost(host) !== 'loopback',
    getToken: () => pin,
  };
}

/** 把访问密码拼进入口 URL，让二维码扫了就能直达（与插件版一致）。 */
export function entryUrl(base, pin) {
  if (!pin) return base;
  const u = new URL(base);
  u.searchParams.set('token', pin);
  return u.toString();
}

function printHelp() {
  console.log(`dsh-mobile — accede desde el móvil al DeepSeek Harness de tu ordenador

Uso:
  dsh-mobile              modo red local (móvil en la misma Wi-Fi)
  dsh-mobile --public     modo público (túnel cloudflared, desde cualquier lugar)
  dsh-mobile --port 3081  puerto del proxy personalizado
  dsh-mobile --host       dirección de escucha personalizada (0.0.0.0 por defecto)
  dsh-mobile --pin <val>  contraseña de acceso personalizada (mínimo ${MIN_PIN_LENGTH} caracteres; también DSH_MOBILE_PIN)
  dsh-mobile --no-auth    desactiva la contraseña de acceso (no recomendado; ver abajo)
  dsh-mobile --help       ayuda

Requisito: dsh web debe estar ejecutándose en 127.0.0.1:3080 (npx @deepseek-ai/dsh web).

Aviso de seguridad: dsh web puede ejecutar código en este equipo. Por defecto se genera
una contraseña de acceso aleatoria de 8 caracteres y se incluye en el código QR (escanea
y entra); si escribes la dirección a mano tendrás que introducirla. El acceso local no
pide contraseña. --no-auth permite que cualquiera que alcance el puerto controle dsh web:
úsalo solo en una red totalmente de confianza.
`);
}

function lanIPv4() {
  const addrs = [];
  for (const ifaces of Object.values(networkInterfaces())) {
    for (const i of ifaces ?? []) {
      if (i.family === 'IPv4' && !i.internal) addrs.push(i.address);
    }
  }
  return addrs[0] ?? null;
}

function printQr(url, label) {
  const qrcodeTerminal = require('qrcode-terminal');
  console.log(`\n${label}\n  ${url}`);
  qrcodeTerminal.generate(url, { small: true }, (qr) => console.log(qr));
  console.log('');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const resolved = resolvePin(args, process.env);
  if (resolved.error) {
    console.error(`❌ ${resolved.error}`);
    process.exit(1);
  }
  const pin = resolved.pin;
  const auth = buildAuth(pin);

  console.log('🚀 Iniciando dsh-mobile…');
  const { port, close } = await createPocketProxy({ ...args, auth });

  if (pin) {
    console.log(`\n🔐 Contraseña de acceso: ${pin}${resolved.source === 'generated' ? ' (generada al azar en esta ejecución)' : ''}`);
    console.log('   El código QR ya incluye la contraseña: escanea y entra. Si escribes la dirección a mano, tendrás que introducirla. El acceso local no pide contraseña.');
    if (resolved.source === 'generated') {
      console.log(`   Contraseña fija: --pin <valor> o DSH_MOBILE_PIN=<valor>`);
    }
  } else {
    console.log('\n⚠️  Has desactivado la contraseña con --no-auth.');
    console.log('   dsh web puede ejecutar código arbitrario en este equipo: ahora cualquiera que alcance');
    console.log(`   ${args.host}:${args.port} puede controlarlo directamente. Úsalo solo en una red totalmente de confianza.`);
  }

  const lan = lanIPv4();
  if (lan) {
    printQr(entryUrl(`http://${lan}:${port}`, pin), '📶 Acceso por red local (móvil en la misma Wi-Fi):');
  } else {
    console.log('⚠️  No se ha detectado ninguna IP de red local; se omite el código QR de red local');
  }

  // Ctrl+C / kill：停隧道 → 关代理 → 真正退出（修复：之前只停隧道不退出进程）
  const controller = new AbortController();
  let tunnel = null;
  const shutdown = async () => {
    console.log('\n👋 dsh-mobile se ha cerrado');
    controller.abort();
    tunnel?.kill();
    await close().catch(() => {});
    process.exit(130);
  };
  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());

  if (args.public) {
    console.log('🌐 Creando el túnel público (cloudflared)…');
    try {
      tunnel = await startQuickTunnel({ port, signal: controller.signal });
      printQr(entryUrl(tunnel.url, pin), '🌐 Acceso público (desde cualquier lugar):');
      console.log('   El túnel seguirá activo; pulsa Ctrl+C para salir (la próxima vez será otra URL)');
    } catch (err) {
      console.error(`❌ Falló el túnel público: ${err.message} (el código QR de red local sigue disponible)`);
    }
  } else {
    console.log(`   (añade --public para activar el túnel público)`);
  }

  console.log(`✅ dsh-mobile está listo: escanea el código QR de arriba con el móvil y verás la misma interfaz que en el ordenador, en tiempo real.\n   Pulsa Ctrl+C para detenerlo.`);
  await new Promise(() => {});
}

// 只有被直接执行时才启动（测试里 import 本文件拿纯函数时不能把服务跑起来）。
// npm 会把 bin 装成 symlink，argv[1] 是 symlink 路径而 import.meta.url 是真实路径，
// 所以必须先 realpath 再比较，否则装完的 CLI 会变成什么都不做。
const isDirectRun = (() => {
  try {
    return import.meta.url === pathToFileURL(realpathSync(process.argv[1] ?? '')).href;
  } catch {
    return false;
  }
})();

if (isDirectRun) {
  main().catch((err) => {
    console.error(`❌ dsh-mobile: ${err?.message ?? err}`);
    process.exit(1);
  });
}
