# Project Layout & Structure

This document provides a comprehensive overview of the Tax Yasef project structure, folder organization, and coding guidelines.

## 📁 Directory Structure

```
tax-yasef/
├── .github/                    # GitHub configuration
│   ├── CONTRIBUTING.md        # Contribution guidelines
│   ├── PULL_REQUEST_TEMPLATE.md  # PR template
│   └── workflows/             # CI/CD workflows
│       └── ci.yml             # Continuous Integration
├── api/                        # Vercel serverless functions
│   └── groq/                  # Groq API proxy endpoint
├── public/                     # Static assets
│   ├── logo.svg               # Light mode logo
│   ├── logo-dark.svg          # Dark mode logo
│   ├── images/                # Image assets
│   └── manifest.json          # PWA manifest
├── src/                        # Source code
│   ├── components/            # React components
│   ├── lib/                   # Core utilities and services
│   ├── pages/                 # Page components
│   ├── router.tsx             # Application routing
│   ├── main.tsx               # Application entry point
│   ├── App.tsx                # Root component
│   └── index.css              # Global styles
├── .env.example               # Environment variables template
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite configuration
└── README.md                  # Project documentation
```

---

## 📂 Major Folders

### `src/components/`

**Purpose**: Contains all React components organized by type and purpose.

**Structure**:

```
components/
├── accessibility/          # Accessibility-focused components
│   ├── sr-only.tsx        # Screen reader only component
│   ├── offline-indicator.tsx  # Offline status indicator
│   └── virtual-message-list.tsx  # Virtual scrolling for messages
├── atoms/                  # Atomic UI components
│   ├── chat-input.tsx     # Chat input component
│   ├── message-display.tsx  # Message rendering component
│   ├── tax-calculator.tsx  # Tax calculator component
│   ├── notification-banner.tsx  # Notification system
│   └── token-usage-notification.tsx  # Token usage alerts
├── layout/                 # Layout components
│   └── chat-header.tsx    # Application header
├── modals/                 # Modal components
│   └── info-modal.tsx     # Information modal
└── ui/                     # Reusable UI primitives (Radix-based)
    ├── button.tsx
    ├── input.tsx
    ├── select.tsx
    ├── dialog.tsx
    └── ... (other UI components)
```

**Guidelines**:

- Use TypeScript with strict typing
- Follow atomic design principles
- Keep components focused and single-purpose
- Use proper prop types and interfaces
- Include accessibility attributes (ARIA labels, roles)
- Export components as default or named exports consistently

---

### `src/lib/`

**Purpose**: Core business logic, utilities, services, and shared functionality.

**Structure**:

```
lib/
├── hooks/                  # Custom React hooks
│   ├── useDeviceSize.ts   # Device size detection
│   ├── useFocusManagement.ts  # Focus management utilities
│   ├── useOnlineStatus.ts  # Online/offline detection
│   └── useOpen.ts         # Open/close state management
├── services/               # External service integrations
│   └── groq.ts            # Groq AI API client
├── store/                  # Zustand state stores
│   ├── useMessageStore.ts  # Chat messages state
│   ├── useThemeStore.ts    # Theme management
│   ├── useModelStore.ts    # AI model selection
│   ├── useTokenUsageStore.ts  # Token usage tracking
│   ├── useNotificationStore.ts  # Notification state
│   ├── useHighContrastStore.ts  # High contrast mode
│   └── useUserStore.ts    # User identification
├── types/                  # TypeScript type definitions
│   ├── models.ts          # AI model types
│   └── tax.ts             # Tax calculation types
├── utils/                  # Utility functions
│   ├── security.ts        # Security utilities (XSS, sanitization)
│   ├── rate-limiter.ts    # Frontend rate limiting
│   ├── csrf.ts            # CSRF protection
│   ├── cookies.ts         # Cookie management
│   ├── chunking.ts        # Document chunking
│   ├── document-*.ts      # Document processing utilities
│   ├── prompt-prime.ts    # AI prompt building
│   ├── calculations-context.ts  # Tax calculation context
│   └── ... (other utilities)
├── markdown-renderer.tsx  # Markdown parsing and rendering
├── tax-calculator.ts      # Tax calculation logic
├── user-details.ts        # User identification utilities
├── initialize.ts          # Application initialization
└── utils.ts              # General utility functions
```

**Guidelines**:

- Keep utilities pure and testable
- Use TypeScript for all utilities
- Document complex functions with JSDoc
- Follow single responsibility principle
- Export utilities as named exports
- Group related utilities in the same file

---

### `src/pages/`

**Purpose**: Top-level page components that represent routes.

**Structure**:

```
pages/
├── chat.tsx              # Main chat interface page
└── _not-found.tsx        # 404 error page
```

**Guidelines**:

- Pages should be thin and primarily compose components
- Handle route-specific logic and state
- Use proper semantic HTML structure
- Include accessibility landmarks (main, header, nav, etc.)

---

### `api/`

**Purpose**: Serverless functions for backend API endpoints.

**Structure**:

```
api/
└── groq/
    └── index.ts          # Groq API proxy endpoint
```

