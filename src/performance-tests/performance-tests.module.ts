import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PerformanceTestsController } from './performance-tests.controller';
import { PerformanceTestsService } from './performance-tests.service';
import { PerformanceTestRunEntity } from './performance-test-run.entity';

@Module({
  imports: [SequelizeModule.forFeature([PerformanceTestRunEntity])],
  controllers: [PerformanceTestsController],
  providers: [PerformanceTestsService],
  exports: [PerformanceTestsService],
})
export class PerformanceTestsModule {}
