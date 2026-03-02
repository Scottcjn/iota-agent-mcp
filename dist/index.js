#!/usr/bin/env node
/**
 * iota-agent-mcp — MCP Server for IOTA Blockchain
 *
 * Architecture: Elyan Labs MCP pattern (elyan-prime derivative)
 *   - Stateless stdio transport (no secrets in process)
 *   - Wallet ops proxy to local agent-wallet server (human-in-the-loop signing)
 *   - On-chain queries via JSON-RPC and GraphQL (no CLI dependency for reads)
 *   - Move CLI tools shell out to `iota` binary (build/test/publish)
 *
 * Tools (14+):
 *   Wallet:  address, balance, accounts, sign_execute, pending, approve, reject, switch_network
 *   CLI:     iota_cli, move_build, move_test_coverage, move_publish_unsigned
 *   Query:   object, decompile, epoch_info, transaction, coins, objects_by_owner
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);
// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const WALLET_SERVER = process.env.IOTA_WALLET_SERVER || "http://localhost:3847";
const IOTA_RPC = process.env.IOTA_RPC_URL || "https://api.mainnet.iota.cafe";
const IOTA_GRAPHQL = process.env.IOTA_GRAPHQL_URL || "https://graphql.mainnet.iota.cafe";
const CMD_TIMEOUT = 60_000; // 60s for CLI commands
const MAX_BUFFER = 10 * 1024 * 1024; // 10MB
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Run a shell command with timeout and buffer limits. */
async function run(cmd, cwd) {
    try {
        const { stdout, stderr } = await execAsync(cmd, {
            cwd,
            maxBuffer: MAX_BUFFER,
            timeout: CMD_TIMEOUT,
            env: { ...process.env },
        });
        return stdout + (stderr ? `\n[stderr]: ${stderr}` : "");
    }
    catch (err) {
        return `Error: ${err.message}\n${err.stdout || ""}\n${err.stderr || ""}`;
    }
}
/** JSON-RPC call to IOTA fullnode. */
async function rpc(method, params = []) {
    try {
        const res = await fetch(IOTA_RPC, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        });
        if (!res.ok)
            return `HTTP ${res.status}: ${res.statusText}`;
        const json = await res.json();
        return JSON.stringify(json.result ?? json.error ?? json, null, 2);
    }
    catch (err) {
        return `RPC error: ${err.message}`;
    }
}
/** GraphQL query against IOTA indexer. */
async function gql(query) {
    try {
        const res = await fetch(IOTA_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
        });
        if (!res.ok)
            return `HTTP ${res.status}: ${res.statusText}`;
        const json = await res.json();
        return JSON.stringify(json.data ?? json.errors ?? json, null, 2);
    }
    catch (err) {
        return `GraphQL error: ${err.message}`;
    }
}
/** HTTP call to local wallet server. */
async function wallet(path, method = "GET", body) {
    try {
        const opts = {
            method,
            headers: { "Content-Type": "application/json" },
        };
        if (body)
            opts.body = JSON.stringify(body);
        const res = await fetch(`${WALLET_SERVER}${path}`, opts);
        if (!res.ok)
            return `Wallet server error ${res.status}: ${res.statusText}`;
        return await res.text();
    }
    catch (err) {
        return `Wallet server unreachable (${WALLET_SERVER}): ${err.message}. Start the agent-wallet server first.`;
    }
}
/** Standard MCP text response. */
function text(t) {
    return { content: [{ type: "text", text: t }] };
}
// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------
const server = new McpServer({
    name: "iota-agent-mcp",
    version: "1.0.0",
});
// ── Wallet Tools ─────────────────────────────────────────────────────────────
server.tool("iota_wallet_address", "Get the active wallet address", {}, async () => text(await wallet("/address")));
server.tool("iota_wallet_balance", "Check IOTA balance for the active wallet", {}, async () => text(await wallet("/balance")));
server.tool("iota_wallet_accounts", "List all derived wallet accounts", {}, async () => text(await wallet("/accounts")));
server.tool("iota_wallet_sign_execute", "Sign and execute a transaction via the agent wallet (human-in-the-loop approval required)", {
    tx_bytes: z.string().describe("Base64-encoded transaction bytes"),
}, async ({ tx_bytes }) => text(await wallet("/sign-execute", "POST", { tx_bytes })));
server.tool("iota_wallet_pending", "List pending signing requests awaiting approval", {}, async () => text(await wallet("/pending")));
server.tool("iota_wallet_approve", "Approve a pending signing request", {
    request_id: z.string().describe("ID of the pending request to approve"),
}, async ({ request_id }) => text(await wallet(`/approve/${request_id}`, "POST")));
server.tool("iota_wallet_reject", "Reject a pending signing request", {
    request_id: z.string().describe("ID of the pending request to reject"),
}, async ({ request_id }) => text(await wallet(`/reject/${request_id}`, "POST")));
server.tool("iota_wallet_switch_network", "Switch between mainnet, testnet, and devnet", {
    network: z.enum(["mainnet", "testnet", "devnet"]).describe("Target network"),
}, async ({ network }) => text(await wallet("/switch-network", "POST", { network })));
// ── CLI & Move Tools ─────────────────────────────────────────────────────────
server.tool("iota_cli", "Run an arbitrary IOTA CLI command. Use for operations not covered by other tools.", {
    command: z.string().describe("CLI arguments (e.g. 'client gas' or 'move new my_project')"),
}, async ({ command }) => text(await run(`iota ${command}`)));
server.tool("iota_move_build", "Build a Move package and report compilation results", {
    path: z.string().optional().describe("Path to Move package directory (default: current dir)"),
}, async ({ path }) => text(await run("iota move build", path || undefined)));
server.tool("iota_move_test_coverage", "Run Move tests with coverage analysis. Returns test results and coverage summary.", {
    path: z.string().optional().describe("Path to Move package directory"),
    filter: z.string().optional().describe("Test name filter pattern"),
}, async ({ path, filter }) => {
    const filterArg = filter ? ` --filter ${filter}` : "";
    const testResult = await run(`iota move test --coverage${filterArg}`, path || undefined);
    const coverageResult = await run("iota move coverage summary", path || undefined);
    return text(`## Test Results\n${testResult}\n\n## Coverage Summary\n${coverageResult}`);
});
server.tool("iota_move_publish_unsigned", "Generate an unsigned publish transaction for a Move package (for agent wallet signing)", {
    path: z.string().optional().describe("Path to Move package directory"),
    gas_budget: z.string().optional().describe("Gas budget in NANOS (default: 500000000)"),
}, async ({ path, gas_budget }) => {
    const budget = gas_budget || "500000000";
    return text(await run(`iota client publish --gas-budget ${budget} --serialize-unsigned-transaction`, path || undefined));
});
// ── On-Chain Query Tools ─────────────────────────────────────────────────────
server.tool("iota_object", "Fetch on-chain object data by ID. Returns owner, type, version, and content.", {
    object_id: z.string().describe("IOTA object ID (0x...)"),
}, async ({ object_id }) => text(await rpc("iota_getObject", [
    object_id,
    { showContent: true, showOwner: true, showType: true },
])));
server.tool("iota_objects_by_owner", "List objects owned by an address", {
    address: z.string().describe("Owner address (0x...)"),
    limit: z.number().optional().describe("Max results (default 10)"),
}, async ({ address, limit }) => text(await rpc("iota_getOwnedObjects", [
    address,
    { filter: null, options: { showType: true, showContent: true } },
    null,
    limit || 10,
])));
server.tool("iota_transaction", "Fetch transaction details by digest", {
    digest: z.string().describe("Transaction digest"),
}, async ({ digest }) => text(await rpc("iota_getTransactionBlock", [
    digest,
    { showInput: true, showEffects: true, showEvents: true },
])));
server.tool("iota_coins", "Get coin objects for an address (useful for gas estimation and token queries)", {
    address: z.string().describe("Owner address (0x...)"),
    coin_type: z.string().optional().describe("Coin type (default: 0x2::iota::IOTA)"),
}, async ({ address, coin_type }) => text(await rpc("iota_getCoins", [address, coin_type || null, null, 10])));
server.tool("iota_epoch_info", "Get current epoch, checkpoint, and network statistics via GraphQL", {}, async () => text(await gql(`{
        epoch {
          epochId
          startTimestamp
          endTimestamp
          referenceGasPrice
        }
        checkpoint {
          sequenceNumber
          timestamp
        }
      }`)));
server.tool("iota_decompile", "Retrieve and decompile a deployed Move module. Returns the module's ABI (structs, functions, type params).", {
    package_id: z.string().describe("Package object ID (0x...)"),
    module_name: z.string().describe("Module name within the package"),
}, async ({ package_id, module_name }) => text(await rpc("iota_getNormalizedMoveModule", [package_id, module_name])));
// ---------------------------------------------------------------------------
// Entry Point
// ---------------------------------------------------------------------------
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map