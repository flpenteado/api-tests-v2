# API Tests v2

A modern API testing application with a Postman-like interface, built with Next.js and designed for efficiency.

## Features

- **JSON Editor with Variable Support**: Monaco editor with syntax highlighting and variable placeholder support (`{{variable_name}}`)
- **API Testing Interface**: Postman-like interface for HTTP requests
- **Collections Management**: Organize API endpoints into collections
- **Environment Variables**: Manage different environments and variables
- **Dark Theme**: Developer-friendly dark theme optimized for productivity

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm test` - Run tests with Vitest
- `pnpm storybook` - Start Storybook for component development

## Architecture

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom design system
- **Editor**: Monaco Editor for JSON editing
- **Testing**: Vitest + Testing Library
- **Documentation**: Storybook
- **Package Manager**: pnpm

## Development Workflow

This project follows the spec-workflow pattern. See `CLAUDE.md` for detailed development guidelines and AI assistance instructions.
