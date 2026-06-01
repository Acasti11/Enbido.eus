# Fullstack App: Spring Boot + React + MySQL + Docker

## Overview
Fullstack web application. Backend: Spring Boot 3.x (Java 21, Maven, JPA/Hibernate). 
Frontend: React 18+ (TypeScript, Vite). DB: MySQL 8.0. 
Deployment: Docker Compose (3 independent services).

## Tech Stack
- **Backend**: Java 21, Spring Boot 3.4, Maven, Hibernate, Jakarta Validation, Lombok
- **Frontend**: React 18+, TypeScript, Vite, react-i18next (ES/EN/FR), Tailwind CSS
- **Database**: MySQL 8.0 (InnoDB, Docker container)
- **DevOps**: Docker, Docker Compose, Nginx (reverse proxy)

## Commands (COPY-PASTE EXACT)

### Backend
```bash
cd backend
mvn clean install                    # Build + tests
mvn spring-boot:run                  # Dev server (port 8080)
mvn test                             # Unit tests
mvn verify                           # Full check (tests + integration)
```

### Frontend
```bash
cd frontend
npm install                          # Install deps
npm run dev                          # Dev server (port 5173)
npm run build                        # Production build
npm run test                         # Run tests
npm run lint                         # ESLint check
```

### Docker (Full Stack)
```bash
docker-compose up --build            # Build + start all services
docker-compose down -v               # Stop + remove volumes
docker-compose logs -f backend       # Tail backend logs
docker-compose logs -f frontend      # Tail frontend logs
docker-compose logs -f db            # Tail DB logs
```

## Architecture Rules

### Backend
- **Layered architecture**: Controller -> Service -> Repository -> Entity
- Controllers: thin, only HTTP handling + DTO mapping
- Services: business logic, transactional boundaries
- Repositories: JPA interfaces, custom queries with @Query
- Entities: JPA annotations, no business logic
- DTOs: record classes, Jakarta Validation annotations
- **Never** put business logic in controllers
- **Never** use raw SQL without parameterized queries

### Frontend
- **Component structure**: Page -> Section -> Component -> UI primitive
- Hooks: custom hooks in `src/hooks/`, prefix with `use`
- State: React Context for global, useState for local
- API calls: centralized in `src/services/api.ts` with axios interceptors
- i18n: `react-i18next`, locales in `public/locales/`, lazy loading
- **Never** call API directly from components (use service layer)
- **Never** hardcode strings (use `t('key')` from i18n)

### Database
- MySQL 8.0, InnoDB engine
- Migrations: Flyway (`backend/src/main/resources/db/migration/`)
- Naming: snake_case for tables/columns
- Relations: define in JPA entities, cascade carefully

### Docker
- 3 services: `backend`, `frontend`, `db`
- Networks: `app-network` (internal)
- Volumes: `mysql-data` (persistent)
- Environment: `.env` file, never commit secrets

## Global Naming Conventions (ALL CODE)

### Language Rule
- **Idioma principal: INGLES**. All code (variables, functions, components, comments, commits) strictly in English.

### Casing Rules
- **PascalCase**: Files, React components, classes, interfaces (e.g., `UserProfile.tsx`, `UserDto`, `PaymentConfig`)
- **camelCase**: Standard variables, states, props (e.g., `userData`, `itemCount`)
- **UPPER_SNAKE_CASE**: Constants, fixed values, global configs (e.g., `CONST_MAX`, `API_BASE_URL`)
- **kebab-case**: CSS classes (e.g., `btn-primary`, `nav-bar-container`)

### Boolean Prefixes
- Booleans MUST start with `is`, `has`, `should`, or `can` (e.g., `isLoading`, `hasError`, `canEdit`)

## Testing
- Backend: >80% coverage on services, integration tests for controllers
- Frontend: Jest + React Testing Library, >70% coverage
- E2E: Cypress (optional, `frontend/cypress/`)

## Git Workflow
- Conventional Commits: `feat(scope): description`
- Branch naming: `feature/`, `bugfix/`, `hotfix/`
- PRs: require review + CI pass
- **Never** force push to main
- **Never** commit `.env` files or secrets

## Ask First (DO NOT DO without permission)
- Add new dependencies (Maven/npm)
- Change database schema (add migration first)
- Modify Docker Compose structure
- Delete existing tests
- Change API contracts (DTOs/entities)
- Add new language support to i18n
- Change global naming conventions

## Never (ABSOLUTE RULES)
- Commit secrets, API keys, or DB credentials
- Use `System.out.println` (use SLF4J)
- Use `any` type in TypeScript
- Write raw SQL in controllers
- Skip tests before committing
- Hardcode URLs or config values
- Write code in Spanish (variables, comments, commits)
- Create components with >40 line functions
- Nest hooks inside loops, conditions, or nested functions

## File Locations
- Backend root: `backend/`
- Frontend root: `frontend/`
- Docker config: `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`
- DB migrations: `backend/src/main/resources/db/migration/`
- i18n locales: `frontend/public/locales/`
- Custom hooks: `frontend/src/hooks/`
- API services: `frontend/src/services/`
