# Contributing to IOTA Agent MCP

Thank you for your interest in contributing to IOTA Agent MCP! This project enables AI agents to interact with the IOTA Tangle through the Model Context Protocol (MCP). Your contributions help bridge the gap between AI systems and distributed ledger technology.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [How to Contribute](#how-to-contribute)
- [Style Guidelines](#style-guidelines)
- [Testing](#testing)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [IOTA-Specific Considerations](#iota-specific-considerations)

## Code of Conduct

This project adheres to a code of conduct that expects all participants to:
- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others

## Getting Started

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** or **yarn**
- **Git**
- Basic understanding of IOTA/Shimmer networks
- Familiarity with Model Context Protocol (MCP)

### Understanding the Stack

IOTA Agent MCP connects AI agents to IOTA through:
- **MCP Protocol**: Standardized AI-agent communication
- **IOTA Client Library**: `@iota/sdk` for node interactions
- **TypeScript**: Type-safe implementation

## Development Environment

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/iota-agent-mcp.git
cd iota-agent-mcp

# Add upstream remote
git remote add upstream https://github.com/Scottcjn/iota-agent-mcp.git
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your settings
# Required variables:
# - IOTA_NODE_URL: IOTA/Shimmer node endpoint
# - IOTA_NETWORK: 'iota' or 'shimmer'
```

### 4. Build the Project

```bash
npm run build
```

### 5. Run Tests

```bash
npm test
```

## How to Contribute

### Reporting Bugs

Before creating a bug report:
1. Check existing issues to avoid duplicates
2. Update to the latest version to verify the bug still exists

When reporting bugs, include:
- **Clear title** and description
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Environment details**: Node.js version, OS, IOTA network
- **Error messages** and stack traces
- **Code samples** if applicable

### Suggesting Enhancements

Enhancement suggestions are welcome! Please provide:
- Clear use case description
- Benefits to AI agent developers
- Potential implementation approach
- Any IOTA-specific considerations

### Pull Requests

1. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our style guidelines

3. **Test thoroughly** including edge cases

4. **Update documentation** if needed

5. **Commit** with clear messages

6. **Push** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request** against the main repository

## Style Guidelines

### TypeScript Style

We use strict TypeScript configuration:

```typescript
// Use explicit types for function parameters and returns
async function getBalance(address: string): Promise<bigint> {
  // Implementation
}

// Use interfaces for object shapes
interface IOTAToolConfig {
  nodeUrl: string;
  network: 'iota' | 'shimmer';
  timeoutMs: number;
}

// Prefer readonly for immutable data
interface ReadonlyConfig {
  readonly apiKey: string;
  readonly nodeEndpoint: string;
}
```

### MCP Tool Definitions

When adding new MCP tools:

```typescript
{
  name: 'iota_get_balance',
  description: 'Get the balance of an IOTA address. ' +
    'Requires a valid Bech32 address. ' +
    'Returns balance in smallest denomination (glow for IOTA, glow for Shimmer).',
  inputSchema: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        description: 'Bech32 encoded address (iota1... or smr1...)'
      }
    },
    required: ['address']
  }
}
```

**Guidelines:**
- Use descriptive names with `iota_` prefix
- Provide detailed descriptions
- Include parameter validation schemas
- Document return value formats

### Error Handling

```typescript
// Use custom error types
class IOTAClientError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'IOTAClientError';
  }
}

// Always handle errors gracefully
try {
  const balance = await client.getBalance(address);
  return { success: true, balance };
} catch (error) {
  if (error instanceof IOTAClientError) {
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
  throw error; // Re-throw unexpected errors
}
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- src/tools/balance.test.ts

# Watch mode for development
npm run test:watch
```

### Writing Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { IOTAToolProvider } from './tool-provider';

describe('IOTAToolProvider', () => {
  let provider: IOTAToolProvider;

  beforeEach(() => {
    provider = new IOTAToolProvider({
      nodeUrl: 'https://api.testnet.shimmer.network',
      network: 'shimmer'
    });
  });

  it('should get balance for valid address', async () => {
    const address = 'smr1qz9nps8t5v7s0y7z5q3m0q0q0q0q0q0q0q0q0q0q0q0q0q0q0q0q0q0q0q0q0q0';
    const result = await provider.getBalance(address);
    
    expect(result.success).toBe(true);
    expect(typeof result.balance).toBe('bigint');
  });

  it('should reject invalid address format', async () => {
    const invalidAddress = 'not-an-address';
    
    await expect(provider.getBalance(invalidAddress))
      .rejects
      .toThrow('Invalid Bech32 address format');
  });
});
```

### Test Coverage Requirements

- Minimum 80% code coverage
- All MCP tools must have integration tests
- Error paths must be tested
- Mock external IOTA node calls in unit tests

## Commit Message Guidelines

We follow conventional commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Build/tooling changes

**Examples:**
```
feat(tools): add support for NFT metadata queries

Implement getNFTMetadata tool that retrieves immutable metadata
from IOTA outputs. Includes validation for NFT ID format.

fix(client): handle network timeout errors gracefully

Add retry logic with exponential backoff for node connection
failures. Prevents AI agent from hanging on network issues.

docs(readme): update setup instructions for Shimmer testnet

Add step-by-step guide for configuring testnet access,
including faucet instructions for test tokens.
```

## Pull Request Process

1. **Update documentation** for any API changes
2. **Add tests** for new functionality
3. **Ensure CI passes** (lint, test, build)
4. **Request review** from maintainers
5. **Address feedback** promptly
6. **Squash commits** if requested

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated (for significant changes)
- [ ] No breaking changes (or clearly documented)
- [ ] Commit messages follow