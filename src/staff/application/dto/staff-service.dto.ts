import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ProficiencyLevel } from '../../infrastructure/persistence/entities/staff-service.entity';

export class CreateStaffServiceDto {
    @ApiProperty({
        description: 'Staff member ID',
        example: '123e4567-e89b-12d3-a456-426614174001',
    })
    @IsString()
    staffId: string;

    @ApiProperty({
        description: 'Service ID',
        example: '123e4567-e89b-12d3-a456-426614174002',
    })
    @IsString()
    serviceId: string;

    @ApiProperty({
        description: 'Whether this is a preferred service for the staff member',
        example: true,
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    isPreferred?: boolean = false;

    @ApiProperty({
        description: 'Staff member proficiency level for this service',
        enum: ProficiencyLevel,
        example: ProficiencyLevel.ADVANCED,
        required: false,
    })
    @IsOptional()
    @IsEnum(ProficiencyLevel)
    proficiencyLevel?: ProficiencyLevel = ProficiencyLevel.STANDARD;

    @ApiProperty({
        description: 'Additional notes about this staff-service relationship',
        example: 'Especializada en diseños complejos',
        required: false,
    })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateStaffServiceDto {
    @ApiProperty({
        description: 'Whether this is a preferred service for the staff member',
        example: true,
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    isPreferred?: boolean;

    @ApiProperty({
        description: 'Staff member proficiency level for this service',
        enum: ProficiencyLevel,
        example: ProficiencyLevel.ADVANCED,
        required: false,
    })
    @IsOptional()
    @IsEnum(ProficiencyLevel)
    proficiencyLevel?: ProficiencyLevel;

    @ApiProperty({
        description: 'Additional notes about this staff-service relationship',
        example: 'Especializada en diseños complejos',
        required: false,
    })
    @IsOptional()
    @IsString()
    notes?: string;
}