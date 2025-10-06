import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  NotFoundException,
  BadRequestException,
  HttpStatus,
  ValidationPipe,
  ParseUUIDPipe,
  ParseIntPipe,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Op } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
import { NotificationEntity, NotificationStatus, NotificationType, NotificationChannel } from './persistence/entities/notification.entity';
import { CreateNotificationDto } from '../application/dto/create-notification.dto';
import { UpdateNotificationDto } from '../application/dto/update-notification.dto';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    @InjectModel(NotificationEntity)
    private notificationModel: typeof NotificationEntity,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all notifications',
    description: 'Retrieve a paginated list of notifications with optional filtering by status, type, channel, or customer.',
  })
  @ApiQuery({ name: 'page', required: false, type: 'number', description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'status', required: false, enum: NotificationStatus, description: 'Filter by notification status' })
  @ApiQuery({ name: 'type', required: false, enum: NotificationType, description: 'Filter by notification type' })
  @ApiQuery({ name: 'channel', required: false, enum: NotificationChannel, description: 'Filter by notification channel' })
  @ApiQuery({ name: 'customerId', required: false, type: 'string', description: 'Filter by customer ID (UUID)' })
  @ApiQuery({ name: 'bookingId', required: false, type: 'string', description: 'Filter by booking ID (UUID)' })
  @ApiQuery({ name: 'search', required: false, type: 'string', description: 'Search in title and message' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notifications retrieved successfully',
  })
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('status') status?: NotificationStatus,
    @Query('type') type?: NotificationType,
    @Query('channel') channel?: NotificationChannel,
    @Query('customerId') customerId?: string,
    @Query('bookingId') bookingId?: string,
    @Query('search') search?: string,
  ) {
    const where: Record<string, any> = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (channel) {
      where.channel = channel;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (bookingId) {
      where.bookingId = bookingId;
    }

    if (search) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (where as any)[Op.or] = [
        {
          title: {
            [Op.iLike]: `%${search}%`
          }
        },
        {
          message: {
            [Op.iLike]: `%${search}%`
          }
        }
      ];
    }

    // Limit pagination
    const maxLimit = 100;
    const actualLimit = Math.min(limit, maxLimit);

    const { rows: notifications, count: total } = await this.notificationModel.findAndCountAll({
      where,
      offset: (page - 1) * actualLimit,
      limit: actualLimit,
      order: [['createdAt', 'DESC']],
    });

    return {
      success: true,
      data: notifications,
      pagination: {
        page,
        limit: actualLimit,
        total,
        totalPages: Math.ceil(total / actualLimit),
        hasNextPage: page < Math.ceil(total / actualLimit),
        hasPrevPage: page > 1,
      },
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get notification by ID',
    description: 'Retrieve a specific notification by its unique identifier.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Notification unique identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification retrieved successfully',
    type: NotificationEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    const notification = await this.notificationModel.findByPk(id);

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new notification',
    description: 'Creates a new notification with the provided information.',
  })
  @ApiBody({
    type: CreateNotificationDto,
    description: 'Notification creation data',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Notification has been created successfully',
    type: NotificationEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ValidationPipe({ transform: true })) createNotificationDto: CreateNotificationDto,
  ) {
    try {
      const notification = await this.notificationModel.create(createNotificationDto as any);
      
      return {
        success: true,
        data: notification,
        message: 'Notification created successfully',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Error creating notification: ' + errorMessage);
    }
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update notification',
    description: 'Update an existing notification.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Notification unique identifier (UUID)',
  })
  @ApiBody({
    type: UpdateNotificationDto,
    description: 'Notification update data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification updated successfully',
    type: NotificationEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  async update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto) {
    const notification = await this.notificationModel.findByPk(id);

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await notification.update(updateNotificationDto as any);
      return notification;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Error updating notification: ' + errorMessage);
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete notification',
    description: 'Delete a notification by ID.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Notification unique identifier (UUID)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  async remove(@Param('id') id: string) {
    const notification = await this.notificationModel.findByPk(id);

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    await notification.destroy();
    return { message: `Notification with ID ${id} has been deleted` };
  }

  @Put(':id/mark-sent')
  @ApiOperation({
    summary: 'Mark notification as sent',
    description: 'Mark a notification as sent and set the sentAt timestamp.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Notification unique identifier (UUID)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification marked as sent successfully',
  })
  async markAsSent(@Param('id') id: string) {
    const notification = await this.notificationModel.findByPk(id);

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    try {
      await notification.update({
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      });
      return notification;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Error marking notification as sent: ' + errorMessage);
    }
  }

  @Put(':id/mark-delivered')
  @ApiOperation({
    summary: 'Mark notification as delivered',
    description: 'Mark a notification as delivered and set the deliveredAt timestamp.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Notification unique identifier (UUID)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification marked as delivered successfully',
  })
  async markAsDelivered(@Param('id') id: string) {
    const notification = await this.notificationModel.findByPk(id);

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    try {
      await notification.update({
        status: NotificationStatus.DELIVERED,
        deliveredAt: new Date(),
      });
      return notification;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Error marking notification as delivered: ' + errorMessage);
    }
  }

  @Put(':id/mark-failed')
  @ApiOperation({
    summary: 'Mark notification as failed',
    description: 'Mark a notification as failed with an optional error message.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Notification unique identifier (UUID)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification marked as failed successfully',
  })
  async markAsFailed(@Param('id') id: string, @Body('errorMessage') errorMessage?: string) {
    const notification = await this.notificationModel.findByPk(id);

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    try {
      const currentRetryCount = notification.retryCount || 0;
      await notification.update({
        status: NotificationStatus.FAILED,
        errorMessage: errorMessage || 'Unknown error',
        retryCount: currentRetryCount + 1,
      });
      
      return {
        success: true,
        data: notification,
        message: 'Notification marked as failed successfully',
      };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Error marking notification as failed: ' + errorMsg);
    }
  }

  @Post(':id/retry')
  @ApiOperation({
    summary: 'Retry failed notification',
    description: 'Retry a failed notification if retry count has not exceeded max retries.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Notification unique identifier (UUID)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification retry initiated successfully',
  })
  async retry(@Param('id') id: string) {
    const notification = await this.notificationModel.findByPk(id);

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    const currentRetryCount = notification.retryCount || 0;
    const maxRetries = notification.maxRetries || 3;
    
    if (currentRetryCount >= maxRetries) {
      throw new BadRequestException('Maximum retry count exceeded');
    }

    try {
      await notification.update({
        status: NotificationStatus.PENDING,
        errorMessage: undefined,
        scheduledAt: new Date(),
      });
      
      return {
        success: true,
        data: notification,
        message: 'Notification retry scheduled successfully',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Error retrying notification: ' + errorMessage);
    }
  }
}