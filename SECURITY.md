# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.x     | ✅ Active  |
| < 2.0   | ❌ No longer supported |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability, report it privately using one of the following:

- **GitHub Private Advisory** — [Report a vulnerability](https://github.com/Andamio-Platform/andamio-app-template/security/advisories/new) (preferred)
- **Email** — security@andamio.io

### What to include

- A clear description of the vulnerability
- Steps to reproduce the issue
- Affected versions
- Potential impact
- Any suggested fix (optional)

### Response expectations

- **Acknowledgement** within 48 hours
- **Status update** within 7 days
- We will coordinate a fix and disclosure timeline with you

## Scope

This template handles wallet connections, JWT authentication, and Cardano transactions. Areas of particular concern include:

- Authentication and session management
- API key handling and exposure
- Wallet interaction and transaction signing
- Dependency vulnerabilities

## Out of Scope

- Vulnerabilities in projects built on top of this template (contact that project's maintainers)
- Issues in third-party dependencies (report directly to those projects, or open a standard issue here so we can update the dependency)
- Theoretical attacks without a proof of concept

## Disclosure Policy

We follow responsible disclosure. Once a fix is released, we will publish a security advisory crediting the reporter (unless you prefer to remain anonymous).
