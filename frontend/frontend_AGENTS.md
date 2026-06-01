# Frontend-Specific Rules (React + TypeScript + Vite)

## React Component Architecture
- **Max componentization**: Any repeated UI section or logical grouping MUST be extracted to an independent React component. A large component is error-prone; split it.
- **One component per file**: Each `.jsx` or `.tsx` file MUST export exactly one main component.
- **Props destructuring**: Always destructure props in component parameters. NEVER use `props.name`.
  - CORRECT: `const UserProfile = ({ name, age }) => { ... }`
  - WRONG: `const UserProfile = (props) => { ... props.name ... }`

## Function Rules
- **Verbs mandatory**: ALL function names MUST include a verb describing the exact action (e.g., `fetchData`, `calculateTotal`, `getUserProfile`).
- **Event handlers**: Functions triggered by user actions MUST start with `handle` (e.g., `handleClick`, `handleSubmit`, `handleInputChange`).
- **Handler props**: Props receiving these functions MUST start with `on` (e.g., `onClick`, `onSubmit`, `onChange`).
- **40-line limit**: NO function (event handler, effect, utility) may exceed 40 lines. If longer, split into smaller helper functions.

## JSX Logic Rules
- **Extract logic before return**: NEVER write complex math or conditional logic inside the `return` statement. Extract to descriptive variables just before the `return`.
  - CORRECT: `const isFormValid = name && email; return (...)`
  - WRONG: `return ({name && email && <button>...</button>})`

## State & Hooks
- **Custom hooks naming**: All custom hooks MUST start with `use` in camelCase (e.g., `useFetchUsers`, `useWindowSize`).
- **Hooks rule**: Call hooks ONLY at the top level of components. NEVER nest inside loops, conditions, or nested functions.
  - CORRECT: `useEffect(() => {...}, [])` at top of component
  - WRONG: `if (condition) { useEffect(...) }`

## Naming Conventions (Frontend)
- **Files/Components**: PascalCase (e.g., `UserProfile.tsx`, `NavigationBar.tsx`)
- **Variables/States/Props**: camelCase (e.g., `userData`, `itemCount`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`, `MAX_RETRY_COUNT`)
- **Booleans**: `is`, `has`, `should`, `can` prefix (e.g., `isLoading`, `hasError`, `canEdit`)
- **CSS Classes**: kebab-case (e.g., `btn-primary`, `nav-bar-container`, `text-bold-red`)
- **Event handlers**: `handle` prefix (e.g., `handleClick`)
- **Handler props**: `on` prefix (e.g., `onClick`, `onSubmit`)

## i18n Setup
- Library: `react-i18next` + `i18next-browser-languagedetector`
- Fallback: `es`
- Supported: `es`, `en`, `fr`
- Locales path: `public/locales/{{lng}}/common.json`
- Lazy loading via HTTP backend
- **All user-facing strings MUST use `t('key')`**. NEVER hardcode text in components.

## API Calls
- Centralized in `src/services/api.ts` with axios interceptors
- NEVER call API directly from components (use service layer)
- Handle errors with try/catch in services, return standardized errors

## Styling
- Primary: Tailwind CSS
- Complex components: CSS modules (kebab-case classes)
- NEVER use inline styles for layout (use Tailwind classes)

## Ask First
- Add new language support
- Change i18n configuration
- Add new npm dependency
- Change component architecture pattern
- Skip React Testing Library tests

## Never
- Use `any` type in TypeScript (strict mode enabled)
- Write components in Spanish (names, comments, strings)
- Functions longer than 40 lines
- Nested hooks
- Props without destructuring
- Hardcoded strings (use i18n)
- Inline styles for layout
