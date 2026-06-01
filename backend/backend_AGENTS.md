# Backend-Specific Rules (Spring Boot + Java 21)

## API Conventions
- RESTful endpoints: `/api/v1/resource`
- Response: standardized wrapper `{ data, message, timestamp }`
- Errors: GlobalExceptionHandler with `@ControllerAdvice`
- Status codes: 200 OK, 201 Created, 400 Bad Request, 404 Not Found, 500 Internal Error
- **Controllers are thin**: Only HTTP handling + DTO mapping. ZERO business logic.

## Layered Architecture (Strict)
- **Controller** -> HTTP layer, DTO validation, response wrapping
- **Service** -> Business logic, transactional boundaries (`@Transactional`)
- **Repository** -> JPA interfaces, custom `@Query` methods
- **Entity** -> JPA annotations, no business logic, relations with cascade
- **DTO** -> Record classes, Jakarta Validation annotations
- **Mapper** -> MapStruct or manual mapping, separate from entities

## Naming Conventions (Backend)
- **Classes/Interfaces/Records**: PascalCase (e.g., `UserDto`, `PaymentConfig`, `OrderService`)
- **Variables/Methods**: camelCase (e.g., `userData`, `itemCount`, `fetchUserById`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_PAGE_SIZE`, `JWT_SECRET_KEY`)
- **Booleans**: `is`, `has`, `should`, `can` prefix (e.g., `isActive`, `hasPermission`)
- **Database tables/columns**: snake_case (e.g., `user_profiles`, `created_at`)
- **Methods MUST start with verb**: `get`, `fetch`, `create`, `update`, `delete`, `calculate`, `validate`, `process`

## Method Length Rule
- **40-line limit**: NO method (service, controller, repository) may exceed 40 lines.
- If longer, extract to private helper methods or separate service classes.

## Java 21 Features (Use When Appropriate)
- Records for DTOs and immutable data
- Pattern matching in switch/if
- Virtual threads for I/O operations (`Executors.newVirtualThreadPerTaskExecutor()`)
- Text blocks for multi-line strings (SQL, JSON templates)
- Sealed classes for domain modeling (where applicable)

## Lombok Usage
- `@Data` for entities (with caution, prefer explicit getters/setters for control)
- `@Builder` for complex DTOs
- `@Slf4j` for logging (NEVER `System.out.println`)
- `@RequiredArgsConstructor` for dependency injection
- **NEVER** use `@Data` on JPA entities (causes issues with lazy loading). Use `@Getter` + `@Setter` instead.

## JPA / Hibernate Rules
- **FetchType.LAZY** by default (EAGER only with explicit justification)
- **Cascade**: only where logically necessary, document why
- **Indexes**: add `@Index` for frequently queried columns
- **Pagination**: `Pageable` for lists > 50 items
- **Bidirectional relations**: use `mappedBy`, avoid circular JSON with `@JsonIgnore`
- **Custom queries**: `@Query` with named parameters, NEVER string concatenation

## Validation
- DTOs: Jakarta Validation annotations (`@NotNull`, `@Email`, `@Size`, etc.)
- Service layer: business rule validation, throw custom exceptions
- Controller: `@Valid` on request bodies
- Custom validators: reusable, tested independently

## Exception Handling
- GlobalExceptionHandler with `@ControllerAdvice`
- Custom exceptions extending `RuntimeException` (e.g., `UserNotFoundException`, `InvalidOrderException`)
- Error response: `{ "error": "CODE", "message": "...", "timestamp": "..." }`
- NEVER expose stack traces or internal details in production

## Testing
- **Unit tests**: JUnit 5 + Mockito, naming `*Test.java`
- **Integration tests**: `@SpringBootTest`, TestContainers for DB
- **Coverage**: >80% on services, >60% on controllers
- **Naming**: `should[ExpectedBehavior]When[Condition]` (e.g., `shouldThrowExceptionWhenUserNotFound`)

## Database Migrations (Flyway)
- Location: `src/main/resources/db/migration/`
- Naming: `V1__create_users_table.sql`, `V2__add_orders_table.sql`
- **Never** modify existing migration files after deployment
- Always test migrations against fresh and existing databases

## Security
- JWT for stateless authentication
- Passwords: BCrypt hashing (never plain text)
- CORS: configured, not wildcard in production
- Input sanitization: prevent SQL injection, XSS
- Secrets: environment variables, NEVER in code or config files

## Logging
- SLF4J with structured logging (JSON format in production)
- Log levels: DEBUG for dev, INFO for normal ops, WARN for issues, ERROR for failures
- Include correlation IDs for request tracing
- **NEVER** log sensitive data (passwords, tokens, PII)

## Ask First
- Add new entity/table (requires migration)
- Change existing API endpoint (breaking change)
- Modify security configuration
- Add new Maven dependency
- Skip tests before commit
- Use raw SQL outside repositories

## Never
- Commit secrets, API keys, or DB credentials
- Use `System.out.println` (use SLF4J)
- Write raw SQL in controllers or services (use repositories)
- Skip tests before committing
- Use `FetchType.EAGER` without documented justification
- Modify existing Flyway migrations after deployment
- Expose stack traces in production error responses
- Methods longer than 40 lines
- Business logic in controllers
- Hardcoded configuration values (use `@Value` or `@ConfigurationProperties`)
