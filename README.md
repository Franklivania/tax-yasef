# Tax Yasef

<div align="center">

![Tax Yasef Logo](public/logo-dark.svg#gh-dark-mode-only)
![Tax Yasef Logo](public/logo.svg#gh-light-mode-only)

**Make e no do you like film. Understand wetin dey sup before e reach...**

_A Nigerian Tax Assistant powered by AI to help you understand and calculate your tax obligations under the Nigerian Tax Act 2025_

[![Open Source](https://img.shields.io/badge/Open%20Source-Yes-green.svg)](LICENSE)
[![License](https://img.shields.io/badge/License-Open-blue.svg)](LICENSE)
[![Package Manager](https://img.shields.io/badge/Package%20Manager-Bun-orange.svg)](https://bun.sh)

</div>

---

## 📖 About

**Tax Yasef** is an intelligent tax assistant application designed to help Nigerian taxpayers understand and calculate their tax obligations based on the **Nigerian Tax Act 2025**. The application combines AI-powered chat functionality with an interactive tax calculator to provide comprehensive tax guidance and calculations.

### Concept

The name "Yasef" is derived from the Nigerian Pidgin phrase "guard yourself" - emphasizing the importance of being informed and prepared when it comes to tax matters. The application aims to demystify the complex Nigerian tax system by providing:

- **AI-Powered Tax Guidance**: Chat with an intelligent assistant that understands the Nigerian Tax Act 2025
- **Interactive Tax Calculator**: Calculate your personal income tax with detailed breakdowns
- **Document-Based Knowledge**: RAG (Retrieval Augmented Generation) system that references the actual Tax Act document
- **Accessible Design**: Built with accessibility and mobile-first principles

### Aim

To empower Nigerian taxpayers with accurate, accessible, and understandable tax information, helping them make informed decisions about their tax obligations without the need for immediate professional consultation (though professional advice is always recommended for complex situations).

---

## 🚀 Features

### Core Functionalities

#### 1. **AI Chat Assistant**

- Conversational interface for tax-related questions
- Powered by Groq AI with multiple model support
- Context-aware responses based on the Nigerian Tax Act 2025
- Document retrieval system (RAG) for accurate information
- Content filtering to ensure tax-focused conversations

#### 2. **Tax Calculator**

- Nigerian Personal Income Tax calculator (Tax Act 2025 compliant)
- 6-band marginal rate system (0%, 15%, 18%, 21%, 23%, 25%)
- Monthly and annual breakdown views
- Band-by-band tax calculation with detailed explanations
- AI-generated explanations for calculations
- Calculation history (last 50 calculations)
- Effective tax rate computation

#### 3. **Document Processing**

- PDF extraction and processing
- Intelligent text normalization and structure detection
- Semantic chunking for efficient retrieval
- FlexSearch-based indexing for fast document queries
- IndexedDB caching for offline access

#### 4. **Accessibility Features**

- Screen reader support (ARIA labels and roles)
- Keyboard navigation
- High contrast mode
- Focus management
- Offline detection and messaging
- Mobile-responsive design

#### 5. **Security & Performance**

- Frontend rate limiting
- Input sanitization and XSS prevention
- CSRF protection
- Secure API proxy (server-side API key handling)
- Virtual scrolling for long message lists
- Optimized bundle size

---

## 🛠️ Technologies

### Frontend Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Core                        │
├─────────────────────────────────────────────────────────┤
│ React 19.2.0          │ TypeScript 5.9.3                │
│ Vite 7.2.4            │ React Router 7.11.0             │
└─────────────────────────────────────────────────────────┘
```

### State Management & Data

```
┌─────────────────────────────────────────────────────────┐
│              State & Data Management                    │
├─────────────────────────────────────────────────────────┤
│ Zustand 5.0.9         │ IndexedDB                       │
│ FlexSearch 0.8.212     │ LocalStorage                   │
└─────────────────────────────────────────────────────────┘
```

### UI & Styling

```
┌─────────────────────────────────────────────────────────┐
│                    UI Framework                         │
├─────────────────────────────────────────────────────────┤
│ Tailwind CSS 4.1.18    │ Radix UI Components            │
│ Lucide Icons           │ Iconify React                  │
└─────────────────────────────────────────────────────────┘
```

### AI & Backend

```
┌─────────────────────────────────────────────────────────┐
│                  AI & Backend Services                  │
├─────────────────────────────────────────────────────────┤
│ Groq API              │ Vercel Serverless Functions     │
│ RAG System            │ PDF.js 5.4.449                  │
└─────────────────────────────────────────────────────────┘
```

### Development Tools

```
┌─────────────────────────────────────────────────────────┐
│                  Development & Quality                  │
├─────────────────────────────────────────────────────────┤
│ ESLint 9.39.1         │ Prettier 3.7.4                  │
│ Husky 9.1.7           │ TypeScript ESLint               │
│ Lint-staged           │ Git Hooks                       │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

For detailed information about the project structure, folder organization, and coding guidelines, please refer to [PROJECT_LAYOUT.md](./PROJECT_LAYOUT.md).

### Quick Overview

```
tax-yasef/
├── src/
│   ├── components/      # React components (atoms, layout, ui, accessibility)
│   ├── lib/            # Core utilities, services, stores, hooks
│   ├── pages/          # Page components (chat, not-found)
│   ├── router.tsx      # Application routing
│   └── main.tsx        # Application entry point
├── public/             # Static assets
├── .github/            # GitHub workflows and templates
└── api/                # Vercel serverless functions
```

---

## 🚦 Getting Started

### Prerequisites

- **Bun** (recommended) or Node.js 18+
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/tax-yasef.git
   cd tax-yasef
   ```

2. **Install dependencies**

   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env` (if available)
   - Add your Groq API key to the serverless function (see [API Setup Guide](./README-API-SETUP.md))

4. **Run the development server**

   ```bash
   bun run dev
   # or
   npm run dev
   ```

5. **Build for production**
   ```bash
   bun run build
   # or
   npm run build
   ```

---

## 🤝 Contributing

**Tax Yasef is an open-source project** and we welcome contributions from the community!

### How to Contribute

1. **Read the Contributing Guidelines**
   - See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for detailed guidelines
   - All pull requests must be made to the `dev` branch
   - Code reviews are required before merging
   - You must fill out the PR template completely

2. **Fork the Repository**

   ```bash
   git fork https://github.com/your-username/tax-yasef.git
   ```

3. **Create a Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make Your Changes**
   - Follow the coding guidelines in [PROJECT_LAYOUT.md](./PROJECT_LAYOUT.md)
   - Write clean, typed TypeScript code
   - Add appropriate tests if applicable
   - Update documentation as needed

5. **Commit Your Changes**

   ```bash
   git commit -m "feat: add your feature description"
   ```

6. **Push to Your Fork**

   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Target the `dev` branch
   - Fill out the PR template completely
   - Wait for code review and approval

### Contribution Guidelines

- ✅ All PRs must target the `dev` branch
- ✅ Code reviews are mandatory
- ✅ PR template must be completed
- ✅ Follow TypeScript best practices
- ✅ Maintain accessibility standards
- ✅ Write meaningful commit messages
- ✅ Update documentation for new features

For more details, see [CONTRIBUTING.md](.github/CONTRIBUTING.md).

---

## 📝 License

This project is **open to contribute** and **free to distribute with permission**.

**License Type**: Open Source

**Permissions**:

- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use

**Conditions**:

- ⚠️ License and copyright notice must be included
- ⚠️ Permission required for distribution

For full license details, see [LICENSE](./LICENSE) file.

---

## 📚 Documentation

- [Project Layout & Structure](./PROJECT_LAYOUT.md) - Detailed folder structure and coding guidelines
- [API Setup Guide](./README-API-SETUP.md) - Setting up the Groq API backend
- [Contributing Guidelines](.github/CONTRIBUTING.md) - How to contribute to the project

---

## 🎯 Roadmap

- [ ] Multiple conversation threads
- [ ] Document version management
- [ ] Export calculations (PDF/CSV)
- [ ] Advanced tax planning features
- [ ] Multi-document support
- [ ] Enhanced analytics and monitoring

---

## 🙏 Acknowledgments

- Nigerian Tax Act 2025 document
- Groq AI for providing the AI infrastructure
- All contributors and supporters of the project

---

## 📧 Support

For questions, issues, or contributions:

- Open an issue on GitHub
- Review the [Contributing Guidelines](.github/CONTRIBUTING.md)
- Check the [Project Layout](./PROJECT_LAYOUT.md) for code structure

---

<div align="center">

**Made with ❤️ for Nigerian taxpayers**

_"Make e no do you like film. Understand wetin dey sup before e reach..."_

</div>