**Guidelines**:

- Keep API keys server-side only
- Implement proper error handling
- Add request validation
- Include CORS headers
- Use TypeScript for type safety

---

### `public/`

**Purpose**: Static assets served directly.

**Structure**:

```
public/
├── logo.svg              # Light mode logo
├── logo-dark.svg         # Dark mode logo
├── favicon.ico           # Site favicon
├── images/               # Image assets
│   ├── light-bg.webp    # Light theme background
│   └── dark-bg.webp     # Dark theme background
└── manifest.json        # PWA manifest
```

**Guidelines**:

- Optimize images before adding
- Use appropriate formats (WebP, SVG)
- Keep file sizes minimal
- Use descriptive filenames

---

## 📝 Minor Folders & Files

### `.github/`

**Purpose**: GitHub-specific configuration and templates.

- `CONTRIBUTING.md`: Contribution guidelines
- `PULL_REQUEST_TEMPLATE.md`: PR template
- `workflows/ci.yml`: CI/CD pipeline

### Configuration Files

- `package.json`: Dependencies and scripts
- `tsconfig.json`: TypeScript compiler options
- `vite.config.ts`: Vite build configuration
- `eslint.config.js`: ESLint rules
- `.prettierrc`: Prettier formatting rules
- `.gitignore`: Git ignore patterns

---

## 🎨 Coding Guidelines

### TypeScript

- **Use strict mode**: Enable all strict TypeScript options
- **Type everything**: Avoid `any` types; use `unknown` if necessary
- **Use interfaces for objects**: Prefer interfaces over types for object shapes
- **Export types**: Export types that might be used elsewhere
- **JSDoc comments**: Document complex functions and types

```typescript
/**
 * Calculates Nigerian personal income tax
 * @param annualIncome - Annual income in NGN
 * @returns Tax calculation result with breakdown
 */
export function calculateTax(annualIncome: number): TaxCalculationResult {
  // Implementation
}
```

### React Components

- **Functional components**: Use function components with hooks
- **Props interface**: Define props as interfaces
- **Default exports**: Use default exports for components
- **Named exports**: Use named exports for utilities and types

```typescript
interface ChatInputProps {
  onAfterSubmit?: () => void;
  className?: string;
}

export default function ChatInput({
  onAfterSubmit,
  className,
}: ChatInputProps) {
  // Component implementation
}
```

### File Naming

- **Components**: PascalCase (e.g., `ChatInput.tsx`)
- **Utilities**: kebab-case (e.g., `rate-limiter.ts`)
- **Hooks**: camelCase with `use` prefix (e.g., `useDeviceSize.ts`)
- **Types**: kebab-case (e.g., `models.ts`)

### Import Organization

1. React and external libraries
2. Internal components
3. Internal utilities and hooks
4. Types
5. Styles (if any)

```typescript
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import ChatInput from "@/components/atoms/chat-input";
import { useMessageStore } from "@/lib/store/useMessageStore";
import { sanitizeInput } from "@/lib/utils/security";

import type { Message } from "@/lib/types/models";
```

### State Management

- **Zustand stores**: Use Zustand for global state
- **Local state**: Use `useState` for component-specific state
- **Derived state**: Use `useMemo` for computed values
- **Effects**: Use `useEffect` for side effects

### Accessibility

- **ARIA labels**: Add `aria-label` to interactive elements
- **Roles**: Use semantic HTML and ARIA roles
- **Keyboard navigation**: Ensure all interactive elements are keyboard accessible
- **Focus management**: Manage focus for modals and dynamic content
- **Screen readers**: Use `SROnly` component for screen reader-only content

### Performance

- **Code splitting**: Use dynamic imports for large components
- **Memoization**: Use `React.memo`, `useMemo`, `useCallback` appropriately
- **Virtual scrolling**: Use for long lists
- **Image optimization**: Use optimized images and lazy loading

### Error Handling

- **Try-catch**: Use try-catch for async operations
- **Error boundaries**: Implement error boundaries for React components
- **User feedback**: Show user-friendly error messages
- **Logging**: Log errors appropriately (avoid logging sensitive data)

---

## 🔧 Development Workflow

### Setting Up

1. Clone the repository
2. Install dependencies: `bun install`
3. Set up environment variables
4. Run development server: `bun run dev`

### Making Changes

1. Create a feature branch from `dev`
2. Make your changes following the guidelines
3. Test your changes
4. Run linter: `bun run lint`
5. Format code: `bun run prettier-format`
6. Commit with meaningful messages
7. Push and create PR to `dev` branch

### Code Quality

- **Linting**: All code must pass ESLint
- **Formatting**: All code must be formatted with Prettier
- **Type checking**: All code must pass TypeScript checks
- **Tests**: Add tests for new features (when test framework is set up)

---

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Radix UI](https://www.radix-ui.com/)

---

## 🤝 Questions?

If you have questions about the project structure or coding guidelines:

- Check existing code for patterns
- Review similar components
- Ask in PR comments or issues
- Refer to the [Contributing Guidelines](.github/CONTRIBUTING.md)
