import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
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
     
    const response = await supertest(app.getHttpServer())
       
      .get('/health')
       
      .set('X-Tenant-Id', 'test-tenant-123');
    
     
    expect(response.status).toBe(200);
     
    expect(response.body).toHaveProperty('status');
     
    expect(response.body).toHaveProperty('timestamp');
     
    expect(response.body).toHaveProperty('environment');
     
    expect(response.body).toHaveProperty('version');
     
    expect(response.body).toHaveProperty('uptime');
     
    expect(response.body).toHaveProperty('database');
     
    expect(response.body.database).toHaveProperty('status');
  });
});
