# CLAUDE.md

Guidance for Claude when working inside `vine-and-branch-backend`. Read this before making changes — especially before adding a new module.

## 1. Project Overview

- **Name:** `vine-and-branch-backend` — the backend service for Vine & Branch, a coffeeshop e-commerce platform operating in Rwanda.
- **Purpose:** REST API powering an online store: product catalogue, cart, checkout, orders, payments (Paypack), reviews, and user/staff management.
- **Stack:** NestJS 11, MikroORM 6 with PostgreSQL, `class-validator` + `class-transformer`, `@nestjs/swagger`, Jest.
- **Package manager:** `yarn` (see [package.json](package.json)).
- **Deployment:** Railway (Node service + managed Postgres + managed Redis).
- **Storage:** Cloudflare R2 (S3-compatible) for product images and other user-uploaded assets — accessed via `@aws-sdk/client-s3` with presigned URLs.
- **Payments:** Paypack (Rwandan mobile money + card payments) via REST API + webhook.

## 2. Directory Layout

```
src/
├── main.ts                              # Bootstrap: global ValidationPipe, Swagger, helmet, seeders
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
├── auth/
│   ├── auth.module.ts                   # Wires JwtAuthGuard + RolesGuard globally
│   ├── auth.controller.ts               # /auth/register, /auth/login, /auth/refresh
│   ├── auth.service.ts
│   ├── strategies/jwt.strategy.ts
│   ├── guards/jwt-auth.guard.ts
│   ├── guards/roles.guard.ts            # RBAC enforcement based on @Roles() metadata
│   ├── decorators/roles.decorator.ts    # @Roles(RoleName.MANAGER, RoleName.OWNER)
│   ├── decorators/public.decorator.ts   # @Public() — bypasses both guards
│   └── decorators/current-user.decorator.ts
├── storage/
│   ├── storage.module.ts                # Global module; exports StorageService
│   └── storage.service.ts               # R2 client; presigned URL helpers
├── email/
│   ├── email.module.ts
│   └── email.service.ts                 # Handlebars templates + Mailtrap/SMTP
├── migrations/                          # MikroORM migrations
├── seeders/                             # MikroORM seeders (e.g. RoleSeeder)
└── roles/                               # Reference feature module — copy its shape
```

Key files to understand before editing:

- [src/main.ts](src/main.ts) — global `ValidationPipe` is enabled with `whitelist: true`, `transform: true`, and `enableImplicitConversion: true`. Helmet + global rate limiter installed. Swagger served at `/docs` (JSON at `/docs-json`). `RoleSeeder` is run automatically at boot.
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

Naming: directory and filenames use the plural, kebab-cased feature name (`roles`, `products`, `order-items`). Class names are PascalCase singular for entity (`Role`) and PascalCase plural for service/controller/module (`RolesService`, `RolesController`, `RolesModule`). DB table names are plural snake_case (`roles`, `order_items`).

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

## 5. Authorization — RBAC

Authorization is **role-based** (RBAC). The guard stack runs globally — **do not add `@UseGuards()` to controllers**. Every authenticated request passes through `JwtAuthGuard` → `RolesGuard` in that order (both registered via `APP_GUARD` in [src/auth/auth.module.ts](src/auth/auth.module.ts)).

### Roles

The system has five roles, seeded by `RoleSeeder` on boot:

| Role       | Description                                                                 |
| ---------- | --------------------------------------------------------------------------- |
| `CUSTOMER` | End user who shops. Default role assigned on self-registration.             |
| `STAFF`    | Front-of-house. Can view orders, update order fulfillment status.           |
| `MANAGER`  | Store manager. Can manage products, inventory, coupons, approve reviews.    |
| `OWNER`    | Business owner. All MANAGER permissions plus financial reports and refunds. |
| `ADMIN`    | Technical admin. All permissions including user/role management.            |

The `RoleName` enum in [src/auth/roles.enum.ts](src/auth/roles.enum.ts) mirrors these names. Update it if roles are renamed in the DB.

### Key files

