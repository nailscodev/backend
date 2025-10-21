import { Table, Column, Model, DataType, ForeignKey, Index } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import { StaffEntity } from './staff.entity';
import { ServiceEntity } from '../../../../services/infrastructure/persistence/entities/service.entity';

export enum ProficiencyLevel {
    BEGINNER = 'BEGINNER',
    STANDARD = 'STANDARD',
    ADVANCED = 'ADVANCED',
    EXPERT = 'EXPERT'
}

@Table({
    tableName: 'staff_services',
    timestamps: true,
    indexes: [
        { fields: ['staff_id', 'service_id'], unique: true },
        { fields: ['staff_id'] },
        { fields: ['service_id'] },
        { fields: ['isPreferred'] },
    ],
})
export class StaffServiceEntity extends Model<StaffServiceEntity> {
    @ApiProperty({
        description: 'Unique identifier for the staff-service relationship',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @Column({
        primaryKey: true,
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
    })
    declare id: string;

    @ApiProperty({
        description: 'Staff member ID',
        example: '123e4567-e89b-12d3-a456-426614174001',
    })
    @ForeignKey(() => StaffEntity)
    @Index
    @Column({
        type: DataType.UUID,
        allowNull: false,
        field: 'staff_id',
    })
    staffId: string;

    @ApiProperty({
        description: 'Service ID',
        example: '123e4567-e89b-12d3-a456-426614174002',
    })
    @ForeignKey(() => ServiceEntity)
    @Index
    @Column({
        type: DataType.UUID,
        allowNull: false,
        field: 'service_id',
    })
    serviceId: string;

    @ApiProperty({
        description: 'Whether this is a preferred service for the staff member',
        example: true,
    })
    @Index
    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    })
    isPreferred: boolean;

    @ApiProperty({
        description: 'Staff member proficiency level for this service',
        enum: ProficiencyLevel,
        example: ProficiencyLevel.ADVANCED,
    })
    @Column({
        type: DataType.ENUM(...Object.values(ProficiencyLevel)),
        allowNull: true,
        defaultValue: ProficiencyLevel.STANDARD,
    })
    proficiencyLevel?: ProficiencyLevel;

    @ApiProperty({
        description: 'Additional notes about this staff-service relationship',
        example: 'Especializada en diseños complejos',
        required: false,
    })
    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    notes?: string;

    @ApiProperty({
        description: 'When the relationship was created',
        example: '2025-09-21T13:00:00Z',
    })
    declare createdAt: Date;

    @ApiProperty({
        description: 'When the relationship was last updated',
        example: '2025-09-21T13:00:00Z',
    })
    declare updatedAt: Date;

    // Associations (defined in associations.ts)
    staff: StaffEntity;
    service: ServiceEntity;
}

export default StaffServiceEntity;