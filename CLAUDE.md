# CLAUDE.md

Guidance for Claude when working inside `mos-backend`. Read this before making changes — especially before adding a new module.

## 1. Project Overview

- **Name:** `mos-backend` — the backend service for MOS (Medical Outreach Management System).
- **Purpose:** REST API that manages bookings, packages, vouchers, vendors, and related medical-outreach entities.
- **Stack:** NestJS 11, MikroORM 6 with PostgreSQL, `class-validator` + `class-transformer`, `@nestjs/swagger`, Jest.
- **Package manager:** `yarn` (see [package.json](package.json)).
- **Sibling repo:** `../mos-frontend` exists but is out of scope for backend work.

## 2. Directory Layout

```
src/
├── main.ts                              # Bootstrap: global ValidationPipe, Swagger, auto-seed
├── app.module.ts                        # Root module — every new feature module is imported here
├── app.controller.ts / app.service.ts
├── mikro-orm.config.ts                  # ORM config (entities glob, migrations, seeder)
├── common/
│   └── mikro-orm.entity-service.ts      # Generic MikroOrmEntityService + EntityMapper interface
├── utils/
│   ├── pagination.utils.ts              # PaginationQueryDto, Paginated<T>, paginatedResponse
│   └── validation.utils.ts              # QueryBooleanTransform, QueryArrayTransform, findDuplicates
├── config/
│   ├── config.ts                        # Env-driven config
│   └── swagger.config.ts                # Swagger DocumentBuilder
├── migrations/                          # MikroORM migrations
├── seeders/                             # MikroORM seeders (e.g. RoleSeeder)
└── roles/                               # Reference feature module — copy its shape
```

Key files to understand before editing:

- [src/main.ts](src/main.ts) — global `ValidationPipe` is enabled with `whitelist: true`, `transform: true`, and `enableImplicitConversion: true`. Swagger is served at `/docs` (JSON at `/docs-json`). `RoleSeeder` is run automatically at boot.
- [src/app.module.ts](src/app.module.ts) — **every new feature module must be added to its `imports` array.**
- [src/common/mikro-orm.entity-service.ts](src/common/mikro-orm.entity-service.ts) — the generic base service (`MikroOrmEntityService`) and `EntityMapper` interface. **Every feature service extends this; do not re-implement CRUD.**
- [src/utils/pagination.utils.ts](src/utils/pagination.utils.ts) — `PaginationQueryDto` is the base class for every `*QueryDto`.
- [src/mikro-orm.config.ts](src/mikro-orm.config.ts) — entities are picked up by glob, so simply creating `*.entity.ts` under `src/` is enough for MikroORM to see them.

## 3. Reference Module — `src/roles/`

All new feature modules **must** mirror this layout file-for-file:

```
src/<feature>/
├── <feature>.module.ts               # MikroOrmModule.forFeature + providers
├── <feature>.controller.ts           # REST endpoints — delegate to service
├── <feature>.service.ts              # extends MikroOrmEntityService
├── <feature>.mapper.ts               # implements EntityMapper
├── <feature>.controller.spec.ts      # defined-only smoke test
├── <feature>.service.spec.ts         # defined-only smoke test
├── dto/
│   ├── create-<feature>.dto.ts
│   ├── update-<feature>.dto.ts       # PartialType(CreateDto) from @nestjs/swagger
│   └── query-<feature>.dto.ts        # extends PaginationQueryDto
└── entities/
    └── <feature>.entity.ts           # + <Feature>Projection enum, SUMMARY_PROJECTION, DEFAULT_PROJECTION
```

Reference files:

- [src/roles/roles.module.ts](src/roles/roles.module.ts)
- [src/roles/roles.controller.ts](src/roles/roles.controller.ts)
- [src/roles/roles.service.ts](src/roles/roles.service.ts)
- [src/roles/roles.mapper.ts](src/roles/roles.mapper.ts)
- [src/roles/entities/role.entity.ts](src/roles/entities/role.entity.ts)
- [src/roles/dto/create-role.dto.ts](src/roles/dto/create-role.dto.ts)
- [src/roles/dto/update-role.dto.ts](src/roles/dto/update-role.dto.ts)
- [src/roles/dto/query-role.dto.ts](src/roles/dto/query-role.dto.ts)

