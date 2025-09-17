# stdLibSchema

Enhanced Angular Schematics with standard library utilities and executable specifications framework.

## Overview

stdLibSchema is a TypeScript library that provides:
- **Standard Library Utilities**: Reusable utilities for filesystem operations, JSON manipulation, AST transformations, and workspace management
- **Angular Schematics**: Code generation and modification tools for Angular projects
- **Executable Specifications**: Framework for continuous architectural verification
- **Performance Monitoring**: Built-in latency tracking and metrics collection

## Features

- 🛠️ **Comprehensive Standard Library**: File system, JSON, AST, and workspace utilities
- 🎨 **Angular Schematics**: Generate components, services, and other Angular constructs
- 📊 **Metrics & Monitoring**: Built-in performance tracking and analytics
- 🔍 **Executable Specifications**: Automated architectural verification
- 🚀 **Modern TypeScript**: Built with TypeScript 5.8+ and latest Angular features
- 💾 **Caching**: Redis-based caching for improved performance
- 🔄 **Real-time Updates**: WebSocket support for live metrics

## Quick Start

### Installation

```bash
npm install stdlibschema
```

### Basic Usage

```typescript
import { readJson, writeJson } from 'stdlibschema/stdlib';

// Read and update package.json
const packageJson = await readJson('./package.json');
packageJson.version = '1.0.1';
await writeJson('./package.json', packageJson);
```

### Using Schematics

```bash
# Generate a new component with signals
npm run signals:component

# Build the schematics
npm run schematics:build

# Run tests
npm test
```

## Project Structure

```
├── api/                    # API endpoints for metrics and monitoring
├── embedding-map/          # Cross-project mapping and analysis tools
├── .github/               # GitHub workflows and templates
├── docs/                  # Documentation and development notes
├── package.json           # Project configuration
├── tsconfig.json          # TypeScript configuration
├── jest.config.js         # Jest testing configuration
├── vercel.json           # Vercel deployment configuration
└── README.md             # This file
```

## Scripts

### Development
- `npm run build` - Build the project
- `npm run build:watch` - Build in watch mode
- `npm run lint` - Lint TypeScript files
- `npm run format` - Format code with Prettier

### Testing
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run test:stdlib` - Test standard library only
- `npm run test:specs` - Test specifications only

### Monitoring & Metrics
- `npm run latency:monitor` - Monitor latency metrics
- `npm run metrics:collect` - Collect performance metrics
- `npm run cache:stats` - View cache statistics

### Deployment
- `npm run vercel:deploy` - Deploy to Vercel
- `npm run vercel:dev` - Run Vercel development server

## Configuration

### TypeScript
The project uses TypeScript 5.8+ with strict mode enabled. Configuration is in `tsconfig.json`.

### Jest Testing
Testing is configured with Jest and supports:
- Multiple test projects (stdlib, specs, schematics, other)
- Coverage reporting
- Parallel test execution

### Redis Caching
Optional Redis integration for caching. Configure with environment variables:
```env
REDIS_URL=redis://localhost:6379
```

## Development

### Prerequisites
- Node.js >= 24.5.0
- npm >= 10.0.0

### Setup
```bash
git clone <repository-url>
cd stdLibSchema-e
npm install
npm run build
```

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:stdlib
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT

## Support

For issues and questions, please use the [GitHub Issues](https://github.com/stdlibschema/stdlibschema/issues) page.
