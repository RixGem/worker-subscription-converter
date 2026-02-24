# Contributing to Worker Subscription Converter

First off, thank you for considering contributing to Worker Subscription Converter! 🎉

It's people like you that make this tool better for everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Guidelines](#development-guidelines)
- [Pull Request Process](#pull-request-process)
- [Style Guide](#style-guide)

## Code of Conduct

This project and everyone participating in it is governed by our commitment to:

- ✅ Be respectful and inclusive
- ✅ Welcome newcomers and help them learn
- ✅ Focus on what is best for the community
- ✅ Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Git
- A Cloudflare account (free tier is fine)
- Basic knowledge of JavaScript

### Setup Development Environment

1. **Fork the repository**

   Click the "Fork" button in the top right of the repository page.

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/worker-subscription-converter.git
   cd worker-subscription-converter
   ```

3. **Add upstream remote**

   ```bash
   git remote add upstream https://github.com/RixGem/worker-subscription-converter.git
   ```

4. **Install dependencies**

   ```bash
   npm install
   ```

5. **Start development server**

   ```bash
   npm run dev
   ```

   Access at `http://localhost:8787`

## How Can I Contribute?

### Reporting Bugs 🐛

Before creating bug reports, please check existing issues to avoid duplicates.

**Great bug reports include:**

- Clear, descriptive title
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details (OS, Node version, etc.)

**Example:**

```markdown
**Bug Description**
IPv6 nodes are not being detected correctly

**Steps to Reproduce**
1. Use subscription with IPv6 addresses
2. Convert to Clash format
3. Check node names

**Expected Behavior**
Nodes should have `-v6` suffix

**Actual Behavior**
No `-v6` suffix is added

**Environment**
- Worker version: 2.0.0
- Subscription format: VMess base64
```

### Suggesting Enhancements ✨

**Enhancement suggestions should include:**

- Clear description of the feature
- Why this feature would be useful
- Possible implementation approach
- Examples of usage

### Contributing Code 💻

#### Good First Issues

Look for issues labeled `good first issue` - these are great for newcomers!

#### Areas That Need Help

- 📝 Documentation improvements
- 🎨 Web UI enhancements
- ⚖️ More test coverage
- 🐛 Bug fixes
- ✨ New protocol support
- 🌐 Internationalization

## Development Guidelines

### Code Structure

```
worker_to_sub.js
├── Configuration (CONFIG object)
├── Utility Functions
│   ├── Logger
│   ├── Base64
│   └── Helper functions
├── Proxy Parsers
│   ├── parseVMess()
│   ├── parseVLESS()
│   ├── parseTrojan()
│   ├── parseShadowsocks()
│   └── parseShadowsocksR()
├── Format Converters
│   ├── toClashProxy()
│   ├── toSurgeProxy()
│   ├── generateClashConfig()
│   └── generateSurgeConfig()
└── Main Handler
    └── handleRequest()
```

### Adding a New Protocol

1. **Create parser function**

```javascript
/**
 * Parse NewProtocol
 * Format: newproto://...
 */
function parseNewProtocol(url) {
  try {
    // Parse URL
    const parsed = /* your parsing logic */;
    
    // Detect IPv6
    const isV6 = isIPv6(parsed.server);
    
    return {
      type: 'newprotocol',
      name: formatNodeName(parsed.name, isV6),
      server: parsed.server,
      port: parsed.port,
      // ... protocol-specific fields
      isIPv6: isV6
    };
  } catch (e) {
    Logger.warn('NewProtocol parse error:', e.message);
    return null;
  }
}
```

2. **Add to main parser**

```javascript
function parseProxy(url) {
  // ...
  if (url.startsWith('newproto://')) return parseNewProtocol(url);
  // ...
}
```

3. **Add format converter**

```javascript
function toClashProxy(proxy) {
  // ...
  // Handle new protocol type
  // ...
}
```

4. **Test thoroughly**

```bash
# Test with sample URL
curl "http://localhost:8787/?url=newproto://...&target=json"
```

5. **Update documentation**

- Add to README.md
- Add examples to EXAMPLES.md
- Update CHANGELOG.md

### Testing

#### Manual Testing

```bash
# Start dev server
npm run dev

# Test various scenarios
curl "http://localhost:8787/"
curl "http://localhost:8787/?url=TEST_URL&target=json"
curl "http://localhost:8787/?url=INVALID_URL&target=clash"
```

#### Test Checklist

- [ ] Works with valid subscription
- [ ] Handles invalid URLs gracefully
- [ ] IPv6 detection works
- [ ] Multiple subscriptions merge correctly
- [ ] All output formats work
- [ ] Error messages are clear
- [ ] No console errors

### Debugging

Enable debug mode:

```javascript
const CONFIG = {
  DEBUG: true,  // Enable detailed logging
  // ...
};
```

View logs:

```bash
npm run tail
```

## Pull Request Process

### Before Submitting

1. **Sync with upstream**

   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**

   - Follow the style guide
   - Add comments
   - Test thoroughly

4. **Commit with clear messages**

   ```bash
   git add .
   git commit -m "feat: add support for new protocol"
   ```

   Use [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation
   - `style:` - Code style
   - `refactor:` - Code refactoring
   - `test:` - Tests
   - `chore:` - Maintenance

5. **Push to your fork**

   ```bash
   git push origin feature/your-feature-name
   ```

### Creating the Pull Request

1. Go to your fork on GitHub
2. Click "Compare & pull request"
3. Fill in the PR template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement

## Testing
How did you test these changes?

## Checklist
- [ ] Code follows style guide
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] All tests pass
- [ ] No console errors
```

4. Submit the PR

### Review Process

1. Maintainers will review within 2-3 days
2. Address any feedback
3. Once approved, PR will be merged
4. Your contribution will be added to CHANGELOG.md

## Style Guide

### JavaScript Style

```javascript
// Use const/let, not var
const myConstant = 'value';
let myVariable = 'value';

// Use template literals
const message = `Hello ${name}`;

// Use arrow functions
const add = (a, b) => a + b;

// Use async/await
async function fetchData() {
  const data = await fetch(url);
  return data;
}

// Add JSDoc comments for functions
/**
 * Parse proxy URL
 * @param {string} url - Proxy URL to parse
 * @returns {Object|null} Parsed proxy or null
 */
function parseProxy(url) {
  // ...
}
```

### Naming Conventions

```javascript
// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;

// Functions: camelCase
function parseVMess() {}

// Classes: PascalCase
class ProxyParser {}

// Private: prefix with underscore
function _internalHelper() {}
```

### Comments

```javascript
// Good: Explain WHY, not WHAT
// Add IPv6 suffix to help users identify nodes that require IPv6 connectivity
if (isV6) {
  name += CONFIG.IPV6_SUFFIX;
}

// Bad: Obvious comments
// Increment counter
counter++;
```

### Error Handling

```javascript
// Always use try-catch for parsing
try {
  const parsed = JSON.parse(data);
  return parsed;
} catch (e) {
  Logger.error('Parse error:', e.message);
  return null;  // Return null, don't throw
}
```

## Documentation

### Updating README

- Keep feature list current
- Add examples for new features
- Update screenshots if UI changes

### Code Comments

- Explain complex algorithms
- Document function parameters
- Add usage examples for utilities

### External Documentation

- Update EXAMPLES.md for new use cases
- Update DEPLOYMENT.md if deployment changes
- Keep CHANGELOG.md current

## Questions?

- 💬 [GitHub Discussions](https://github.com/RixGem/worker-subscription-converter/discussions)
- 🐛 [Open an Issue](https://github.com/RixGem/worker-subscription-converter/issues)

## Recognition

All contributors will be:
- Listed in CHANGELOG.md
- Mentioned in release notes
- Added to GitHub contributors list

**Thank you for contributing! 🎉**