## 4. Rules for Adding a New Module

Naming: directory and filenames use the plural, kebab-cased feature name (`roles`, `bookings`, `medical-packages`). Class names are PascalCase singular for entity (`Role`) and PascalCase plural for service/controller/module (`RolesService`, `RolesController`, `RolesModule`). DB table names are plural snake_case (`roles`, `medical_packages`).

### 4.1 Entity — [src/roles/entities/role.entity.ts](src/roles/entities/role.entity.ts)

- Decorate with `@Entity({ tableName: '<plural_snake>' })` — always set `tableName` explicitly.
- Primary key is a UUID: `@Property({ type: 'uuid', primary: true }) id: string;`.
- Always include timestamps:
  ```ts
  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
  ```
- Where it fits the domain, include the boolean flags used by `Role` (`isActive`, `isDeleted`, and any domain-specific flag such as `isDefault`) with `default: false` where appropriate.
- Export the projection scaffolding from the entity file even if empty — they are type parameters to the base service:
  ```ts
  export enum <Feature>Projection {}
  export const SUMMARY_PROJECTION: <Feature>Projection[] = [];
  export const DEFAULT_PROJECTION: <Feature>Projection[] = [];
  ```

### 4.2 DTOs — [src/roles/dto/](src/roles/dto/)

- **Create DTO** — `class-validator` decorators + `@ApiProperty` / `@ApiPropertyOptional`. Required fields use `@IsNotEmpty`; optional fields use `@IsOptional` and may declare a default.
- **Update DTO** — `export class Update<Feature>Dto extends PartialType(Create<Feature>Dto) {}` (import `PartialType` from `@nestjs/swagger`, not `@nestjs/mapped-types`).
- **Query DTO** — `extends PaginationQueryDto` from [src/utils/pagination.utils.ts](src/utils/pagination.utils.ts). Expose:
  - One optional filter per filterable column.
  - `createdAt` / `updatedAt` as `@IsDateString()` cutoffs.
  - A global `search?: string` used for `$or` full-text matching across string columns in the mapper.
  - UUID filters with `@IsUUID()`.
  - Boolean filters must use `@Transform(({ value }) => QueryBooleanTransform(value))` from [src/utils/validation.utils.ts](src/utils/validation.utils.ts) — the global `ValidationPipe` doesn't coerce query-string booleans by itself.

### 4.3 Mapper — [src/roles/roles.mapper.ts](src/roles/roles.mapper.ts)

- `@Injectable()` class implementing `EntityMapper<Entity, CreateDto, UpdateDto, QueryDto>` (from [src/common/mikro-orm.entity-service.ts](src/common/mikro-orm.entity-service.ts)).
- Constructor injects `@InjectRepository(Entity) repository: EntityRepository<Entity>`.
- Implement:
  - `fromCreateDto(dto)` → `Object.assign(new Entity(), { ...dto })`.
  - `fromUpdateDto(id, dto)` → fetch via `repository.findOne({ id })`, return `null` if missing, otherwise `this.repository.assign(entity, this.entityFromDto(dto))`.
  - `entityFromDto(dto)` → helper that maps the DTO onto a fresh entity (extract nested refs here when needed).
  - `filtersFromQueryDto(query)` → returns `FilterQuery<Entity>[]`; build each filter conditionally and finish with `.filter((f) => !!f)`. Use `$like` / `$ilike` for substring matches and `$or` for the global `search` field.

### 4.4 Service — [src/roles/roles.service.ts](src/roles/roles.service.ts)