| File                                                                                           | Purpose                                                          |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| [src/auth/roles.enum.ts](src/auth/roles.enum.ts)                                               | `RoleName` enum — the source of truth for role string values     |
| [src/auth/guards/jwt-auth.guard.ts](src/auth/guards/jwt-auth.guard.ts)                         | Validates JWT and attaches user to request; respects `@Public()` |
| [src/auth/guards/roles.guard.ts](src/auth/guards/roles.guard.ts)                               | Reads `@Roles()` metadata; allows if user has any listed role    |
| [src/auth/decorators/roles.decorator.ts](src/auth/decorators/roles.decorator.ts)               | `@Roles(RoleName.MANAGER, RoleName.OWNER)` decorator             |
| [src/auth/decorators/public.decorator.ts](src/auth/decorators/public.decorator.ts)             | `@Public()` — bypasses both guards                               |
| [src/auth/decorators/current-user.decorator.ts](src/auth/decorators/current-user.decorator.ts) | `@CurrentUser()` — extracts the JWT payload from the request     |

### Usage patterns

**Role check on a handler (most common):**

```ts
@Post()
@Roles(RoleName.MANAGER, RoleName.OWNER, RoleName.ADMIN)
create(@Body() dto: CreateProductDto) {
  return this.productsService.create(dto);
}
```

A handler with **no** `@Roles()` decorator is accessible to **any authenticated user** (still requires a valid JWT).

**Open endpoints (no auth required):**

```ts
@Public()
@Post('register')
register(@Body() dto: RegisterDto) { ... }

@Public()
@Get()
findAll(@Query() query: QueryProductDto) { ... }  // Public product listing
```

**Ownership checks (resource-level):**

RBAC alone doesn't know "this cart belongs to user X". For customer-owned resources (carts, orders, addresses, reviews), the service must enforce ownership manually:

```ts
async findOne(id: string, user: AuthUser) {
  const order = await this.repository.findOne({ id });
  if (!order) throw new NotFoundException();

  const isStaff = [RoleName.STAFF, RoleName.MANAGER, RoleName.OWNER, RoleName.ADMIN]
    .some(r => user.roles.includes(r));
  if (!isStaff && order.user?.id !== user.id) {
    throw new ForbiddenException();
  }
  return order;
}
```

The controller passes the user via `@CurrentUser() user: AuthUser`.

### Adding a new protected endpoint

1. Decide which roles can access it.
2. Add `@Roles(...)` to the handler — or `@Public()` if it's anonymous.
3. If the resource is user-owned, add an ownership check inside the service.
4. Update the Swagger description so the API consumer knows the access level.

### Important notes

- The JWT payload contains `sub` (user id), `email`, and `roles` (array of role names). It does **not** carry permissions — the guard just checks roles.
- A user's role list is loaded into the JWT at login. **Roles changes do not take effect until the user re-logs in or refreshes their token.** If you need instant revocation, implement a token-version field on the user and check it in `JwtAuthGuard`.
- Customer self-registration assigns the `CUSTOMER` role only. All other role assignments are done by an `ADMIN` via `/users/:id/roles`.

## 6. Storage — Cloudflare R2

All user-uploaded files (product images, etc.) live in Cloudflare R2 via [src/storage/storage.service.ts](src/storage/storage.service.ts).

### How it works

- **Direct-to-R2 uploads.** The backend never receives raw file bytes. It generates a **presigned PUT URL**, the frontend uploads directly to R2, then notifies the backend of the final object key.
- The S3 client is configured against R2's S3-compatible endpoint (`https://<account-id>.r2.cloudflarestorage.com`).
- Public read access is served via a custom Cloudflare domain (e.g. `cdn.vineandbranch.rw`) bound to the bucket — never expose the R2 endpoint directly.

### Usage pattern

```ts
// 1. Frontend asks backend for a presigned URL
@Post('product-images/upload-url')
@Roles(RoleName.MANAGER, RoleName.OWNER, RoleName.ADMIN)
getUploadUrl(@Body() dto: UploadUrlDto) {
  return this.storageService.getPresignedUploadUrl({
    keyPrefix: 'products',
    contentType: dto.contentType,
    maxSizeBytes: 5 * 1024 * 1024,
  });
  // Returns { uploadUrl, objectKey, publicUrl, expiresIn }
}

// 2. Frontend PUTs the file directly to uploadUrl
// 3. Frontend sends objectKey + publicUrl back to backend to attach to the product
```

### Key notes

