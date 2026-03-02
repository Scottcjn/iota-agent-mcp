# IOTA Agent Skills

## iota-move
Move smart contract development for IOTA.
- Build, test, and publish Move packages
- Test coverage analysis with gap identification
- IOTA-specific Move patterns and best practices

### Tools
- `iota_move_build` — Compile Move packages
- `iota_move_test_coverage` — Run tests with coverage analysis
- `iota_move_publish_unsigned` — Generate unsigned publish transaction
- `iota_cli` — Run any IOTA CLI command

## iota-query
On-chain data retrieval and analysis.
- Fetch objects, transactions, coins by ID or owner
- Epoch and checkpoint statistics
- Module decompilation and ABI inspection

### Tools
- `iota_object` — Fetch object by ID
- `iota_objects_by_owner` — List objects by owner address
- `iota_transaction` — Fetch transaction by digest
- `iota_coins` — Get coin objects for gas/token queries
- `iota_epoch_info` — Current epoch and network stats
- `iota_decompile` — Decompile deployed Move modules

## iota-wallet
Secure wallet management with human-in-the-loop signing.
- Address and balance queries
- Transaction signing with approval flow
- Multi-account and multi-network support

### Tools
- `iota_wallet_address` — Get active address
- `iota_wallet_balance` — Check IOTA balance
- `iota_wallet_accounts` — List derived accounts
- `iota_wallet_sign_execute` — Sign and execute (requires approval)
- `iota_wallet_pending` — View pending requests
- `iota_wallet_approve` / `iota_wallet_reject` — Approve or reject
- `iota_wallet_switch_network` — Switch mainnet/testnet/devnet
