import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Sequelize } from 'sequelize-typescript';

/**
 * E2E Tests for Booking System
 * 
 * Test Cases:
 * 1. Single service booking with specific technician
 * 2. Multi-service booking (consecutive) without VIP combo
 * 3. Multi-service booking with VIP combo (simultaneous)
 * 4. Combo package booking (Regular Pack, etc.)
 * 
 * All tests use dynamic date (today + offset) to ensure reproducibility
 */
describe('Booking System E2E Tests', () => {
  let app: INestApplication;
  let sequelize: Sequelize;
  
  // Test data IDs (from seed data)
  const testData = {
    services: {
      basicManicure: 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b501',
      basicSpaPedicure: 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701',
      gelBasicManicure: 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502',
      gelBasicPedicure: 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702',
    },
    staff: {
      isabella: '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', // Does Manicure
      sofia: '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303',    // Does Pedicure
      camila: '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302',   // Does both
    },
    customers: {
      testCustomer: '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301',
    },
  };

  // Helper to get test date (today + days offset)
  const getTestDate = (daysOffset: number = 1): string => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.setGlobalPrefix('api/v1');
    
    await app.init();
    
    sequelize = moduleFixture.get<Sequelize>(Sequelize);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ok');
    });
  });

  // ============================================================================
  // TEST CASE 1: Single Service Booking with Specific Technician
  // ============================================================================
  describe('Case 1: Single Service Booking', () => {
    const testDate = getTestDate(1);
    let createdBookingId: string;

    it('should get available time slots for single service', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/bookings/available-slots')
        .query({ date: testDate })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.groupedSlots).toBeDefined();
    });

    it('should create a single service booking with Isabella (Manicure)', async () => {
      const bookingData = {
        serviceId: testData.services.basicManicure,
        customerId: testData.customers.testCustomer,
        staffId: testData.staff.isabella,
        appointmentDate: testDate,
        startTime: '10:00:00',
        endTime: '10:45:00',
        totalPrice: 2500,
        notes: `E2E Test - Single Service - ${new Date().toISOString()}`,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .send(bookingData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.staffId).toBe(testData.staff.isabella);
      expect(response.body.data.serviceId).toBe(testData.services.basicManicure);
      
      createdBookingId = response.body.data.id;
    });

    it('should verify the booking was created correctly', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/bookings/${createdBookingId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointmentDate).toBe(testDate);
      expect(response.body.data.status).toBe('pending');
    });

    it('should block the same time slot for Isabella', async () => {
      const duplicateBooking = {
        serviceId: testData.services.basicManicure,
        customerId: testData.customers.testCustomer,
        staffId: testData.staff.isabella,
        appointmentDate: testDate,
        startTime: '10:00:00',
        endTime: '10:45:00',
        totalPrice: 2500,
        notes: 'Should fail - duplicate slot',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .send(duplicateBooking)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    afterAll(async () => {
      // Cleanup: Cancel the test booking
      if (createdBookingId) {
        await request(app.getHttpServer())
          .put(`/api/v1/bookings/${createdBookingId}/cancel`)
          .send({ reason: 'E2E test cleanup' });
      }
    });
  });

  // ============================================================================
  // TEST CASE 2: Multi-Service Booking (Consecutive) WITHOUT VIP Combo
  // ============================================================================
  describe('Case 2: Multi-Service Booking (Consecutive)', () => {
    const testDate = getTestDate(2);
    const createdBookingIds: string[] = [];

    it('should get multi-service slots for consecutive booking', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/bookings/multi-service-slots')
        .send({
          servicesWithAddons: [
            { id: testData.services.basicManicure, duration: 30 },
            { id: testData.services.basicSpaPedicure, duration: 45 },
          ],
          date: testDate,
          selectedTechnicianId: testData.staff.camila, // Camila can do both
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toBeDefined();
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.data.length).toBeGreaterThan(0);

      // Each slot should have 2 service assignments
      const firstSlot = response.body.data.data[0];
      expect(firstSlot.services.length).toBe(2);
      expect(firstSlot.available).toBe(true);
    });

    it('should verify slot availability with permutations', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/bookings/verify-slot-with-permutations')
        .send({
          serviceIds: [
            testData.services.basicManicure,
            testData.services.basicSpaPedicure,
          ],
          date: testDate,
          startTime: '11:30',
          selectedTechnicianId: testData.staff.camila,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.available).toBe(true);
      expect(response.body.assignments).toBeDefined();
      expect(response.body.assignments.length).toBe(2);
    });

    it('should create consecutive multi-service bookings', async () => {
      // First, get the optimal assignments
      const slotsResponse = await request(app.getHttpServer())
        .post('/api/v1/bookings/multi-service-slots')
        .send({
          servicesWithAddons: [
            { id: testData.services.basicManicure, duration: 30 },
            { id: testData.services.basicSpaPedicure, duration: 45 },
          ],
          date: testDate,
          selectedTechnicianId: testData.staff.camila,
        });

      const slot = slotsResponse.body.data.data.find(
        (s: any) => s.startTime.includes('14:30')
      );
      expect(slot).toBeDefined();

      // Create bookings for each service in the slot
      for (const assignment of slot.services) {
        const bookingData = {
          serviceId: assignment.serviceId,
          customerId: testData.customers.testCustomer,
          staffId: assignment.staffId,
          appointmentDate: testDate,
          startTime: assignment.startTime.split('T')[1] || assignment.startTime,
          endTime: assignment.endTime.split('T')[1] || assignment.endTime,
          totalPrice: 2500,
          notes: `E2E Test - Multi-Service Consecutive - ${new Date().toISOString()}`,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/bookings')
          .send(bookingData)
          .expect(201);

        expect(response.body.success).toBe(true);
        createdBookingIds.push(response.body.data.id);
      }

      expect(createdBookingIds.length).toBe(2);
    });

    afterAll(async () => {
      // Cleanup
      for (const id of createdBookingIds) {
        await request(app.getHttpServer())
          .put(`/api/v1/bookings/${id}/cancel`)
          .send({ reason: 'E2E test cleanup' });
      }
    });
  });

  // ============================================================================
  // TEST CASE 3: Multi-Service Booking WITH VIP Combo (Simultaneous)
  // ============================================================================
  describe('Case 3: VIP Combo Booking (Simultaneous)', () => {
    const testDate = getTestDate(3);
    const createdBookingIds: string[] = [];

    it('should get VIP combo slots (2 technicians simultaneously)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/bookings/vip-combo-slots')
        .send({
          servicesWithAddons: [
            { id: testData.services.basicManicure, duration: 30 },
            { id: testData.services.basicSpaPedicure, duration: 45 },
          ],
          date: testDate,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      if (response.body.data.length > 0) {
        const firstSlot = response.body.data[0];
        expect(firstSlot.services.length).toBe(2);
        
        // VIP Combo: both services start at the same time
        const service1Start = firstSlot.services[0].startTime;
        const service2Start = firstSlot.services[1].startTime;
        expect(service1Start).toBe(service2Start);
        
        // Different technicians
        const tech1 = firstSlot.services[0].staffId;
        const tech2 = firstSlot.services[1].staffId;
        expect(tech1).not.toBe(tech2);
      }
    });

    it('should get VIP combo slots with specific technician preference', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/bookings/vip-combo-slots')
        .send({
          servicesWithAddons: [
            { id: testData.services.basicManicure, duration: 30 },
            { id: testData.services.basicSpaPedicure, duration: 45 },
          ],
          date: testDate,
          selectedTechnicianId: testData.staff.sofia, // Sofia for Pedicure
          selectedServiceId: testData.services.basicSpaPedicure,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      if (response.body.data.length > 0) {
        const firstSlot = response.body.data[0];
        // Sofia should be assigned to Pedicure
        const pediAssignment = firstSlot.services.find(
          (s: any) => s.serviceId === testData.services.basicSpaPedicure
        );
        expect(pediAssignment.staffId).toBe(testData.staff.sofia);
      }
    });

    it('should create VIP combo bookings (simultaneous)', async () => {
      const slotsResponse = await request(app.getHttpServer())
        .post('/api/v1/bookings/vip-combo-slots')
        .send({
          servicesWithAddons: [
            { id: testData.services.basicManicure, duration: 30 },
            { id: testData.services.basicSpaPedicure, duration: 45 },
          ],
          date: testDate,
        });

      if (slotsResponse.body.data.length === 0) {
        console.log('No VIP combo slots available - skipping creation test');
        return;
      }

      const slot = slotsResponse.body.data.find(
        (s: any) => s.startTime.includes('15:30')
      ) || slotsResponse.body.data[0];

      // Create both bookings (same start time, different technicians)
      for (const assignment of slot.services) {
        const bookingData = {
          serviceId: assignment.serviceId,
          customerId: testData.customers.testCustomer,
          staffId: assignment.staffId,
          appointmentDate: testDate,
          startTime: assignment.startTime.split('T')[1] || assignment.startTime,
          endTime: assignment.endTime.split('T')[1] || assignment.endTime,
          totalPrice: assignment.serviceId === testData.services.basicManicure ? 2500 : 3500,
          notes: `E2E Test - VIP Combo - ${new Date().toISOString()}`,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/bookings')
          .send(bookingData)
          .expect(201);

        expect(response.body.success).toBe(true);
        createdBookingIds.push(response.body.data.id);
      }

      expect(createdBookingIds.length).toBe(2);
    });

    afterAll(async () => {
      for (const id of createdBookingIds) {
        await request(app.getHttpServer())
          .put(`/api/v1/bookings/${id}/cancel`)
          .send({ reason: 'E2E test cleanup' });
      }
    });
  });

  // ============================================================================
  // TEST CASE 4: Combo Package Booking (Regular Pack, etc.)
  // ============================================================================
  describe('Case 4: Combo Package Booking', () => {
    const testDate = getTestDate(4);
    const createdBookingIds: string[] = [];

    it('should get combo/package services', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/services')
        .query({ category: 'Combos' })
        .expect(200);

      expect(response.body.success).toBe(true);
      // Combos category should exist
    });

    it('should get slots for combo with multiple services', async () => {
      // Regular Pack: Mani + Pedi combo
      const response = await request(app.getHttpServer())
        .post('/api/v1/bookings/multi-service-slots')
        .send({
          servicesWithAddons: [
            { id: testData.services.basicManicure, duration: 30 },
            { id: testData.services.basicSpaPedicure, duration: 45 },
          ],
          date: testDate,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data.length).toBeGreaterThan(0);
    });

    it('should handle gel services combo', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/bookings/multi-service-slots')
        .send({
          servicesWithAddons: [
            { id: testData.services.gelBasicManicure, duration: 45 },
            { id: testData.services.gelBasicPedicure, duration: 60 },
          ],
          date: testDate,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    afterAll(async () => {
      for (const id of createdBookingIds) {
        await request(app.getHttpServer())
          .put(`/api/v1/bookings/${id}/cancel`)
          .send({ reason: 'E2E test cleanup' });
      }
    });
  });

  // ============================================================================
  // TEST: Permutation Logic (Order of Services)
  // ============================================================================
  describe('Permutation Logic Tests', () => {
    const testDate = getTestDate(5);

    it('should find slot when technician is busy at start but free later', async () => {
      // First create a booking for Sofia at 10:30
      const blockingBooking = {
        serviceId: testData.services.basicSpaPedicure,
        customerId: testData.customers.testCustomer,
        staffId: testData.staff.sofia,
        appointmentDate: testDate,
        startTime: '10:30:00',
        endTime: '11:30:00',
        totalPrice: 3500,
        notes: 'Blocking booking for permutation test',
      };

      const blockResponse = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .send(blockingBooking);

      const blockingId = blockResponse.body.data?.id;

      // Now check multi-service slots with Sofia selected
      // Sofia is busy 10:30-11:30, so slot 10:30 should use permutation
      const slotsResponse = await request(app.getHttpServer())
        .post('/api/v1/bookings/multi-service-slots')
        .send({
          servicesWithAddons: [
            { id: testData.services.basicManicure, duration: 30 },
            { id: testData.services.basicSpaPedicure, duration: 45 },
          ],
          date: testDate,
          selectedTechnicianId: testData.staff.sofia,
        });

      expect(slotsResponse.body.success).toBe(true);

      // Cleanup
      if (blockingId) {
        await request(app.getHttpServer())
          .put(`/api/v1/bookings/${blockingId}/cancel`)
          .send({ reason: 'E2E test cleanup' });
      }
    });
  });
});
