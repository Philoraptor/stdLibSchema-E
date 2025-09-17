# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2025-08-17

### Added
- Service worker generation support in generate-angular-hub-core schematic
- Test file generation for all components when `includeTests` option is enabled
- Route management functionality in page-index schematic
- Modern Angular v20 templates with signal-based components
- Secure JWT service implementation with httpOnly cookies
- Test coverage badge in README showing 88% coverage
- Comprehensive session documentation for multi-agent orchestration

### Fixed
- TypeScript template string syntax errors in deployment-agent.ts
- Malformed object literals in latency-signal.service.ts
- Incomplete forEach statement in test-multi-agent.ts
- Missing catch block in start-server.ts
- BLC-010 incomplete promise handlers in multiple files
- Service worker generation test failures
- Test file generation validation issues
- AST-based module declaration updates
- Jest parsing errors in schematic tests

### Changed
- Test coverage increased from 72% to 88%
- Updated Node.js requirement from 24.4.1 to 24.5.0
- Updated Angular support to v20
- Modernized all agent templates to use Angular signals
- Enhanced security in JWT implementations (localStorage → httpOnly cookies)
- Updated GitHub Actions workflows to use STDLIBSCHEMA_GITHUB_TOKEN

### Security
- Fixed critical JWT vulnerability by moving from localStorage to httpOnly cookies
- Removed all hardcoded API keys and secrets
- Enhanced authentication interceptor security

### Performance
- Optimized test execution with batched coverage testing
- Improved memory management in test infrastructure
- Enhanced cache warming strategies

## [1.0.1] - 2025-08-14

### Added
- Initial BLC-001 and BLC-010 protocol integration
- Redis-backed state management
- Multi-agent orchestration system
- Hub-core architecture with signal-based components
- AI SDK plugin with Anthropic integration
- Z85 encoding plugin (RFC 32 compliant)
- Executable specifications framework
- 27 total rules (18 verification, 5 correction, 4 AI-powered)

### Fixed
- All 370 TypeScript build errors
- Angular Signal API compatibility issues
- Test isolation and cleanup improvements
- Security vulnerabilities in dependencies

### Changed
- TypeScript updated to 5.8.3
- Angular updated to 20.1.5
- Test coverage improved to 72%

## [0.3.0] - 2025-07-11

### Added
- Initial public release
- Standard library (stdlib) utilities for Angular Schematics
- Basic specifications framework
- GitHub Actions CI/CD pipeline
- Documentation and examples

[1.0.2]: https://github.com/Philoraptor/stdLibSchema/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/Philoraptor/stdLibSchema/compare/v0.3.0...v1.0.1
[0.3.0]: https://github.com/Philoraptor/stdLibSchema/releases/tag/v0.3.0