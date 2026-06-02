const net = require('net');
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const arg = process.argv[2]; // e.g. notebooks-antigravityide or visualization-antigravityide
const bundlePath = process.argv[3]; // e.g. path to mcp_proxy_bundle.js

if (!arg || !bundlePath) {
  console.error("Usage: node mcp_proxy_wrapper.js <serverId_or_socketPath> <bundlePath>");
  process.exit(1);
}

// Resolve socket path
function getSocketPath(idOrPath) {
  if (path.isAbsolute(idOrPath)) return idOrPath;
  if (idOrPath.startsWith("\\\\?\\pipe\\")) return idOrPath;
  if (process.platform === "win32") {
    return path.join("\\\\?\\pipe\\", `datacloud-mcp-${idOrPath}`);
  }
  return path.join(os.tmpdir(), `datacloud-mcp-${idOrPath}.sock`);
}

const socketPath = getSocketPath(arg);
console.error(`[MCP Wrapper] Waiting for socket path: ${socketPath}`);

let attempts = 0;
const maxAttempts = 150; // Retry for up to 5 minutes (150 * 2000ms)
const retryDelay = 2000;

function checkAndStart() {
  attempts++;
  
  // Try to connect to the socket
  const client = net.createConnection(socketPath);
  
  client.on("connect", () => {
    client.end();
    console.error(`[MCP Wrapper] Socket is active! Spawning proxy bundle...`);
    
    // Spawn the actual proxy bundle with stdio inherit to bridge standard input/output
    const proxy = spawn("node", [bundlePath, arg], {
      stdio: "inherit"
    });
    
    proxy.on("exit", (code) => {
      process.exit(code || 0);
    });
  });
  
  client.on("error", (err) => {
    if (err.code === "ENOENT" || err.code === "ECONNREFUSED") {
      if (attempts < maxAttempts) {
        if (attempts % 5 === 0) {
          console.error(`[MCP Wrapper] Connection attempt ${attempts}/${maxAttempts} failed. Retrying in ${retryDelay}ms...`);
        }
        setTimeout(checkAndStart, retryDelay);
        return;
      }
    }
    console.error(`[MCP Wrapper] Socket failed to become active after ${attempts} attempts: ${err.message}`);
    process.exit(1);
  });
}

checkAndStart();
