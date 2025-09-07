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

## Architecture

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom design system
- **Editor**: Monaco Editor for JSON editing
- **Testing**: Vitest + Testing Library
- **Package Manager**: pnpm

## State Management (Zustand)

- O estado global é gerenciado com Zustand, exposto via um Provider baseado em Context: `src/app/state/StoreProvider.tsx`.
- A store principal fica em `src/app/state/appStore.ts` e mantém:
  - request: endpoint, method, body
  - response: último resultado (status, durationMs, response)
  - placeholders: lista e valores
  - display: campos disponíveis/selecionados para request/response
- Não há qualquer persistência em localStorage. Todo estado é volátil (em memória) no cliente. Isso prepara o projeto para persistência futura no backend/banco de dados.
- Componentes consumidores podem acessar o estado via `useAppStore(selector)`.

Integração:

- O Provider é incluído no layout global: `src/app/layout.tsx`.
- A página principal (`src/app/page.tsx`) e componentes como `AppMainContent` leem e escrevem diretamente na store.

## Notas de Migração (remoção de localStorage)

- Toda a persistência anterior em `localStorage` foi removida. Preferências como aba ativa e largura do painel agora são apenas estados locais e não persistem entre recargas (comportamento intencional).
- Classes/serviços legados de persistência local foram descontinuados:
  - `src/app/state/requestsStore.ts` (substituído por Zustand) — arquivo mantido como stub vazio.
  - `src/app/services/RequestsService.ts` (execução direta substituída por `/api/proxy`) — arquivo mantido como stub vazio.
- Serviços utilitários como `CsvService` foram atualizados para não depender desses artefatos.

Próximos passos para backend:

- Introduzir endpoints no backend para salvar/recuperar coleções, execuções (RequestRecord) e preferências de display.
- Adicionar uma camada de sincronização no frontend que carrega/salva o estado via API (substituindo o estado volátil por hidratação/controlada vinda do servidor).

## Development Workflow

This project follows the spec-workflow pattern. See `CLAUDE.md` for detailed development guidelines and AI assistance instructions.
