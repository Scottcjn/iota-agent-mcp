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
export {};
//# sourceMappingURL=index.d.ts.map