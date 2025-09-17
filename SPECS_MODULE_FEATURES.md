# Specs Module - Complete Feature Overview

## What is the Specs Module?

The specs module is stdLibSchema's **executable specifications framework** that provides continuous verification and automatic correction of architectural rules. It's the "crown jewel" because it transforms static coding standards into living, enforceable specifications.

## Core Features

### 1. Rule System

#### Built-in Rules (Implemented)
- **Component Naming** - Ensures Angular components follow naming conventions
- **Module Architecture** - Validates proper layering and module boundaries  
- **Module Dependencies** - Enforces dependency rules from RULEBOOK.json
- **Cyclomatic Complexity** - Detects overly complex functions (default: max 10)
- **File Size** - Warns about large files (default: max 300 lines)
- **Import Organization** - Ensures proper import grouping and ordering
- **No Console** - Detects console statements in production code

#### Performance Rules (Implemented)
- **Bundle Imports** - Detects barrel imports that increase bundle size
- **Circular Dependencies** - Finds and reports circular import chains
- **Lazy Loading** - Ensures proper lazy loading for Angular modules

#### Security Rules (Implemented)
- **No Hardcoded Secrets** - Detects API keys, passwords, tokens, and high-entropy strings
- **Dependency Audit** - Checks for known vulnerabilities and typosquatting

#### Architecture Rules (Planned)
- **Module Boundaries** - Enforce proper layering and module boundaries
- **Dependency Direction** - Ensure dependencies flow in the correct direction

### 2. Execution Engine

The rule executor orchestrates verification with:
- **Parallel/Sequential Strategies** - Run rules concurrently or in order
- **Error Recovery** - Continue on error with detailed reporting
- **Result Caching** - Cache results for unchanged files (LRU eviction)
- **Timeout Protection** - Prevent rules from hanging
- **Performance Tracking** - Measure rule execution times

### 3. Reporting System

#### Console Reporter
- Colored output with severity indicators
- Group violations by rule, file, or severity
- Show successful rules on request
- Timing information display

#### HTML Reporter 
- Interactive dashboard with filtering (planned)
- Violation trends over time (planned)
- Fix previews and suggestions (planned)
- Export capabilities (planned)

#### JSON Reporter ✅
- Structured data for CI/CD integration
- Complete violation details with metadata
- Summary statistics
- Machine-readable format

#### Markdown Reporter ✅
- Human-readable reports with tables
- Table of contents for navigation
- Grouped violations with summaries
- Perfect for documentation/PRs

### 4. Configuration System

Flexible configuration from multiple sources:
```json
{
  "rules": ["cyclomatic-complexity", "file-size"],
  "excludeRules": ["no-console"],
  "severity": "error",
  "autoFix": false,
  "paths": {
    "include": ["src/**/*.ts"],
    "exclude": ["**/*.spec.ts"]
  },
  "cyclomatic-complexity": {
    "maxComplexity": 15
  },
  "file-size": {
    "maxLines": 500,
    "ignoreTests": true
  }
}
```

### 5. Plugin System (Coming Soon)

Create custom rules with the plugin API:
```typescript
export const myCustomRule: SpecsPlugin = {
  name: 'my-org-rules',
  version: '1.0.0',
  rules: [
    {
      metadata: {
        id: 'custom-rule',
        name: 'My Custom Rule',
        category: 'style',
        autoFixable: false
      },
      verification: (options) => (tree, context) => {
        // Custom verification logic
      }
    }
  ]
};
```

## How to Use

### 1. Command Line
```bash
# Run all rules
ng generate stdlibschema:verify

# Run specific rules
ng generate stdlibschema:verify --rules=cyclomatic-complexity,file-size

# Auto-fix violations
ng generate stdlibschema:correct --autoFix

# Generate HTML report
ng generate stdlibschema:verify --reportFormat=html --outputPath=report.html
```

### 2. Programmatic API
```typescript
import { RuleExecutor } from '@stdlibschema/specs';

const executor = new RuleExecutor();
const result = await executor.executeVerification(tree, {
  rules: ['cyclomatic-complexity', 'import-organization'],
  maxComplexity: 10
});

// Generate reports
const reporter = new MarkdownReporter();
await reporter.report(reportData, {
  outputPath: 'specs-report.md'
});
```

### 3. CI/CD Integration
```yaml
# GitHub Actions Example
- name: Run Specs Verification
  run: |
    npm run specs:verify -- --reportFormat=json --outputPath=specs-report.json
    
- name: Upload Report
  uses: actions/upload-artifact@v2
  with:
    name: specs-report
    path: specs-report.json
```

## Benefits

1. **Automated Quality Gates** - Catch issues before they reach production
2. **Consistent Codebase** - Enforce standards across all projects
3. **Developer Productivity** - Auto-fix common issues
4. **Living Documentation** - Rules serve as executable documentation
5. **Extensibility** - Add custom rules for your specific needs
6. **Performance** - Fast execution with caching and parallel processing
7. **Integration** - Works seamlessly with existing tools and workflows

## Real-World Use Cases

### 1. Pre-Commit Hooks
Prevent bad code from being committed:
```bash
#!/bin/sh
npm run specs:verify --rules=no-console,import-organization
```

### 2. Pull Request Checks
Automated PR comments with violations:
```typescript
const violations = await runSpecs();
if (violations.length > 0) {
  await createPRComment(generateMarkdownReport(violations));
}
```

### 3. Architecture Enforcement
Ensure your carefully designed architecture is maintained:
```typescript
// Verify module boundaries
verifyModuleArchitecture({
  layers: [
    { name: 'ui', canImportFrom: ['business', 'shared'] },
    { name: 'business', canImportFrom: ['data', 'shared'] },
    { name: 'data', canImportFrom: ['shared'] },
    { name: 'shared', canImportFrom: [] }
  ]
});
```

### 4. Performance Monitoring
Track complexity trends over time:
```typescript
// Weekly complexity report
const complexityTrend = await analyzeComplexityOverTime();
await sendSlackNotification(complexityTrend);
```

## Coming Next

1. **Hub-Core Integration** - Deep integration with workflow orchestration
2. **AI-Powered Suggestions** - Smart fix recommendations
3. **Visual Rule Builder** - Create rules without coding
4. **Real-time Verification** - IDE integration for instant feedback
5. **Distributed Execution** - Run rules across multiple machines

The specs module transforms stdLibSchema from a utility library into a complete development ecosystem that ensures code quality, enforces architecture, and provides continuous feedback to developers.