- `@Injectable()` and `extends MikroOrmEntityService<Entity, CreateDto, UpdateDto, QueryDto, <Feature>Projection>`.
- Constructor injects the mapper, `@InjectRepository(Entity) repository: EntityRepository<Entity>`, and `EntityManager` — **import `EntityRepository` and `EntityManager` from `@mikro-orm/postgresql`**, then call `super(mapper, repository, entityManager)`.
- Only add methods for behavior that goes beyond the base CRUD (`create`, `createAll`, `find`, `findAll`, `update`, `updateAll`, `remove`, `removeAll`, `upsert`, `upsertAll`).

### 4.5 Controller — [src/roles/roles.controller.ts](src/roles/roles.controller.ts)

- `@Controller('<plural-kebab>')`.
- Standard REST surface — mirror the roles controller verbatim:
  - `POST /` → `create(@Body() dto)`
  - `GET /` → `findAll(@Query() query)`
  - `GET /:id` → `findOne(@Param('id') id)` calling `service.find(id)`
  - `PATCH /:id` → `update(@Param('id') id, @Body() dto)`
  - `DELETE /:id` → `remove(@Param('id') id)`
- Controllers contain **no business logic** — every handler is a one-liner that delegates to the service.

### 4.6 Module — [src/roles/roles.module.ts](src/roles/roles.module.ts)

- `imports: [MikroOrmModule.forFeature([Entity])]`.
- `providers: [Service, Mapper]`, `controllers: [Controller]`.
- Export the service if another module will consume it.
- **Register the module in [src/app.module.ts](src/app.module.ts) `imports`** — modules are not picked up automatically.

### 4.7 Tests — [src/roles/roles.controller.spec.ts](src/roles/roles.controller.spec.ts), [src/roles/roles.service.spec.ts](src/roles/roles.service.spec.ts)

- Create the two stub spec files with the same "should be defined" pattern so `yarn test` keeps passing. Add deeper tests only when the task requires them.

### 4.8 Migration

- After adding/changing an entity: `yarn mikro:create` to generate a migration in [src/migrations/](src/migrations/).
- Review the generated SQL, then apply with `yarn mikro:up` (rollback with `yarn mikro:down`).
- Do **not** hand-edit the `.snapshot-mos_db.json` file.

### 4.9 Seeder (optional)

- Only add one if the data must exist on every boot. Follow the [src/seeders/RoleSeeder.ts](src/seeders/RoleSeeder.ts) pattern: find-then-create, a single `em.flush()` at the end.
- To run on boot, call `seeder.seed(<YourSeeder>)` from [src/main.ts](src/main.ts) next to `RoleSeeder`.

## 5. Authorization — CASL

All authorization uses CASL (`@casl/ability`). The guard stack runs globally — **do not add `@UseGuards()` to controllers**. Every authenticated request automatically passes through `JwtAuthGuard` → `PoliciesGuard` in that order (registered via `APP_GUARD` in [src/auth/auth.module.ts](src/auth/auth.module.ts)).

### Key files

| File | Purpose |
|---|---|
| [src/auth/casl/ability.types.ts](src/auth/casl/ability.types.ts) | `Action` enum, `AppSubject` union, `AppAbility` type |
| [src/auth/casl/casl-ability.factory.ts](src/auth/casl/casl-ability.factory.ts) | Builds an `AppAbility` for the current user — **all rules live here** |
| [src/auth/casl/policies.guard.ts](src/auth/casl/policies.guard.ts) | Global guard — reads `@CheckPolicies()` metadata and evaluates rules |
| [src/auth/casl/check-policies.decorator.ts](src/auth/casl/check-policies.decorator.ts) | `@CheckPolicies()` decorator + `PolicyHandler` types |
| [src/auth/decorators/public.decorator.ts](src/auth/decorators/public.decorator.ts) | `@Public()` — bypasses both guards for open endpoints |
| [src/auth/decorators/current-user.decorator.ts](src/auth/decorators/current-user.decorator.ts) | `@CurrentUser()` — extracts the JWT payload from the request |
| [src/auth/decorators/current-ability.decorator.ts](src/auth/decorators/current-ability.decorator.ts) | `@CurrentAbility()` — extracts the built `AppAbility` for resource-level checks in services |

