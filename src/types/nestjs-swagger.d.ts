/**
 * Ambient module declaration for @nestjs/swagger v11.2.6
 *
 * The published package is missing its dist/index.d.ts entry point.
 * This file provides explicit type declarations for every symbol used
 * in this codebase so that noImplicitAny compilation can succeed.
 *
 * Generated from the individual .d.ts files that DO exist in the package
 * (node_modules/@nestjs/swagger/dist/decorators/*.d.ts etc.) plus manual
 * stubs for SwaggerModule and the type-helper functions.
 */

declare module '@nestjs/swagger' {
  // ─── Decorators ─────────────────────────────────────────────────────────────

  export function ApiTags(...tags: string[]): ClassDecorator;

  export function ApiOperation(options: {
    summary?: string;
    description?: string;
    deprecated?: boolean;
    operationId?: string;
    tags?: string[];
    externalDocs?: { url: string; description?: string };
  }): MethodDecorator;

  export function ApiResponse(options: {
    status?: number | 'default' | '1XX' | '2XX' | '3XX' | '4XX' | '5XX';
    description?: string;
    type?: unknown;
    isArray?: boolean;
    headers?: Record<string, unknown>;
    schema?: Record<string, unknown>;
    links?: Record<string, unknown>;
    example?: unknown;
    examples?: Record<string, unknown>;
    content?: Record<string, unknown>;
  }): MethodDecorator & ClassDecorator;

  export const ApiOkResponse: (options?: {
    description?: string;
    type?: unknown;
    isArray?: boolean;
    schema?: Record<string, unknown>;
  }) => MethodDecorator;

  export const ApiCreatedResponse: (options?: {
    description?: string;
    type?: unknown;
    isArray?: boolean;
  }) => MethodDecorator;

  export const ApiBadRequestResponse: (options?: {
    description?: string;
  }) => MethodDecorator;

  export const ApiUnauthorizedResponse: (options?: {
    description?: string;
  }) => MethodDecorator;

  export const ApiForbiddenResponse: (options?: {
    description?: string;
  }) => MethodDecorator;

  export const ApiNotFoundResponse: (options?: {
    description?: string;
  }) => MethodDecorator;

  export const ApiConflictResponse: (options?: {
    description?: string;
  }) => MethodDecorator;

  export const ApiInternalServerErrorResponse: (options?: {
    description?: string;
  }) => MethodDecorator;

  export function ApiQuery(options: {
    name: string;
    type?: unknown;
    required?: boolean;
    description?: string;
    enum?: unknown;
    isArray?: boolean;
    example?: unknown;
    schema?: Record<string, unknown>;
  }): MethodDecorator;

  export function ApiParam(options: {
    name: string;
    type?: unknown;
    required?: boolean;
    description?: string;
    enum?: unknown;
    example?: unknown;
    schema?: Record<string, unknown>;
  }): MethodDecorator;

  export function ApiBody(options: {
    type?: unknown;
    description?: string;
    required?: boolean;
    schema?: Record<string, unknown>;
    examples?: Record<string, unknown>;
    isArray?: boolean;
  }): MethodDecorator;

  export function ApiProperty(options?: {
    description?: string;
    type?: unknown;
    example?: unknown;
    required?: boolean;
    enum?: unknown;
    isArray?: boolean;
    default?: unknown;
    nullable?: boolean;
    readOnly?: boolean;
    writeOnly?: boolean;
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    format?: string;
    pattern?: string;
    name?: string;
    deprecated?: boolean;
    items?: Record<string, unknown>;
    properties?: Record<string, unknown>;
    additionalProperties?: boolean | Record<string, unknown>;
    allOf?: Record<string, unknown>[];
    oneOf?: Record<string, unknown>[];
    anyOf?: Record<string, unknown>[];
    discriminator?: Record<string, unknown>;
    $ref?: string;
  }): PropertyDecorator;

  export function ApiPropertyOptional(options?: {
    description?: string;
    type?: unknown;
    example?: unknown;
    enum?: unknown;
    isArray?: boolean;
    default?: unknown;
    nullable?: boolean;
    readOnly?: boolean;
    writeOnly?: boolean;
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    format?: string;
    pattern?: string;
    name?: string;
    deprecated?: boolean;
  }): PropertyDecorator;

