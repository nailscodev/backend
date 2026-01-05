import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsUrl, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAddOnDto {
  @ApiProperty({
    description: 'Add-on name',
    example: 'Nail Art Design',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Add-on description',
    example: 'Beautiful custom nail art designs',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Add-on price in cents',
    example: 1500,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Additional time in minutes for this add-on',
    example: 15,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  additionalTime?: number;

  @ApiProperty({
    description: 'Whether the add-on is currently active',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Display order for sorting',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  displayOrder?: number;

  @ApiProperty({
    description: 'Array of service IDs this add-on is compatible with',
    example: ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  compatibleServiceIds?: string[];

  @ApiProperty({
    description: 'Image URL for the add-on',
    example: 'https://example.com/nail-art.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  // Translation fields
  @ApiProperty({
    description: 'Add-on title in English',
    example: 'Nail Art Design',
    required: false,
  })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiProperty({
    description: 'Add-on title in Spanish',
    example: 'Diseño de Arte de Uñas',
    required: false,
  })
  @IsOptional()
  @IsString()
  titleEs?: string;

  @ApiProperty({
    description: 'Add-on description in English',
    example: 'Beautiful custom nail art designs',
    required: false,
  })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiProperty({
    description: 'Add-on description in Spanish',
    example: 'Hermosos diseños de arte de uñas personalizados',
    required: false,
  })
  @IsOptional()
  @IsString()
  descriptionEs?: string;
}