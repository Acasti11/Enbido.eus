---
name: spring-boot-dev
description: Spring Boot 3.x development with Java 21, JPA/Hibernate, layered architecture, and best practices
---

## Spring Boot Development Rules

### Layered Architecture (Strict)
1. **Controller** → HTTP layer only. No business logic.
   - Annotate with `@RestController`, `@RequestMapping`
   - Use `@Valid` for DTO validation
   - Return `ResponseEntity<T>` with proper status codes
   - Map DTOs to entities, never expose entities directly

2. **Service** → Business logic, transactional boundaries.
   - Annotate with `@Service`
   - Use `@Transactional` for write operations
   - Throw custom exceptions for business rule violations
   - Methods max 40 lines

3. **Repository** → Data access only.
   - Extend `JpaRepository<T, ID>` or use `@Repository`
   - Custom queries with `@Query` and named parameters
   - NEVER raw SQL concatenation

4. **Entity** → JPA mapping only. No business logic.
   - Use `@Entity`, `@Table(name = "snake_case")`
   - FetchType.LAZY by default
   - Cascade only where logically necessary
   - Use `@Index` for frequent query columns

5. **DTO** → Data transfer, validation.
   - Use Java `record` classes
   - Jakarta Validation annotations (`@NotNull`, `@Email`, `@Size`)
   - No JPA annotations in DTOs

### Java 21 Features
- Records for DTOs and immutable data
- Pattern matching in switch/if where appropriate
- Text blocks for multi-line strings (SQL, JSON templates)
- Virtual threads for I/O operations

### Lombok Rules
- `@Slf4j` for logging (NEVER `System.out.println`)
- `@Builder` for complex DTOs
- `@RequiredArgsConstructor` for dependency injection
- **NEVER** `@Data` on JPA entities → use `@Getter` + `@Setter`

### Testing
- JUnit 5 + Mockito
- Naming: `should[ExpectedBehavior]When[Condition]`
- Integration tests: `@SpringBootTest` + TestContainers
- Coverage: >80% services, >60% controllers

### Error Handling
- `GlobalExceptionHandler` with `@ControllerAdvice`
- Custom exceptions extending `RuntimeException`
- Response: `{ "error": "CODE", "message": "...", "timestamp": "..." }`
- NEVER expose stack traces in production

### Security
- JWT for stateless auth
- BCrypt for password hashing
- Input sanitization
- Secrets in environment variables only