  export function ApiHeader(options: {
    name: string;
    description?: string;
    required?: boolean;
    deprecated?: boolean;
    allowEmptyValue?: boolean;
    schema?: Record<string, unknown>;
  }): MethodDecorator & ClassDecorator;

  export function ApiHeaders(
    headers: Array<{
      name: string;
      description?: string;
      required?: boolean;
      schema?: Record<string, unknown>;
    }>,
  ): MethodDecorator & ClassDecorator;

  export function ApiConsumes(...mimeTypes: string[]): MethodDecorator & ClassDecorator;

  export function ApiProduces(...mimeTypes: string[]): MethodDecorator & ClassDecorator;

  export function ApiBearerAuth(name?: string): ClassDecorator & MethodDecorator;

  export function ApiBasicAuth(name?: string): ClassDecorator & MethodDecorator;

  export function ApiSecurity(
    name: string,
    requirements?: string[],
  ): ClassDecorator & MethodDecorator;

  export function ApiCookieAuth(
    cookieName?: string,
    options?: Record<string, unknown>,
    securityName?: string,
  ): ClassDecorator & MethodDecorator;

  export function ApiOAuth2(
    scopes: string[],
    name?: string,
  ): ClassDecorator & MethodDecorator;

  export function ApiExcludeEndpoint(disable?: boolean): MethodDecorator;

  export function ApiExcludeController(disable?: boolean): ClassDecorator;

  export function ApiHideProperty(): PropertyDecorator;

  export function ApiExtension(
    extensionKey: string,
    extensionProperties: unknown,
  ): MethodDecorator & ClassDecorator;

  export function ApiExtraModels(...models: unknown[]): ClassDecorator;

  export function ApiSchema(options?: Record<string, unknown>): ClassDecorator;

  export function getSchemaPath(modelOrPath: unknown): string;

  // ─── DocumentBuilder ─────────────────────────────────────────────────────────

  export class DocumentBuilder {
    setTitle(title: string): this;
    setDescription(description: string): this;
    setVersion(version: string): this;
    setTermsOfService(termsOfService: string): this;
    setContact(name: string, url: string, email: string): this;
    setLicense(name: string, url: string): this;
    setExternalDoc(description: string, url: string): this;
    addTag(name: string, description?: string, externalDocs?: unknown): this;
    addExtension(extensionKey: string, extensionProperties: unknown): this;
    addSecurity(name: string, options: unknown): this;
    addSecurityRequirements(name: string | unknown, requirements?: string[]): this;
    addBearerAuth(options?: unknown, name?: string): this;
    addOAuth2(options?: unknown, name?: string): this;
    addApiKey(options?: unknown, name?: string): this;
    addBasicAuth(options?: unknown, name?: string): this;
    addCookieAuth(cookieName?: string, options?: unknown, securityName?: string): this;
    addGlobalParameters(...parameters: unknown[]): this;
    addGlobalResponses(...responses: unknown[]): this;
    build(): Record<string, unknown>;
  }

  // ─── SwaggerModule ───────────────────────────────────────────────────────────

  export class SwaggerModule {
    static createDocument(
      app: unknown,
      config: Record<string, unknown>,
      options?: Record<string, unknown>,
    ): Record<string, unknown>;
    static setup(
      path: string,
      app: unknown,
      document: Record<string, unknown>,
      options?: Record<string, unknown>,
    ): void;
    static loadPluginMetadata(
      metadataFn: () => Promise<Record<string, unknown>>,
    ): Promise<void>;
  }

  // ─── Type helpers ────────────────────────────────────────────────────────────

  export declare function PartialType<T>(
    classRef: new (...args: unknown[]) => T,
  ): new (...args: unknown[]) => Partial<T>;

  export declare function OmitType<T, K extends keyof T>(
    classRef: new (...args: unknown[]) => T,
    keys: readonly K[],
  ): new (...args: unknown[]) => Omit<T, K>;

  export declare function PickType<T, K extends keyof T>(
    classRef: new (...args: unknown[]) => T,
    keys: readonly K[],
  ): new (...args: unknown[]) => Pick<T, K>;

  export declare function IntersectionType<A, B>(
    classARef: new (...args: unknown[]) => A,
    classBRef: new (...args: unknown[]) => B,
  ): new (...args: unknown[]) => A & B;

  // ─── Constants ───────────────────────────────────────────────────────────────

  export const DECORATORS_PREFIX: string;
  export const ApiResponseSchemaHost: unknown;
}
