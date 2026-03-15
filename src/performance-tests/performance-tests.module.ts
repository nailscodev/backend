import { Module } from '@nestjs/common';
import { PerformanceTestsController } from './performance-tests.controller';
import { PerformanceTestsService } from './performance-tests.service';

@Module({
  controllers: [PerformanceTestsController],
  providers: [PerformanceTestsService],
  exports: [PerformanceTestsService],
})
export class PerformanceTestsModule {}
