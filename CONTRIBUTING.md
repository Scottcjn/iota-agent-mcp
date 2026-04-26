# Contributing to iota-agent-mcp

Thank you for your interest in contributing to the IOTA Agent MCP server! This guide will help you get started.

## Quick Start

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/iota-agent-mcp.git`
3. **Create a branch**: `git checkout -b feature/my-contribution`
4. **Make changes** and commit: `git commit -m "feat: description of change"`
5. **Push** to your fork: `git push origin feature/my-contribution`
6. **Open a Pull Request** against the `main` branch

## Development Setup

```bash
# Install dependencies
pip install -e ".[dev]"

# Run the server locally
python -m iota_agent_mcp

# Run tests
pytest
```

## Code Style

- Follow PEP 8 for Python code
- Use type hints for all function signatures
- Add docstrings to public functions and classes
- Keep lines under 100 characters

## Pull Request Guidelines

- **Title format**: Use conventional commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`)
- **Description**: Explain what the PR does and why
- **Scope**: Keep PRs focused — one feature or fix per PR
- **Tests**: Add tests for new functionality
- **Documentation**: Update README.md and tool docs if adding/modifying MCP tools

## Adding New MCP Tools

When adding a new tool to the server:

1. Define the tool in the appropriate category module
2. Add input validation using Pydantic models
3. Include error handling with descriptive messages
4. Update the README.md tools table
5. Add a test case

## Reporting Issues

- **Bugs**: Open an issue with steps to reproduce, expected vs actual behavior, and environment details
- **Feature requests**: Open an issue describing the use case and proposed solution
- **Security issues**: Email the maintainers directly — do not file public issues

## Code of Conduct

Be respectful, constructive, and inclusive. We follow the [Contributor Covenant](https://www.contributor-covenant.org/).

## License

By contributing, you agree that your contributions will be licensed under the same license as this project (Apache 2.0).