### Current rules summary (in `CaslAbilityFactory`)

| Role | Can |
|---|---|
| `SUPER_ADMIN` | `manage('all')` — unrestricted |
| `OUTREACH_ADMIN` | Manage `Outreach`; Create/Read/Update `User`; Read `Role` |
| `NURSE`, `DOCTOR`, `DATA_CLERK`, `PHARMACIST` | Read `Outreach` where id is in their outreach memberships; Read `User` in those outreaches |
| **All authenticated users** | Read and Update own `User` record |

### Usage patterns

**Type-level check on a handler (most common):**
```ts
@Get()
@CheckPolicies((ability) => ability.can(Action.Read, 'Outreach'))
findAll() { ... }
```

**Resource-level check inside a service (after loading the entity):**
```ts
import { subject } from '@casl/ability';

async update(id: string, dto: UpdateOutreachDto, ability: AppAbility) {
  const outreach = await this.repository.findOne({ id });
  if (!ability.can(Action.Update, subject('Outreach', outreach))) {
    throw new ForbiddenException();
  }
  // ... proceed
}
```
The controller passes the ability via `@CurrentAbility() ability: AppAbility`.

**Open endpoints (no auth required):**
```ts
@Public()
@Post('login')
login(@Body() dto: LoginDto) { ... }
```

### Adding a new subject or rule

1. Add the subject name string to `AppSubject` in [src/auth/casl/ability.types.ts](src/auth/casl/ability.types.ts).
2. Add `can()`/`cannot()` calls to `CaslAbilityFactory.createForUser()` in [src/auth/casl/casl-ability.factory.ts](src/auth/casl/casl-ability.factory.ts) under the appropriate role block.
3. Add `@CheckPolicies(...)` to the relevant controller handler.
4. For resource-level enforcement, inject `@CurrentAbility()` in the controller and pass the ability to the service.

### Important notes
- `CaslAbilityFactory` does **one DB query per authenticated request** to load the user's current outreach memberships. This ensures access reflects live data, not a stale JWT snapshot.
- CASL conditions (`{ id: { $in: outreachIds } }`) apply when checking *instances* via `ability.can(action, subject('X', instance))`. They do **not** automatically filter DB queries — implement `findAll` filters separately in the mapper.
- `RoleName` enum in `casl-ability.factory.ts` mirrors the seeded role names. Update it if roles are renamed in the DB.

## 6. Conventions & Gotchas

- **Never re-implement CRUD.** Extend `MikroOrmEntityService` and rely on its methods; it already handles pagination, foreign-key / unique-constraint errors (mapped to `BadRequestException`), and population.
- Pagination flows through `findAll(query)` — always. Don't write custom list endpoints.
- Query-string booleans need `QueryBooleanTransform`; query-string arrays that may arrive as single values need `QueryArrayTransform`.
- The global `ValidationPipe` has `whitelist: true`, so any DTO property not decorated is silently stripped — declare every field explicitly.
- Keep entity fields, DTO fields, and mapper filters aligned. Adding a new column means: entity property → create/update DTO → query filter (if filterable) → mapper `filtersFromQueryDto`.
- Use `src/...`-style absolute imports (as in `import { ... } from 'src/common/mikro-orm.entity-service'`) to match the existing style.
- `PartialType` for `Update*Dto` comes from `@nestjs/swagger` in this codebase, not `@nestjs/mapped-types`.
- MikroORM-related imports: use `@mikro-orm/postgresql` for `EntityManager` and `EntityRepository` in services; `@mikro-orm/core` for `Entity`, `Property`, `FilterQuery`, etc.

## 6. Commands

