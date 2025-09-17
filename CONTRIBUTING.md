# Contributing to stdlibSchema

We're excited that you're interested in contributing to stdlibSchema! This document provides guidelines for contributing to the project and helps ensure a smooth contribution process.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation Guidelines](#documentation-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Community](#community)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Node.js >= 16.x
- npm >= 8.x
- Git
- A GitHub account
- Basic knowledge of TypeScript and Angular Schematics

### Understanding the Project

1. Read the [README.md](README.md) to understand the project's purpose
2. Review the [stdLibRules.md](../stdLibRules.md) for the complete specification
3. Explore the [examples](./examples/) to see how the library is used
4. Check the [issues](https://github.com/stdlibschema/stdlibschema/issues) for current work

## Development Setup

### Fork and Clone

1. Fork the repository to your GitHub account
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/stdlibschema.git
   cd stdlibschema
   ```

3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/stdlibschema/stdlibschema.git
   ```

### Install Dependencies

```bash
npm install
```

### Build the Project

```bash
npm run build
```

### Run Tests

```bash
npm test
```

### Verify Setup

```bash
npm run lint
npm run test:coverage
```

## How to Contribute

### Types of Contributions

We welcome various types of contributions:

#### 1. **Code Contributions**
- New stdlib utility functions
- Specs framework enhancements
- Bug fixes
- Performance improvements
- New schematics

#### 2. **Documentation**
- API documentation improvements
- Tutorial creation
- Example code
- Translation efforts

#### 3. **Testing**
- New test cases
- Test coverage improvements
- Integration tests
- Performance benchmarks

#### 4. **Design & Ideas**
- Feature proposals
- Architecture improvements
- User experience enhancements

### Choosing What to Work On

1. **Check existing issues**: Look for issues labeled `good first issue` or `help wanted`
2. **Ask in discussions**: If unsure, ask in GitHub Discussions
3. **Propose new features**: Create an issue to discuss your idea first

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/issue-description
# or
git checkout -b docs/documentation-update
```

Branch naming conventions:
- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `test/` - Test additions/improvements
- `refactor/` - Code refactoring
- `chore/` - Maintenance tasks

### 2. Make Your Changes

Follow our coding standards and ensure:
- Code is properly typed (no `any` types in public APIs)
- Functions have TSDoc comments
- Tests are added/updated
- Documentation is updated if needed

### 3. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat: add new JSON merge utility function"
# or
git commit -m "fix: correct module import detection in AST operations"
# or
git commit -m "docs: improve stdlib API documentation"
```

Commit message format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or corrections
- `chore`: Maintenance tasks

### 4. Keep Your Branch Updated

```bash
git fetch upstream
git rebase upstream/main
```

### 5. Push Your Changes

```bash
git push origin feat/your-feature-name
```

## Coding Standards

### TypeScript Guidelines

1. **Use strict TypeScript settings**
   ```typescript
   // Good
   function readFile(tree: Tree, path: string): string {
     // implementation
   }
   
   // Bad
   function readFile(tree: any, path: any): any {
     // implementation
   }
   ```

2. **Provide comprehensive type definitions**
   ```typescript
   export interface FileOperationOptions {
     encoding?: BufferEncoding;
     ensureDirectory?: boolean;
     overwrite?: boolean;
   }
   ```

3. **Use descriptive variable names**
   ```typescript
   // Good
   const normalizedPath = ensureLeadingSlash(path);
   
   // Bad
   const p = fix(path);
   ```

### Code Style

We use Prettier and ESLint for code formatting:

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

Run formatting before committing:
```bash
npm run format
npm run lint
```

### Function Design Principles

1. **Single Responsibility**: Each function should do one thing well
2. **Pure Functions**: Prefer pure functions where possible
3. **Error Handling**: Provide clear error messages
4. **Defaults**: Provide sensible defaults for optional parameters

Example:
```typescript
/**
 * Adds a dependency to package.json
 * 
 * @param tree - The file tree to operate on
 * @param name - The name of the dependency
 * @param version - The version of the dependency
 * @param type - The type of dependency (default: 'dependencies')
 * @returns The updated tree
 * @throws Error if package.json doesn't exist
 * 
 * @example
 * ```typescript
 * addDependency(tree, '@angular/core', '^15.0.0');
 * ```
 */
export function addDependency(
  tree: Tree,
  name: string,
  version: string,
  type: DependencyType = 'dependencies'
): Tree {
  if (!tree.exists('/package.json')) {
    throw new Error('package.json not found in the project root');
  }
  
  return updateJson<PackageJson>(tree, '/package.json', json => {
    if (!json[type]) {
      json[type] = {};
    }
    json[type][name] = version;
    return json;
  });
}
```

## Testing Guidelines

### Test Structure

1. **Unit Tests**: Test individual functions in isolation
2. **Integration Tests**: Test schematics end-to-end
3. **Edge Cases**: Test boundary conditions and error cases

### Writing Tests

```typescript
describe('readFile', () => {
  let tree: UnitTestTree;
  
  beforeEach(() => {
    tree = new UnitTestTree(new EmptyTree());
  });
  
  it('should read file content successfully', () => {
    const content = 'Hello, World!';
    tree.create('/test.txt', content);
    
    const result = readFile(tree, '/test.txt');
    
    expect(result).toBe(content);
  });
  
  it('should throw error for non-existent file', () => {
    expect(() => readFile(tree, '/missing.txt'))
      .toThrowError('File /missing.txt does not exist');
  });
  
  it('should handle different encodings', () => {
    const content = 'Hello, 世界!';
    tree.create('/test.txt', content);
    
    const result = readFile(tree, '/test.txt', { encoding: 'utf8' });
    
    expect(result).toBe(content);
  });
});
```

### Test Coverage

- Aim for 90%+ test coverage
- Run coverage reports: `npm run test:coverage`
- Don't sacrifice test quality for coverage numbers

## Documentation Guidelines

### TSDoc Comments

All public APIs must have TSDoc comments:

```typescript
/**
 * Brief description of what the function does.
 * 
 * Longer description if needed, explaining important details,
 * edge cases, or implementation notes.
 * 
 * @param paramName - Description of the parameter
 * @param optionalParam - Description of optional parameter
 * @returns Description of what is returned
 * @throws Description of exceptions that may be thrown
 * 
 * @example
 * ```typescript
 * // Example usage
 * const result = functionName(param1, param2);
 * ```
 * 
 * @see {@link RelatedFunction} for related functionality
 * @since 1.0.0
 */
```

### Documentation Updates

When adding new features:
1. Update relevant API documentation
2. Add/update examples
3. Update the README if needed
4. Add to migration guide if breaking changes

## Pull Request Process

### Before Creating a PR

1. **Ensure all tests pass**: `npm test`
2. **Check code coverage**: `npm run test:coverage`
3. **Run linting**: `npm run lint`
4. **Format code**: `npm run format`
5. **Build successfully**: `npm run build`
6. **Update documentation**: If applicable

### Creating the PR

1. **Push your branch** to your fork
2. **Create a pull request** from your fork to the main repository
3. **Fill out the PR template** completely
4. **Link related issues** using keywords (fixes #123)

### PR Title Format

Follow the same convention as commit messages:
- `feat: add new JSON merge utility`
- `fix: correct TypeScript AST import detection`
- `docs: improve contributing guidelines`

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Related Issue
Fixes #(issue number)

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing unit tests pass locally
- [ ] I have added necessary documentation
- [ ] My changes generate no new warnings

## Screenshots (if applicable)
Add screenshots for UI changes.

## Additional Notes
Any additional information that reviewers should know.
```

### Review Process

1. **Automated Checks**: CI/CD will run tests, linting, and build
2. **Code Review**: Maintainers will review your code
3. **Feedback**: Address any requested changes
4. **Approval**: Once approved, maintainers will merge

### After Merge

- Delete your feature branch
- Pull the latest changes from upstream
- Celebrate your contribution! 🎉

## Issue Guidelines

### Creating Issues

#### Bug Reports

Use the bug report template and include:
- Clear, descriptive title
- Steps to reproduce
- Expected behavior
- Actual behavior
- System information
- Error messages/stack traces

#### Feature Requests

Use the feature request template and include:
- Problem description
- Proposed solution
- Alternative solutions considered
- Additional context

### Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Documentation improvements
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention needed
- `question`: Further information requested

## Community

### Getting Help

- **GitHub Discussions**: Ask questions and share ideas
- **Issues**: Report bugs or request features
- **Slack**: Join our community Slack channel

### Code Reviews

We encourage community code reviews! Feel free to review and comment on PRs.

### Recognition

Contributors are recognized in:
- The project's CONTRIBUTORS.md file
- Release notes
- Project documentation

## Advanced Contributing

### Adding a New stdlib Function

1. **Propose the function** via an issue
2. **Design the API** with the community
3. **Implement** following our patterns:
   ```typescript
   // In src/stdlib/category/function-name.ts
   export function functionName(/* params */): ReturnType {
     // Implementation
   }
   ```
4. **Add comprehensive tests**
5. **Export** from the category index
6. **Document** with TSDoc
7. **Add examples** to the examples directory

### Adding a New Spec Rule

1. **Define the rule** in the specs framework
2. **Implement verification** logic
3. **Add correction** capability (if applicable)
4. **Create tests** for both verification and correction
5. **Document** the rule's purpose and configuration

### Performance Considerations

When contributing performance-critical code:
1. **Benchmark** your implementation
2. **Profile** memory usage
3. **Consider** lazy evaluation
4. **Document** performance characteristics

## Final Notes

Thank you for contributing to stdlibSchema! Your efforts help make Angular Schematics more powerful and easier to use for everyone.

If you have any questions not covered in this guide, please don't hesitate to ask in GitHub Discussions or create an issue.

Happy coding! 🚀