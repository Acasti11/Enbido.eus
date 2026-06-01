---
name: react-frontend-dev
description: React 18+ with TypeScript, Vite, component architecture, hooks, and Tailwind CSS
---

## React Development Rules

### Component Architecture
- **One component per file**. Each `.tsx` exports exactly one component.
- **PascalCase** for file names and component names: `UserProfile.tsx`
- **Max componentization**: Extract any repeated UI or logical grouping to independent components.
- **Props destructuring**: Always in parameters. NEVER `props.name`.
  ```tsx
  // CORRECT
  const UserProfile = ({ name, age }: UserProfileProps) => { ... }

  // WRONG
  const UserProfile = (props) => { ... props.name ... }
  ```

### Function Rules
- **Verbs mandatory**: All functions must describe the action: `fetchData`, `calculateTotal`, `getUserProfile`
- **Event handlers**: Start with `handle`: `handleClick`, `handleSubmit`, `handleInputChange`
- **Handler props**: Start with `on`: `onClick`, `onSubmit`, `onChange`
- **40-line limit**: No function exceeds 40 lines. Split into helpers.

### JSX Logic
- **Extract before return**: Never complex logic inside `return`.
  ```tsx
  // CORRECT
  const isFormValid = name && email && password.length >= 8;
  return (
    <button disabled={!isFormValid}>Submit</button>
  );

  // WRONG
  return (
    <button disabled={!(name && email && password.length >= 8)}>Submit</button>
  );
  ```

### Hooks
- **Custom hooks**: Start with `use`, camelCase: `useFetchUsers`, `useWindowSize`
- **Top-level only**: Never inside loops, conditions, or nested functions.
- **Naming booleans**: `isLoading`, `hasError`, `canEdit`, `shouldRefresh`

### TypeScript
- Strict mode enabled (`strict: true`)
- NEVER use `any` type
- Interfaces for props and API responses
- Types for unions and complex structures

### Styling
- **Primary**: Tailwind CSS
- **Complex components**: CSS modules with kebab-case classes
- **NEVER** inline styles for layout
- CSS classes: `btn-primary`, `nav-bar-container`, `text-bold-red`

### API Integration
- Centralized in `src/services/api.ts`
- Axios with interceptors for auth and error handling
- NEVER call API directly from components
- Handle errors in service layer, return standardized errors

### File Structure
```
src/
├── components/     # Reusable UI components
├── pages/          # Route-level pages
├── hooks/          # Custom hooks (use*)
├── services/       # API calls
├── types/          # TypeScript interfaces/types
├── utils/          # Helper functions
└── i18n/           # i18n configuration
```

### Ask Before
- Adding new npm dependency
- Changing component architecture pattern
- Skipping React Testing Library tests
