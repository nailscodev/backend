import { ServiceEntity } from '../services/infrastructure/persistence/entities/service.entity';
import { AddOnEntity } from '../addons/infrastructure/persistence/entities/addon.entity';
import { ServiceAddon } from '../shared/domain/service-addon.model';
import { StaffEntity } from '../staff/infrastructure/persistence/entities/staff.entity';
import { StaffServiceEntity } from '../staff/infrastructure/persistence/entities/staff-service.entity';

/**
 * Defines all database relationships between entities
 */
export function defineAssociations() {
  // Service and AddOn many-to-many relationship through ServiceAddon
  ServiceEntity.belongsToMany(AddOnEntity, {
    through: ServiceAddon,
    foreignKey: 'service_id',
    otherKey: 'addon_id',
    as: 'addOns'
  });

  AddOnEntity.belongsToMany(ServiceEntity, {
    through: ServiceAddon,
    foreignKey: 'addon_id',
    otherKey: 'service_id',
    as: 'services'
  });

  // Staff and Service many-to-many relationship handled by decorators in models

  // Direct associations for ServiceAddon
  ServiceAddon.belongsTo(ServiceEntity, {
    foreignKey: 'service_id',
    as: 'service'
  });

  ServiceAddon.belongsTo(AddOnEntity, {
    foreignKey: 'addon_id',
    as: 'addon'
  });

  // Direct associations for StaffService
  StaffServiceEntity.belongsTo(StaffEntity, {
    foreignKey: 'staff_id',
    as: 'staff'
  });

  StaffServiceEntity.belongsTo(ServiceEntity, {
    foreignKey: 'service_id',
    as: 'service'
  });
}