- Object keys are namespaced by domain: `products/<uuid>.jpg`, `users/<uuid>/avatar.jpg`, etc.
- Presigned URLs expire in 5 minutes by default — enough for an upload, short enough to limit abuse.
- Always validate `contentType` against an allowlist (`image/jpeg`, `image/png`, `image/webp`) before signing.
- The env vars `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL` are read from [src/config/config.ts](src/config/config.ts).
- The `StorageService` is exposed by a **global** `StorageModule` — no need to import it in feature modules.

## 7. Email Module

All transactional emails are handled by [src/email/email.service.ts](src/email/email.service.ts) and [src/email/email.module.ts](src/email/email.module.ts). HTML templates live in [src/email-templates/](src/email-templates/) as `.hbs` files rendered with Handlebars.

### Adding a new email type

1. Add an entry to the `EmailTemplate` enum in [src/email/email.service.ts](src/email/email.service.ts):

   ```ts
   export enum EmailTemplate {
     USER_INVITATION = 'user-invitation',
     ORDER_CONFIRMATION = 'order-confirmation', // ← new entry
   }
   ```

2. Create `src/email-templates/order-confirmation.hbs`. Use `{{variableName}}` for interpolation. The file name must match the enum value exactly. The reference template is [src/email-templates/user-invitation.hbs](src/email-templates/user-invitation.hbs) — follow its inline-CSS style.

3. Call the service from wherever the email is triggered:

   ```ts
   // One-off: compile + send inline
   const html = await this.emailService.compileEmail(EmailTemplate.ORDER_CONFIRMATION, { foo, bar });
   await this.emailService.sendEmail(recipientEmail, 'Subject line', html);

   // Reusable: add a typed helper on EmailService (like sendInvitation)
   async sendOrderConfirmation(to: string, data: OrderConfirmationData): Promise<void> {
     const html = await this.compileEmail(EmailTemplate.ORDER_CONFIRMATION, { ...data });
     await this.sendEmail(to, `Your Vine & Branch order #${data.orderNumber}`, html);
   }
   ```

4. Any module that triggers emails must import `EmailModule` in its `imports` array — see [src/users/users.module.ts](src/users/users.module.ts) for the pattern.

### Key notes

- Templates are read from disk at call time via `fs.readFileSync` — no restart needed during development.
- Handlebars is compiled with `{ strict: true }`, so missing variables throw at runtime rather than silently rendering empty.
- If `MAILTRAP_TOKEN` is not set in `.env`, emails are logged to console instead of sent (safe for local dev).
- Two global helpers are registered: `json` (stringifies a value) and `stripHtml` (strips HTML tags for plain-text fallback).
- The env vars `MAILTRAP_TOKEN`, `MAIL_FROM`, `MAIL_FROM_NAME`, and `APP_URL` are read from [src/config/config.ts](src/config/config.ts).
- For high-volume emails (order confirmations during a flash sale), enqueue them via BullMQ rather than awaiting in the request path.

## 8. Background Jobs — BullMQ + Redis

Long-running or retryable side effects (sending emails, polling Paypack for stuck payments, abandoned-cart sweeps) run as background jobs through **BullMQ** backed by **Redis**.

### Key patterns

- Each domain that produces jobs exposes a typed `*Queue` provider (e.g. `EmailQueue`, `PaymentsQueue`).
- Job processors live in `src/<feature>/processors/<name>.processor.ts` and use `@Processor()` from `@nestjs/bullmq`.
- Always set `attempts` and `backoff` on enqueued jobs; never enqueue without retries.
- Idempotency: jobs that hit external APIs must be safe to run twice. Use the job ID or a dedicated `processed_at` column on the target row.
- The Redis connection URL is read from `REDIS_URL` in [src/config/config.ts](src/config/config.ts). Railway provides one via its Redis add-on.

## 9. Payments — Paypack

All payments go through Paypack in [src/payments/](src/payments/).

- The `PaypackClientService` is a thin wrapper around Paypack's REST API.
- `POST /webhooks/paypack` is `@Public()`, verifies the HMAC signature, and is **idempotent** via a `payment_webhook_events` table keyed on the provider event ID.
- Payment state transitions and inventory side effects happen inside a single DB transaction triggered by the webhook handler.
- Stuck payments (status `PENDING` for > 30 min) are reconciled by a BullMQ cron job that polls Paypack.

See [src/payments/payments.service.ts](src/payments/payments.service.ts) for the canonical flow.

## 10. Conventions & Gotchas

- **Never re-implement CRUD.** Extend `MikroOrmEntityService` and rely on its methods; it already handles pagination, foreign-key / unique-constraint errors (mapped to `BadRequestException`), and population.
- Pagination flows through `findAll(query)` — always. Don't write custom list endpoints.
- Query-string booleans need `QueryBooleanTransform`; query-string arrays that may arrive as single values need `QueryArrayTransform`.
- The global `ValidationPipe` has `whitelist: true`, so any DTO property not decorated is silently stripped — declare every field explicitly.
- Keep entity fields, DTO fields, and mapper filters aligned. Adding a new column means: entity property → create/update DTO → query filter (if filterable) → mapper `filtersFromQueryDto`.
- Use `src/...`-style absolute imports (as in `import { ... } from 'src/common/mikro-orm.entity-service'`) to match the existing style.
- `PartialType` for `Update*Dto` comes from `@nestjs/swagger` in this codebase, not `@nestjs/mapped-types`.
- MikroORM-related imports: use `@mikro-orm/postgresql` for `EntityManager` and `EntityRepository` in services; `@mikro-orm/core` for `Entity`, `Property`, `FilterQuery`, etc.
- **Money is stored as integers** (RWF has no minor unit, but use `bigint` or `integer` columns and a `currency` column). Never use floats.
- **Order line items snapshot product data at purchase time** — copy `productName`, `unitPrice`, `sku` into the `order_items` row. Don't rely on joining back to `products`.
- **Inventory reservations happen at checkout**, not on "add to cart". Use the `inventory_movements` ledger pattern (append-only rows) so stock changes are auditable.
- Default to enqueueing side effects (emails, webhooks-to-third-parties) on BullMQ rather than awaiting them in the request path.

## 11. Commands

| Task                    | Command             |
| ----------------------- | ------------------- |
| Dev server (watch)      | `yarn start:dev`    |
| Build                   | `yarn build`        |
| Production start        | `yarn start:prod`   |
| Unit tests              | `yarn test`         |
| Watch tests             | `yarn test:watch`   |
| Coverage                | `yarn test:cov`     |
| E2E tests               | `yarn test:e2e`     |
| Lint (with fix)         | `yarn lint`         |
| Format                  | `yarn format`       |
| New migration           | `yarn mikro:create` |
| Apply migrations        | `yarn mikro:up`     |
| Rollback last migration | `yarn mikro:down`   |

Swagger UI is available at `http://localhost:4000/docs` once the server is running. The port defaults to `4000` in [src/main.ts](src/main.ts) and can be overridden with the `PORT` env var.

