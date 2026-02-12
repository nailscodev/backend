import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsArray, Min, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({
    description: 'Service name',
    example: 'Manicure Clásica',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Service description',
    example: 'Manicure completa con esmaltado tradicional',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Category ID (UUID)',
    example: 'c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    description: 'Service price in cents',
    example: 2500,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Service duration in minutes',
    example: 60,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiPropertyOptional({
    description: 'Buffer time after service in minutes',
    example: 15,
    minimum: 0,
    default: 15,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  bufferTime?: number;

  @ApiPropertyOptional({
    description: 'Whether the service is currently active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the service is marked as popular',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isPopular?: boolean;

  @ApiPropertyOptional({
    description: 'Service requirements or preparations',
    example: ['Uñas cortas', 'Sin esmalte'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requirements?: string[];

  @ApiPropertyOptional({
    description: 'Compatible add-on service IDs',
    example: ['123e4567-e89b-12d3-a456-426614174001'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  compatibleAddOns?: string[];

  @ApiPropertyOptional({
    description: 'Service image URL',
    example: 'https://example.com/service-image.jpg',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Display order for service listings',
    example: 1,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @ApiPropertyOptional({
    description: 'English title for translation',
    example: 'Classic Manicure',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  titleEN?: string;

  @ApiPropertyOptional({
    description: 'English description for translation',
    example: 'Complete manicure with traditional polish',
  })
  @IsString()
  @IsOptional()
  descriptionEN?: string;

  @ApiPropertyOptional({
    description: 'Spanish title for translation',
    example: 'Manicure Clásica',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  titleES?: string;

  @ApiPropertyOptional({
    description: 'Spanish description for translation',
    example: 'Manicure completa con esmaltado tradicional',
  })
  @IsString()
  @IsOptional()
  descriptionES?: string;
}