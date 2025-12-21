# Contributing to Tax Yasef

Thank you for your interest in contributing to Tax Yasef! This document provides guidelines and instructions for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Pull Request Template](#pull-request-template)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Testing](#testing)
- [Documentation](#documentation)

---

## 🤝 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

---

## 📝 Pull Request Template

All pull requests **must** use the provided PR template. The template is located at [PULL_REQUEST_TEMPLATE.md](./PULL_REQUEST_TEMPLATE.md) and will automatically load when you create a new PR.

### Template Sections

The PR template includes the following sections that **must be completed**:

1. **Description**: Brief description of the changes in the PR
2. **What did I do**: Clear bullet points listing all changes made
3. **Type of Change**: Mark the appropriate option (Bug fix, New feature, etc.)
4. **Related Issues**: Link any related issues using `#issue_number` or `Closes #issue_number`
5. **Checklist**: All items must be checked before submitting
6. **Additional Notes**: Screenshots, context, or additional information

**⚠️ Incomplete PR templates will not be reviewed. All sections must be filled out.**

---

## 🚀 Getting Started

### Important: Collaborator Access Required

⚠️ **This project uses a collaborator-based workflow. Forks are not allowed.**

You must be added as a collaborator to the repository before you can contribute. Contact the repository maintainers to request collaborator access.

### Prerequisites

- **Bun** (recommended) or Node.js 18+
- Git
- A GitHub account
- **Collaborator access** to the repository (contact maintainers to be added as a collaborator)

### Setting Up

1. **Clone the Repository**
   - You must be a collaborator on the repository
   - Clone the repository: `git clone https://github.com/original-owner/tax-yasef.git`
   - Navigate to the project: `cd tax-yasef`

2. **Install Dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Create a Branch**
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

---

## 🔄 Development Workflow

### Branch Strategy

- **`main`**: Production-ready code
- **`dev`**: Development branch (target for all PRs)
- **Feature branches**: `feature/feature-name`
- **Bug fix branches**: `fix/bug-description`
- **Hotfix branches**: `hotfix/issue-description`

### Important: All PRs Must Target `dev` Branch

⚠️ **All pull requests must be made to the `dev` branch, not `main`.**

The `main` branch is protected and only receives code from `dev` after thorough testing and review.

### Workflow Steps

1. **Update Your Local Repository**
   ```bash
   git checkout dev
   git pull origin dev
   ```

2. **Create Your Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Follow coding standards
   - Write clean, typed TypeScript
   - Add appropriate comments
   - Update documentation

4. **Test Your Changes**
   ```bash
   bun run dev        # Test in development
   bun run build      # Ensure build succeeds
   bun run lint       # Check for linting errors
   ```

5. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

6. **Push to the Repository**
   ```bash
   git push origin feature/your-feature-name
   ```

---

## 🔀 Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] All tests pass (when test framework is available)
- [ ] Code is properly typed (TypeScript)
- [ ] Documentation is updated
- [ ] No linting errors
- [ ] Changes are tested locally
- [ ] PR template is filled out completely (see [PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md))

### Creating a Pull Request

1. **Go to GitHub**
   - Navigate to the repository
   - Click "New Pull Request"
   - **Select `dev` as the base branch** (not `main`)
   - Select your feature branch as the compare branch

2. **Fill Out the PR Template**
   - The PR template will automatically load (see [PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md))
   - **Complete all sections** - this is mandatory
   - Provide clear description of changes
   - Link related issues using `#issue_number`
   - Add screenshots in the "Additional Notes" section if applicable
   - Mark the appropriate type of change
   - Complete the checklist

3. **PR Template Requirements**
   - **Description**: Clear explanation of what the PR does
   - **What did I do**: Bullet points listing all changes
   - **Type of Change**: Mark the appropriate option (Bug fix, New feature, etc.)
   - **Related Issues**: Link to any related issues using `Closes #issue_number`
   - **Checklist**: All items must be checked
   - **Additional Notes**: Screenshots, context, or additional information

   **All sections of the PR template must be completed before the PR can be reviewed.**

4. **Wait for Review**
   - Code reviews are **required** before merging
   - Address review comments promptly
   - Be open to feedback and suggestions
   - Update the PR if changes are requested

### Review Process

1. **Automated Checks**
   - CI/CD pipeline runs automatically
   - Linting and type checking
   - Build verification

2. **Code Review**
   - At least one approval required
   - Reviewers may request changes
   - Address all feedback before merging

3. **Approval & Merge**
   - Maintainer approval required
   - PR is merged to `dev` branch
   - Changes will be tested before merging to `main`

---

## 📝 Coding Standards

### TypeScript

- Use strict TypeScript mode
- Avoid `any` types
- Define proper interfaces for props and data
- Use JSDoc for complex functions

### React

- Use functional components with hooks
- Follow React best practices
- Implement proper error boundaries
- Use proper prop types

### File Organization

- Follow the project structure (see [PROJECT_LAYOUT.md](../PROJECT_LAYOUT.md))
- Use appropriate file naming conventions
- Keep components focused and single-purpose

### Accessibility

- Add ARIA labels to interactive elements
- Ensure keyboard navigation works
- Test with screen readers when possible
- Follow WCAG guidelines

### Performance

- Optimize images and assets
- Use code splitting for large components
- Implement virtual scrolling for long lists
- Avoid unnecessary re-renders

---

## 💬 Commit Guidelines

### Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat: add high contrast mode toggle

Adds a toggle button in the header to enable/disable high contrast mode
for better accessibility. Includes store management and CSS styling.

Closes #123
```

```
fix: resolve mobile overflow issue in message display

Fixes content being cut off on mobile devices by adjusting flexbox
properties and adding proper width constraints.

Fixes #456
```

---

## 🧪 Testing

### Current Status

Testing infrastructure is planned but not yet implemented. When available:

- Write unit tests for utilities
- Write component tests for UI
- Write integration tests for features
- Ensure all tests pass before submitting PR

### Manual Testing

Until automated tests are available:
- Test all functionality manually
- Test on different screen sizes
- Test with different browsers
- Test accessibility features

---

## 📚 Documentation

### Code Documentation

- Add JSDoc comments to complex functions
- Document component props with interfaces
- Explain non-obvious code logic
- Update README for user-facing changes

### Updating Documentation

- Update README.md for new features
- Update PROJECT_LAYOUT.md for structural changes
- Update this file for workflow changes
- Add inline comments for complex logic

---

## 🐛 Reporting Issues

### Before Reporting

- Check if the issue already exists
- Verify it's not a configuration problem
- Test with the latest code from `dev`

### Issue Template

When creating an issue, include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots if applicable

---

## ❓ Questions?

- Check [PROJECT_LAYOUT.md](../PROJECT_LAYOUT.md) for code structure
- Review existing code for patterns
- Ask in issue comments
- Open a discussion on GitHub

---

## 🙏 Thank You!

Your contributions make Tax Yasef better for everyone. We appreciate your time and effort!

---

**Remember**: All PRs must target the `dev` branch, and code reviews are required. Thank you for contributing! 🎉