On Railway, the `PORT` env var is injected automatically; do not hardcode it.

## 12. Checklist for a New Module

Before declaring a new module done, confirm all of the following:

- [ ] `src/<feature>/entities/<feature>.entity.ts` with `tableName`, UUID `id`, `createdAt`/`updatedAt`, and the three projection exports.
- [ ] `dto/create-<feature>.dto.ts`, `dto/update-<feature>.dto.ts` (PartialType), `dto/query-<feature>.dto.ts` (extends `PaginationQueryDto`).
- [ ] `<feature>.mapper.ts` implementing `EntityMapper` with all four methods.
- [ ] `<feature>.service.ts` extending `MikroOrmEntityService`.
- [ ] `<feature>.controller.ts` with the five standard endpoints and no business logic.
- [ ] `<feature>.module.ts` wiring `MikroOrmModule.forFeature([Entity])` + service + mapper.
- [ ] Module imported in [src/app.module.ts](src/app.module.ts).
- [ ] `@Roles()` or `@Public()` applied to each handler (no decorator = any authenticated user).
- [ ] Ownership check inside the service for any user-owned resource.
- [ ] `<feature>.controller.spec.ts` and `<feature>.service.spec.ts` stubs present.
- [ ] Migration generated (and reviewed) via `yarn mikro:create`.
- [ ] (Optional) seeder under `src/seeders/` if the data is required on every boot.
- [ ] `yarn lint` and `yarn test` pass.