| Task | Command |
| --- | --- |
| Dev server (watch) | `yarn start:dev` |
| Build | `yarn build` |
| Production start | `yarn start:prod` |
| Unit tests | `yarn test` |
| Watch tests | `yarn test:watch` |
| Coverage | `yarn test:cov` |
| E2E tests | `yarn test:e2e` |
| Lint (with fix) | `yarn lint` |
| Format | `yarn format` |
| New migration | `yarn mikro:create` |
| Apply migrations | `yarn mikro:up` |
| Rollback last migration | `yarn mikro:down` |

Swagger UI is available at `http://localhost:4000/docs` once the server is running. The port defaults to `4000` in [src/main.ts](src/main.ts) and can be overridden with the `PORT` env var.

## 7. Email Module

All transactional emails are handled by [src/email/email.service.ts](src/email/email.service.ts) and [src/email/email.module.ts](src/email/email.module.ts). HTML templates live in [src/email-templates/](src/email-templates/) as `.hbs` files rendered with Handlebars.

### Adding a new email type

1. Add an entry to the `EmailTemplate` enum in [src/email/email.service.ts](src/email/email.service.ts):
   ```ts
   export enum EmailTemplate {
     USER_INVITATION = 'user-invitation',
     YOUR_TEMPLATE   = 'your-template',   // ← new entry
   }
   ```

2. Create `src/email-templates/your-template.hbs`. Use `{{variableName}}` for interpolation. The file name must match the enum value exactly. The reference template is [src/email-templates/user-invitation.hbs](src/email-templates/user-invitation.hbs) — follow its inline-CSS style.

3. Call the service from wherever the email is triggered:
   ```ts
   // One-off: compile + send inline
   const html = await this.emailService.compileEmail(EmailTemplate.YOUR_TEMPLATE, { foo, bar });
   await this.emailService.sendEmail(recipientEmail, 'Subject line', html);

   // Reusable: add a typed helper on EmailService (like sendInvitation)
   async sendYourEmail(to: string, data: YourData): Promise<void> {
     const html = await this.compileEmail(EmailTemplate.YOUR_TEMPLATE, { ...data });
     await this.sendEmail(to, 'Subject', html);
   }
   ```

4. Any module that triggers emails must import `EmailModule` in its `imports` array — see [src/users/users.module.ts](src/users/users.module.ts) for the pattern.

### Key notes
- Templates are read from disk at call time via `fs.readFileSync` — no restart needed during development.
- Handlebars is compiled with `{ strict: true }`, so missing variables throw at runtime rather than silently rendering empty.
- If `MAILTRAP_TOKEN` is not set in `.env`, emails are logged to console instead of sent (safe for local dev).
- Two global helpers are registered: `json` (stringifies a value) and `stripHtml` (strips HTML tags for plain-text fallback).
- The env vars `MAILTRAP_TOKEN`, `MAIL_FROM`, `MAIL_FROM_NAME`, and `APP_URL` are read from [src/config/config.ts](src/config/config.ts).

## 8. Checklist for a New Module

Before declaring a new module done, confirm all of the following:

- [ ] `src/<feature>/entities/<feature>.entity.ts` with `tableName`, UUID `id`, `createdAt`/`updatedAt`, and the three projection exports.
- [ ] `dto/create-<feature>.dto.ts`, `dto/update-<feature>.dto.ts` (PartialType), `dto/query-<feature>.dto.ts` (extends `PaginationQueryDto`).
- [ ] `<feature>.mapper.ts` implementing `EntityMapper` with all four methods.
- [ ] `<feature>.service.ts` extending `MikroOrmEntityService`.
- [ ] `<feature>.controller.ts` with the five standard endpoints and no business logic.
- [ ] `<feature>.module.ts` wiring `MikroOrmModule.forFeature([Entity])` + service + mapper.
- [ ] Module imported in [src/app.module.ts](src/app.module.ts).
- [ ] `<feature>.controller.spec.ts` and `<feature>.service.spec.ts` stubs present.
- [ ] Migration generated (and reviewed) via `yarn mikro:create`.
- [ ] (Optional) seeder under `src/seeders/` if the data is required on every boot.
- [ ] `yarn lint` and `yarn test` pass.
