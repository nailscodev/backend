import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { StaffServiceEntity } from '../infrastructure/persistence/entities/staff-service.entity';
import { StaffEntity } from '../infrastructure/persistence/entities/staff.entity';
import { ServiceEntity } from '../../services/infrastructure/persistence/entities/service.entity';
import { CreateStaffServiceDto, UpdateStaffServiceDto } from './dto/staff-service.dto';

@Injectable()
export class StaffServiceRelationService {
    private readonly logger = new Logger(StaffServiceRelationService.name);

    constructor(
        @InjectModel(StaffServiceEntity)
        private readonly staffServiceModel: typeof StaffServiceEntity,
        @InjectModel(StaffEntity)
        private readonly staffModel: typeof StaffEntity,
        @InjectModel(ServiceEntity)
        private readonly serviceModel: typeof ServiceEntity,
    ) { }

    /**
     * Creates a new staff-service relationship
     */
    async createStaffService(createDto: CreateStaffServiceDto): Promise<StaffServiceEntity> {
        this.logger.log(`Creating staff-service relationship: ${createDto.staffId} -> ${createDto.serviceId}`);

        // Verify staff and service exist
        await this.verifyStaffExists(createDto.staffId);
        await this.verifyServiceExists(createDto.serviceId);

        // Check if relationship already exists
        const existing = await this.staffServiceModel.findOne({
            where: {
                staffId: createDto.staffId,
                serviceId: createDto.serviceId,
            },
        });

        if (existing) {
            throw new ConflictException('Staff-service relationship already exists');
        }

        try {
            const relationship = await this.staffServiceModel.create({
                staffId: createDto.staffId,
                serviceId: createDto.serviceId,
                isPreferred: createDto.isPreferred || false,
                proficiencyLevel: createDto.proficiencyLevel,
                notes: createDto.notes,
            } as any);

            this.logger.log(`Staff-service relationship created: ${relationship.id}`);
            return relationship;
        } catch (error: unknown) {
            this.logger.error('Failed to create staff-service relationship', error);
            throw new BadRequestException('Failed to create staff-service relationship');
        }
    }

    /**
     * Updates an existing staff-service relationship
     */
    async updateStaffService(staffId: string, serviceId: string, updateDto: UpdateStaffServiceDto): Promise<StaffServiceEntity> {
        this.logger.log(`Updating staff-service relationship: ${staffId} -> ${serviceId}`);

        const relationship = await this.findStaffServiceRelation(staffId, serviceId);

        try {
            await relationship.update({
                ...(updateDto.isPreferred !== undefined && { isPreferred: updateDto.isPreferred }),
                ...(updateDto.proficiencyLevel && { proficiencyLevel: updateDto.proficiencyLevel }),
                ...(updateDto.notes !== undefined && { notes: updateDto.notes }),
            });

            this.logger.log(`Staff-service relationship updated: ${relationship.id}`);
            return relationship;
        } catch (error: unknown) {
            this.logger.error(`Failed to update staff-service relationship: ${relationship.id}`, error);
            throw new BadRequestException('Failed to update staff-service relationship');
        }
    }

    /**
     * Deletes a staff-service relationship
     */
    async deleteStaffService(staffId: string, serviceId: string): Promise<void> {
        this.logger.log(`Deleting staff-service relationship: ${staffId} -> ${serviceId}`);

        const relationship = await this.findStaffServiceRelation(staffId, serviceId);

        try {
            await relationship.destroy();
            this.logger.log(`Staff-service relationship deleted: ${relationship.id}`);
        } catch (error: unknown) {
            this.logger.error(`Failed to delete staff-service relationship: ${relationship.id}`, error);
            throw new BadRequestException('Failed to delete staff-service relationship');
        }
    }

    /**
     * Gets all services for a staff member
     */
    async getStaffServices(staffId: string): Promise<ServiceEntity[]> {
        this.logger.log(`Getting services for staff: ${staffId}`);

        await this.verifyStaffExists(staffId);

        try {
            const staff = await this.staffModel.findByPk(staffId, {
                include: [{
                    model: ServiceEntity,
                    through: { attributes: ['isPreferred', 'proficiencyLevel', 'notes'] },
                }],
            });

            return staff?.services || [];
        } catch (error: unknown) {
            this.logger.error(`Failed to get services for staff: ${staffId}`, error);
            throw new BadRequestException('Failed to get staff services');
        }
    }

    /**
     * Gets all staff members for a service
     */
    async getServiceStaff(serviceId: string): Promise<StaffEntity[]> {
        this.logger.log(`Getting staff for service: ${serviceId}`);

        await this.verifyServiceExists(serviceId);

        try {
            const service = await this.serviceModel.findByPk(serviceId, {
                include: [{
                    model: StaffEntity,
                    through: { attributes: ['isPreferred', 'proficiencyLevel', 'notes'] },
                }],
            });

            return service?.staff || [];
        } catch (error: unknown) {
            this.logger.error(`Failed to get staff for service: ${serviceId}`, error);
            throw new BadRequestException('Failed to get service staff');
        }
    }

    /**
     * Gets a specific staff-service relationship
     */
    async getStaffServiceRelation(staffId: string, serviceId: string): Promise<StaffServiceEntity> {
        return await this.findStaffServiceRelation(staffId, serviceId);
    }

    /**
     * Gets all staff-service relationships
     */
    async getAllStaffServiceRelations(): Promise<StaffServiceEntity[]> {
        this.logger.log('Getting all staff-service relationships');

        try {
            const relationships = await this.staffServiceModel.findAll({
                include: [
                    { model: StaffEntity, attributes: ['id', 'firstName', 'lastName', 'email'] },
                    { model: ServiceEntity, attributes: ['id', 'name', 'category'] },
                ],
                order: [['createdAt', 'DESC']],
            });

            return relationships;
        } catch (error: unknown) {
            this.logger.error('Failed to get all staff-service relationships', error);
            throw new BadRequestException('Failed to get staff-service relationships');
        }
    }

    // Private helper methods

    private async findStaffServiceRelation(staffId: string, serviceId: string): Promise<StaffServiceEntity> {
        const relationship = await this.staffServiceModel.findOne({
            where: {
                staffId: staffId,
                serviceId: serviceId,
            },
            include: [
                { model: StaffEntity, attributes: ['id', 'firstName', 'lastName'] },
                { model: ServiceEntity, attributes: ['id', 'name'] },
            ],
        });

        if (!relationship) {
            throw new NotFoundException(`Staff-service relationship not found: ${staffId} -> ${serviceId}`);
        }

        return relationship;
    }

    private async verifyStaffExists(staffId: string): Promise<void> {
        const staff = await this.staffModel.findByPk(staffId);
        if (!staff) {
            throw new NotFoundException(`Staff member not found: ${staffId}`);
        }
    }

    private async verifyServiceExists(serviceId: string): Promise<void> {
        const service = await this.serviceModel.findByPk(serviceId);
        if (!service) {
            throw new NotFoundException(`Service not found: ${serviceId}`);
        }
    }
}