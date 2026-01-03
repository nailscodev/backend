import { Controller, Get, Post, Patch, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { CategoriesService } from '../../application/services/categories.service';
import { CategoryEntity } from '../persistence/entities/category.entity';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Get()
  @ApiOperation({ summary: 'Get all active categories' })
  @ApiQuery({ name: 'lang', required: false, description: 'Language code (EN, ES, etc.)' })
  @ApiResponse({
    status: 200,
    description: 'Returns all active categories',
    type: [CategoryEntity],
  })
  async findAll(@Query('lang') lang?: string): Promise<CategoryEntity[]> {
    return this.categoriesService.findAll(lang);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiQuery({ name: 'lang', required: false, description: 'Language code (EN, ES, etc.)' })
  @ApiResponse({
    status: 200,
    description: 'Returns the category',
    type: CategoryEntity,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(
    @Param('id') id: string,
    @Query('lang') lang?: string
  ): Promise<CategoryEntity | null> {
    return this.categoriesService.findOne(id, lang);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Manicure' },
        displayOrder: { type: 'number', example: 1 },
        imageUrl: { type: 'string', example: 'https://res.cloudinary.com/...' },
        titleEn: { type: 'string', example: 'Manicure' },
        titleEs: { type: 'string', example: 'Manicura' },
        descriptionEn: { type: 'string', example: 'Professional manicure services' },
        descriptionEs: { type: 'string', example: 'Servicios profesionales de manicura' },
      },
      required: ['name', 'displayOrder'],
    },
  })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  async create(@Body() createData: {
    name: string;
    displayOrder: number;
    imageUrl?: string;
    titleEn?: string;
    titleEs?: string;
    descriptionEn?: string;
    descriptionEs?: string;
  }): Promise<CategoryEntity> {
    return this.categoriesService.create(createData);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        displayOrder: { type: 'number' },
        imageUrl: { type: 'string' },
        isActive: { type: 'boolean' },
        titleEn: { type: 'string' },
        titleEs: { type: 'string' },
        descriptionEn: { type: 'string' },
        descriptionEs: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async update(
    @Param('id') id: string,
    @Body() updateData: {
      name?: string;
      displayOrder?: number;
      imageUrl?: string;
      isActive?: boolean;
      titleEn?: string;
      titleEs?: string;
      descriptionEn?: string;
      descriptionEs?: string;
    }
  ): Promise<CategoryEntity> {
    return this.categoriesService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.categoriesService.delete(id);
    return { message: 'Category deleted successfully' };
  }
}
