import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
const supertest = require('supertest');
import { AppModule } from './../src/app.module';
import { TenantContextService } from '../src/shared/domain/tenant-context.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(TenantContextService)
    .useValue({
      setTenantContext: jest.fn(),
      getTenantContext: jest.fn().mockReturnValue({ tenantId: 'test-tenant-123' }),
      clearTenantContext: jest.fn(),
    })
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('/health (GET)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const response = await supertest(app.getHttpServer())
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .get('/health')
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .set('X-Tenant-Id', 'test-tenant-123');
    
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.status).toBe(200);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body).toHaveProperty('status');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body).toHaveProperty('timestamp');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body).toHaveProperty('environment');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body).toHaveProperty('version');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body).toHaveProperty('uptime');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body).toHaveProperty('database');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.database).toHaveProperty('status');
  });
});
