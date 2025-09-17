# Specialist Agents Documentation

## Overview

Specialist agents are domain-specific components that provide focused functionality for common development tasks. They integrate seamlessly with both the rumination layer and hub-core orchestration system, enabling intelligent, coordinated operations across the development lifecycle.

## Architecture

### Base Agent Interface

All specialist agents implement the `SpecialistAgent` interface:

```typescript
interface SpecialistAgent {
  id: string;
  name: string;
  description: string;
  categories: AgentCategory[];
  operations: AgentOperation[];
  
  initialize(tree: Tree, context: SchematicContext): Promise<void>;
  execute(operation: string, params: AgentOperationParams): Observable<AgentResult>;
  getStatus(): AgentStatus;
  cleanup(): Promise<void>;
}
```

### Agent Categories

- **DEVELOPMENT**: Code generation and refactoring
- **SECURITY**: Security scanning and authentication
- **TESTING**: Test generation and quality assurance
- **DEPLOYMENT**: CI/CD and deployment automation
- **FINANCIAL**: Transaction processing and billing
- **ANALYSIS**: Code analysis and metrics
- **OPTIMIZATION**: Performance and code optimization

## Available Agents

### 1. Development Tooling Agent

Specializes in code generation, refactoring, and development automation.

#### Operations:
- **generate-component**: Create Angular components with best practices
- **generate-service**: Create Angular services with dependency injection
- **refactor-imports**: Organize and optimize imports
- **extract-interface**: Extract interfaces from classes or objects
- **add-barrel-exports**: Create or update index.ts barrel exports
- **generate-tests**: Generate unit tests for components or services

#### Usage Example:
```typescript
import { createDevelopmentAgent } from 'stdlibschema';

const agent = createDevelopmentAgent();
await agent.initialize(tree, context);

const result = await agent.execute('generate-component', {
  tree,
  context,
  params: {
    name: 'user-profile',
    path: '/src/app/components',
    style: 'scss',
    standalone: true,
    changeDetection: 'OnPush'
  }
}).toPromise();
```

### 2. Security and Authentication Agent

Specializes in security scanning, authentication setup, and vulnerability detection.

#### Operations:
- **security-scan**: Scan codebase for security vulnerabilities
- **setup-auth**: Set up authentication infrastructure (JWT, OAuth)
- **add-security-headers**: Add security headers to the application
- **encrypt-config**: Encrypt sensitive configuration values
- **generate-auth-guard**: Generate authentication guards for routes
- **audit-dependencies**: Audit npm dependencies for vulnerabilities

#### Usage Example:
```typescript
import { createSecurityAgent } from 'stdlibschema';

const agent = createSecurityAgent();
await agent.initialize(tree, context);

// Perform security scan
const scanResult = await agent.execute('security-scan', {
  tree,
  context,
  params: {
    targetPath: '/src',
    depth: 'deep',
    includeTests: false,
    severity: 'high'
  }
}).toPromise();

// Set up JWT authentication
const authResult = await agent.execute('setup-auth', {
  tree,
  context,
  params: {
    authType: 'jwt',
    provider: 'jwt'
  }
}).toPromise();
```

### 3. Testing Agent (Planned)

Will specialize in test generation, coverage analysis, and quality assurance.

#### Planned Operations:
- **generate-unit-tests**: Generate unit tests for components/services
- **generate-e2e-tests**: Generate end-to-end tests
- **analyze-coverage**: Analyze test coverage
- **generate-mocks**: Generate mock data and services
- **setup-testing-framework**: Configure testing frameworks

### 4. Deployment Agent (Planned)

Will specialize in CI/CD setup, deployment configuration, and operations.

#### Planned Operations:
- **setup-ci**: Configure CI/CD pipelines
- **generate-dockerfile**: Generate Docker configuration
- **setup-kubernetes**: Generate Kubernetes manifests
- **configure-environments**: Set up environment configurations
- **optimize-build**: Optimize build configuration

### 5. Financial Agent (Planned)

Will specialize in payment processing, billing, and financial operations.

#### Planned Operations:
- **setup-payment**: Configure payment processing
- **generate-invoice**: Generate invoice templates
- **setup-subscription**: Configure subscription management
- **audit-transactions**: Audit financial transactions
- **generate-reports**: Generate financial reports

