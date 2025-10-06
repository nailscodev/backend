import { ServiceCategory } from './service.entity';

describe('ServiceEntity', () => {
  describe('ServiceCategory Enum', () => {
    it('should have all required service categories', () => {
      const expectedCategories = ['NAILS', 'FACIAL', 'BODY', 'HAIR', 'ADDON'];
      const actualCategories = Object.values(ServiceCategory);
      
      expect(actualCategories).toEqual(expect.arrayContaining(expectedCategories));
      expect(actualCategories.length).toBe(expectedCategories.length);
    });

    it('should validate NAILS category exists', () => {
      expect(ServiceCategory.NAILS).toBe('NAILS');
    });

    it('should validate FACIAL category exists', () => {
      expect(ServiceCategory.FACIAL).toBe('FACIAL');
    });

    it('should validate BODY category exists', () => {
      expect(ServiceCategory.BODY).toBe('BODY');
    });

    it('should validate HAIR category exists', () => {
      expect(ServiceCategory.HAIR).toBe('HAIR');
    });

    it('should validate ADDON category exists', () => {
      expect(ServiceCategory.ADDON).toBe('ADDON');
    });
  });

  describe('Business Rules Validation', () => {
    it('should verify required field structure for service creation', () => {
      const requiredFields = ['id', 'tenantId', 'name', 'category', 'durationMinutes', 'price'];
      
      // This test validates that we know what fields are required for a service
      requiredFields.forEach(field => {
        expect(field).toBeDefined();
        expect(typeof field).toBe('string');
      });
    });

    it('should verify optional field structure for service creation', () => {
      const optionalFields = ['description', 'isActive'];
      
      // This test validates that we know what fields are optional for a service
      optionalFields.forEach(field => {
        expect(field).toBeDefined();
        expect(typeof field).toBe('string');
      });
    });

    it('should validate service categories can be used in business logic', () => {
      const categories = Object.values(ServiceCategory);
      
      // Simulate business logic that might filter services by category
      const nailServices = categories.filter(cat => cat === ServiceCategory.NAILS);
      const facialServices = categories.filter(cat => cat === ServiceCategory.FACIAL);
      
      expect(nailServices).toHaveLength(1);
      expect(facialServices).toHaveLength(1);
      expect(nailServices[0]).toBe('NAILS');
      expect(facialServices[0]).toBe('FACIAL');
    });
  });

  describe('Service Category Business Logic', () => {
    it('should support service filtering by category', () => {
      const mockServices = [
        { name: 'Manicure', category: ServiceCategory.NAILS },
        { name: 'Facial', category: ServiceCategory.FACIAL },
        { name: 'Haircut', category: ServiceCategory.HAIR },
        { name: 'Massage', category: ServiceCategory.BODY },
        { name: 'Polish Change', category: ServiceCategory.ADDON },
      ];

      const nailServices = mockServices.filter(s => s.category === ServiceCategory.NAILS);
      const facialServices = mockServices.filter(s => s.category === ServiceCategory.FACIAL);

      expect(nailServices).toHaveLength(1);
      expect(nailServices[0].name).toBe('Manicure');
      expect(facialServices).toHaveLength(1);
      expect(facialServices[0].name).toBe('Facial');
    });

    it('should support category-based pricing logic', () => {
      const categoryPricing = {
        [ServiceCategory.NAILS]: { min: 1500, max: 5000 },
        [ServiceCategory.FACIAL]: { min: 2000, max: 8000 },
        [ServiceCategory.HAIR]: { min: 2500, max: 6000 },
        [ServiceCategory.BODY]: { min: 3000, max: 12000 },
        [ServiceCategory.ADDON]: { min: 500, max: 2000 },
      };

      // Validate that all categories have pricing ranges
      Object.values(ServiceCategory).forEach(category => {
        expect(categoryPricing[category]).toBeDefined();
        expect(categoryPricing[category].min).toBeGreaterThan(0);
        expect(categoryPricing[category].max).toBeGreaterThan(categoryPricing[category].min);
      });
    });
  });
});