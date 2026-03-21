import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  NotFoundException,
  HttpCode,
  HttpStatus,
  Delete,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import {
  PerformanceTestsService,
  RunTestDto,
  TestResult,
} from './performance-tests.service';
import { SkipCsrf } from '../common/decorators/csrf.decorator';

@ApiTags('performance-tests')
@Controller('performance-tests')
@SkipCsrf() // Routes require JWT auth — CSRF is redundant and blocks DELETE cancel
export class PerformanceTestsController {
  private readonly logger = new Logger(PerformanceTestsController.name);

  constructor(private readonly service: PerformanceTestsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all test results',
    description: 'Returns all stored performance test results, newest first.',
  })
  @ApiResponse({ status: 200, description: 'List of test results' })
  listResults(): TestResult[] {
    return this.service.listResults();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a specific test result',
    description: 'Returns the current state of a test run including time-series metrics.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Test run UUID' })
  @ApiResponse({ status: 200, description: 'Test result' })
  @ApiResponse({ status: 404, description: 'Test not found' })
  getResult(@Param('id') id: string): TestResult {
    const result = this.service.getResult(id);
    if (!result) throw new NotFoundException(`Test run ${id} not found`);
    return result;
  }

  @Post('run')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Start a performance test',
    description: `
Starts a performance test and returns immediately with the test run ID.
Poll GET /performance-tests/:id to track progress.

Test types:
- **load**   — 10 VUs steady load, 50s total. Validates expected traffic.
- **stress** — Ramp 1 → 50 VUs over 40s. Finds the breaking point.
- **spike**  — 2 VUs → 50 VUs spike for 15s → 2 VUs. Simulates a burst.
- **soak**   — 10 VUs for 2 minutes. Detects stability issues.
    `.trim(),
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['load', 'stress', 'spike', 'soak'] },
        baseUrl: { type: 'string', example: 'https://api.nailsandcobeauty.com' },
      },
      required: ['type'],
    },
  })
  @ApiResponse({ status: 201, description: 'Test started successfully' })
  async runTest(@Body() dto: RunTestDto): Promise<TestResult> {
    this.logger.log(`Starting ${dto.type} test`);
    return this.service.startTest(dto);
  }

  @Delete(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel a running test',
    description: 'Cancels a test that is currently running.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Test run UUID' })
  @ApiResponse({ status: 200, description: 'Test cancelled' })
  @ApiResponse({ status: 404, description: 'Test not found' })
  cancelTest(@Param('id') id: string): { message: string } {
    const result = this.service.cancelTest(id);
    if (result === 'not_found') {
      throw new NotFoundException(`Test run ${id} not found`);
    }
    // 'already_done': test exists but finished before the cancel arrived — treat as success
    // so the UI doesn't show an error when the user clicks Cancel on a race-condition edge.
    return { message: result === 'cancelled' ? 'Test cancelled' : 'Test already completed' };
  }
}