## Integration with Hub-Core

Specialist agents are designed to work seamlessly with hub-core orchestration:

```typescript
// Define a workflow using multiple agents
const workflow = {
  id: 'secure-component-creation',
  phases: [
    {
      name: 'generate',
      agent: 'development',
      operation: 'generate-component',
      params: { name: 'payment', path: '/src/app/components' }
    },
    {
      name: 'secure',
      agent: 'security',
      operation: 'security-scan',
      params: { targetPath: '/src/app/components/payment' }
    },
    {
      name: 'test',
      agent: 'development',
      operation: 'generate-tests',
      params: { sourcePath: '/src/app/components/payment/payment.component.ts' }
    }
  ]
};

// Execute through hub-core
const orchestrator = createOrchestrator(tree, context);
const results = await orchestrator.executeWorkflow(workflow);
```

## Integration with Rumination

Agents can leverage rumination for continuous improvement:

```typescript
// After agent execution, feed results to rumination
const ruminationEngine = createRuminationEngine(tree, context);

// Analyze patterns in generated code
const patterns = await ruminationEngine.analyze();

// Learn from agent operations
await ruminationEngine.processFeedback({
  type: 'positive',
  target: 'suggestion',
  id: 'agent-operation-success',
  details: 'Component generation followed best practices'
});

// Get suggestions for improvement
const suggestions = await ruminationEngine.suggest();
```

## Creating Custom Agents

To create a custom specialist agent:

```typescript
import { BaseSpecialistAgent, AgentCategory } from 'stdlibschema';

export class CustomAgent extends BaseSpecialistAgent {
  constructor() {
    super(
      'custom-agent',
      'Custom Specialist Agent',
      'Description of your agent',
      [AgentCategory.DEVELOPMENT],
      [
        {
          id: 'custom-operation',
          name: 'Custom Operation',
          description: 'What this operation does',
          requiredParams: ['param1'],
          optionalParams: ['param2'],
          modifiesTree: true
        }
      ]
    );
  }

  execute(operation: string, params: AgentOperationParams): Observable<AgentResult> {
    // Implement your operation logic
    switch (operation) {
      case 'custom-operation':
        return this.performCustomOperation(params);
      default:
        return throwError(() => new Error(`Unknown operation: ${operation}`));
    }
  }

  private performCustomOperation(params: AgentOperationParams): Observable<AgentResult> {
    // Your implementation here
    return of({
      success: true,
      modifiedFiles: [],
      data: {}
    });
  }
}

// Register the custom agent
import { registerAgent } from 'stdlibschema';

registerAgent('custom', () => new CustomAgent());
```

## Best Practices

1. **Single Responsibility**: Each agent should focus on a specific domain
2. **Observable Pattern**: Use RxJS observables for async operations
3. **Error Handling**: Properly handle and report errors
4. **Status Tracking**: Update agent status during operations
5. **Performance Metrics**: Track execution time and resource usage
6. **Suggestions**: Provide actionable suggestions after operations
7. **Tree Immutability**: Don't modify the tree directly in agents
8. **Configuration**: Support flexible configuration options
9. **Testing**: Write comprehensive tests for agent operations
10. **Documentation**: Document all operations and parameters

## Agent Communication

Agents can communicate through the hub-core coordinator:

```typescript
// Agent A produces data
const dataFromAgentA = await agentA.execute('analyze', params);

// Coordinator passes data to Agent B
const coordinator = createCoordinator();
await coordinator.sendMessage({
  from: 'agent-a',
  to: 'agent-b',
  data: dataFromAgentA.data
});

// Agent B consumes data
const resultFromAgentB = await agentB.execute('process', {
  ...params,
  inputData: dataFromAgentA.data
});
```

## Performance Considerations

- Agents track their own performance metrics
- Use caching where appropriate
- Implement timeouts for long-running operations
- Support cancellation of operations
- Monitor memory usage
- Use streaming for large file operations

## Future Enhancements

- Real-time collaboration between agents
- Machine learning integration for operation optimization
- Plugin system for community-contributed agents
- Visual workflow designer for agent orchestration
- Agent marketplace for sharing custom agents