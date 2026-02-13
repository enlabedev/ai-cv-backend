import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Root controller for the application.
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Health check endpoint.
   * @returns A greeting string.
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
