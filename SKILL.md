---
name: iota-agent-mcp
description: "IOTA blockchain MCP server providing wallet management with human-in-the-loop signing, Move smart contract build/test/publish, and on-chain queries via JSON-RPC and GraphQL. Use when interacting with IOTA network from AI coding agents, managing IOTA wallets, building or publishing Move packages, querying on-chain objects or transactions, or checking epoch and network statistics."
---

# IOTA Agent MCP

MCP server that connects AI coding agents to the IOTA blockchain. Provides 18 tools across wallet operations, Move smart contract development, and on-chain data queries — all via stdio transport with no secrets in the MCP process.

## Workflow

1. **Configure the MCP server** in your agent's settings (Claude Code, Cursor, VS Code Copilot)
2. **Query on-chain data** — fetch objects, transactions, coins, epoch info, or decompile modules
3. **Develop Move contracts** — build, test with coverage, generate unsigned publish transactions
4. **Sign and publish** — generate unsigned transaction, submit via `iota_wallet_sign_execute`, check `iota_wallet_pending` for approval status, verify on-chain with `iota_transaction`

### Signing flow (human-in-the-loop)

Wallet operations that modify state require human approval:

1. Call `iota_wallet_sign_execute` with base64-encoded transaction bytes — creates a pending request
2. Call `iota_wallet_pending` to confirm the request was queued
3. The human approves (`iota_wallet_approve`) or rejects (`iota_wallet_reject`) via the agent-wallet server
4. On approval, verify the transaction landed on-chain: call `iota_transaction` with the returned digest
5. If rejected, inform the user and do not retry without explicit instruction

## Tools

### Wallet (8 tools)

- `iota_wallet_address` — Get the active wallet address
- `iota_wallet_balance` — Check IOTA balance for the active wallet
- `iota_wallet_accounts` — List all derived wallet accounts
- `iota_wallet_sign_execute` — Sign and execute a transaction (requires human approval via agent-wallet server)
- `iota_wallet_pending` — List pending signing requests awaiting approval
- `iota_wallet_approve` — Approve a pending signing request by ID
- `iota_wallet_reject` — Reject a pending signing request by ID
- `iota_wallet_switch_network` — Switch between mainnet, testnet, and devnet

### Move CLI (4 tools)

- `iota_cli` — Run any IOTA CLI command (e.g. `client gas`, `move new my_project`)
- `iota_move_build` — Compile a Move package and report build results
- `iota_move_test_coverage` — Run Move tests with coverage analysis and summary
- `iota_move_publish_unsigned` — Generate unsigned publish transaction for agent-wallet signing

### On-Chain Query (6 tools)

- `iota_object` — Fetch object data by ID (owner, type, version, content)
- `iota_objects_by_owner` — List objects owned by an address
- `iota_transaction` — Fetch transaction details by digest (input, effects, events)
- `iota_coins` — Get coin objects for gas estimation and token queries
- `iota_epoch_info` — Current epoch, checkpoint, and network statistics via GraphQL
- `iota_decompile` — Retrieve and decompile a deployed Move module's ABI

## Examples

**Build and test a Move package:**
```
iota_move_build(path: "./my_move_project")
→ "BUILDING my_move_project ... Build Successful"

iota_move_test_coverage(path: "./my_move_project")
→ "## Test Results\nRunning Move unit tests ... 5 tests passed\n\n## Coverage Summary\n85.7% coverage"
```

**Query an on-chain object:**
```
iota_object(object_id: "0xabc123...")
→ { "owner": "0xdef456...", "type": "0x2::coin::Coin<0x2::iota::IOTA>", "version": 42, "content": {...} }
```

**Publish a Move package with wallet signing:**
```
iota_move_publish_unsigned(path: "./my_move_project", gas_budget: "500000000")
→ "AAACAQBk..." (base64 tx bytes)

iota_wallet_sign_execute(tx_bytes: "AAACAQBk...")
→ "Request queued (id: req-1). Awaiting human approval."
```

## Configuration

Set environment variables to override defaults:

- `IOTA_WALLET_SERVER` — Agent wallet server URL (default: `http://localhost:3847`)
- `IOTA_RPC_URL` — IOTA JSON-RPC endpoint (default: mainnet)
- `IOTA_GRAPHQL_URL` — IOTA GraphQL indexer (default: mainnet)

## Setup

```bash
npm install -g iota-agent-mcp
```

```json
// Claude Code: ~/.claude/settings.json
{
  "mcpServers": {
    "iota": { "command": "iota-agent-mcp" }
  }
}
```

```json
// Cursor / VS Code: .cursor/mcp.json or .vscode/mcp.json
{
  "servers": {
    "iota": { "command": "npx", "args": ["iota-agent-mcp"] }
  }
}
```
