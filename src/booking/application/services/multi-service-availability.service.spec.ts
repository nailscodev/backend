import { BadRequestException } from '@nestjs/common';
import { MultiServiceAvailabilityService } from './multi-service-availability.service';

/**
 * Unit tests for MultiServiceAvailabilityService
 *
 * All DB dependencies are mocked. Tests focus on the pure-logic paths
 * that can be exercised without a real database connection.
 */
describe('MultiServiceAvailabilityService', () => {
  let service: MultiServiceAvailabilityService;
  let mockCache: { get: jest.Mock; set: jest.Mock; getStale?: jest.Mock };
  let mockSequelize: { query: jest.Mock };

  beforeEach(() => {
    mockCache = {
      get: jest.fn().mockReturnValue(null), // Cache miss by default
      set: jest.fn(),
      getStale: jest.fn().mockReturnValue(null),
    };

    mockSequelize = {
      query: jest.fn().mockResolvedValue([]),
    };

    service = new MultiServiceAvailabilityService(
      mockSequelize as any,
      mockCache as any,
    );
  });

  // ─── Permutation guard ────────────────────────────────────────────────────

  describe('findMultiServiceSlots – service limit guard', () => {
    it('throws BadRequestException when more than 4 services are requested', async () => {
      const fiveIds = ['a', 'b', 'c', 'd', 'e'];
      await expect(
        service.findMultiServiceSlots(fiveIds, '2026-04-01'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws with the exact message "Maximum 4 services per slot request"', async () => {
      await expect(
        service.findMultiServiceSlots(['a', 'b', 'c', 'd', 'e'], '2026-04-01'),
      ).rejects.toThrow('Maximum 4 services per slot request');
    });

    it('does NOT throw for exactly 4 services (boundary)', async () => {
      // Should not throw the limit guard; DB queries return empty → returns []
      // Using resolves.toBeDefined() because the resolved value is an array, not a function
      mockSequelize.query.mockResolvedValue([]);
      await expect(
        service.findMultiServiceSlots(['a', 'b', 'c', 'd'], '2026-04-01'),
      ).resolves.toBeDefined();
    });
  });

  // ─── Cache hit ────────────────────────────────────────────────────────────

  describe('findMultiServiceSlots – cache', () => {
    it('returns cached result without hitting the database on a cache hit', async () => {
      const cachedSlots = [
        {
          startTime: '10:00',
          endTime: '11:00',
          totalDuration: 60,
          totalPrice: 0,
          available: true,
          services: [],
          assignments: [],
        },
      ];

      mockCache.get.mockReturnValue(cachedSlots);

      const result = await service.findMultiServiceSlots(
        ['svc-1', 'svc-2'],
        '2026-04-01',
      );

      expect(result).toBe(cachedSlots); // Exact same reference
      expect(mockSequelize.query).not.toHaveBeenCalled(); // No DB queries
    });

    it('queries the DB and returns empty array when no services found (no cache.set for empty result)', async () => {
      // Both service and addon queries return empty arrays
      mockSequelize.query.mockResolvedValue([]);

      const result = await service.findMultiServiceSlots(['svc-1'], '2026-04-01');

      // The method queries the DB on cache miss
      expect(mockSequelize.query).toHaveBeenCalled();
      // No services → returns empty slots array (early return)
      expect(result).toEqual([]);
      // cache.set is NOT called because we early-returned without computing slots
      expect(mockCache.set).not.toHaveBeenCalled();
    });
  });

  // ─── isWithinShifts ───────────────────────────────────────────────────────

  describe('isWithinShifts (private)', () => {
    // Cast to any to access private method
    const call = (
      svc: MultiServiceAvailabilityService,
      shifts: Array<{ shiftStart: string; shiftEnd: string }> | undefined,
      startMin: number,
      endMin: number,
    ): boolean => (svc as any).isWithinShifts(shifts, startMin, endMin);

    it('returns false when shifts is undefined', () => {
      expect(call(service, undefined, 480, 540)).toBe(false);
    });

    it('returns false when shifts array is empty (staff always unavailable without configured shifts)', () => {
      expect(call(service, [], 480, 540)).toBe(false);
    });

    it('returns true when slot exactly matches shift window', () => {
      const shifts = [{ shiftStart: '08:00', shiftEnd: '17:00' }];
      // 08:00 = 480 min, 17:00 = 1020 min — slot from 480 to 1020
      expect(call(service, shifts, 480, 1020)).toBe(true);
    });

    it('returns true when slot is inside a shift window', () => {
      const shifts = [{ shiftStart: '08:00', shiftEnd: '17:00' }];
      // 10:00–11:00 entirely within 08:00–17:00
      expect(call(service, shifts, 600, 660)).toBe(true);
    });

    it('returns false when slot starts before shift window', () => {
      const shifts = [{ shiftStart: '09:00', shiftEnd: '17:00' }];
      // 08:30–09:30 — starts at 510, shift starts at 540
      expect(call(service, shifts, 510, 570)).toBe(false);
    });

    it('returns false when slot ends after shift window', () => {
      const shifts = [{ shiftStart: '08:00', shiftEnd: '16:00' }];
      // 15:45–16:15 — exceeds shift end (16:00 = 960)
      expect(call(service, shifts, 945, 975)).toBe(false);
    });

    it('returns true when slot falls within the second of multiple shifts', () => {
      const shifts = [
        { shiftStart: '08:00', shiftEnd: '12:00' },
        { shiftStart: '14:00', shiftEnd: '18:00' },
      ];
      // 15:00–16:00 is within the afternoon shift
      expect(call(service, shifts, 900, 960)).toBe(true);
    });
  });

  // ─── generateTimeSlots ────────────────────────────────────────────────────

  describe('generateTimeSlots (private)', () => {
    it('generates 30-minute interval slots starting at 07:00', () => {
      const slots: Array<{ time: string }> = (service as any).generateTimeSlots();

      expect(slots[0].time).toBe('07:00');
      expect(slots[1].time).toBe('07:30');
      expect(slots[2].time).toBe('08:00');
    });

    it('ends at 21:30', () => {
      const slots: Array<{ time: string }> = (service as any).generateTimeSlots();
      expect(slots[slots.length - 1].time).toBe('21:30');
    });

    it('returns 30 slots for the full 07:00–21:30 window', () => {
      const slots: Array<{ time: string }> = (service as any).generateTimeSlots();
      // (21:30 – 07:00) / 0.5h = 29 intervals +1 = 30 slots
      expect(slots.length).toBe(30);
    });
  });

  // ─── getServiceTotalDuration ──────────────────────────────────────────────

  describe('getServiceTotalDuration (private)', () => {
    it('returns base duration when no addons or buffer', () => {
      const s = { id: '1', name: 'Test', duration: 60, bufferTime: 0, price: 0, addOns: [] };
      expect((service as any).getServiceTotalDuration(s)).toBe(60);
    });

    it('includes buffer time in total duration', () => {
      const s = { id: '1', name: 'Test', duration: 60, bufferTime: 15, price: 0, addOns: [] };
      expect((service as any).getServiceTotalDuration(s)).toBe(75);
    });

    it('adds addon additionalTime to base duration', () => {
      const s = {
        id: '1', name: 'Test', duration: 60, bufferTime: 0, price: 0,
        addOns: [{ id: 'a1', additionalTime: 20 }, { id: 'a2', additionalTime: 10 }],
      };
      expect((service as any).getServiceTotalDuration(s)).toBe(90);
    });

    it('combines duration + bufferTime + addon time', () => {
      const s = {
        id: '1', name: 'Test', duration: 60, bufferTime: 5, price: 0,
        addOns: [{ id: 'a1', additionalTime: 15 }],
      };
      expect((service as any).getServiceTotalDuration(s)).toBe(80);
    });
  });

  // ─── hasConflict ──────────────────────────────────────────────────────────

  describe('hasConflict (private)', () => {
    // hasConflict(bookings, start, end) — checks time-of-day overlap, no staffId filtering

    it('returns false when bookings array is empty', () => {
      const start = new Date('2026-04-01T10:00:00');
      const end = new Date('2026-04-01T11:00:00');
      expect((service as any).hasConflict([], start, end)).toBe(false);
    });

    it('returns true when new slot partially overlaps an existing booking', () => {
      const existingStart = new Date('2026-04-01T10:00:00');
      const existingEnd = new Date('2026-04-01T11:00:00');
      const bookings = [{ startTime: existingStart, endTime: existingEnd }];

      // 10:30–11:30 overlaps with 10:00–11:00
      const newStart = new Date('2026-04-01T10:30:00');
      const newEnd = new Date('2026-04-01T11:30:00');
      expect((service as any).hasConflict(bookings, newStart, newEnd)).toBe(true);
    });

    it('returns true when new slot is fully inside an existing booking', () => {
      const existingStart = new Date('2026-04-01T10:00:00');
      const existingEnd = new Date('2026-04-01T12:00:00');
      const bookings = [{ startTime: existingStart, endTime: existingEnd }];

      const newStart = new Date('2026-04-01T10:30:00');
      const newEnd = new Date('2026-04-01T11:00:00');
      expect((service as any).hasConflict(bookings, newStart, newEnd)).toBe(true);
    });

    it('returns false when new slot ends exactly when existing booking starts (adjacent, not overlapping)', () => {
      const existingStart = new Date('2026-04-01T11:00:00');
      const existingEnd = new Date('2026-04-01T12:00:00');
      const bookings = [{ startTime: existingStart, endTime: existingEnd }];

      // 10:00–11:00 adjacent to 11:00–12:00 — endMin (660) == bookingStartMin (660)
      // overlap condition: startMin < bookingEndMin && endMin > bookingStartMin → 600<720 && 660>660 = false
      const newStart = new Date('2026-04-01T10:00:00');
      const newEnd = new Date('2026-04-01T11:00:00');
      expect((service as any).hasConflict(bookings, newStart, newEnd)).toBe(false);
    });
  });
});
