import { Injectable } from '@nestjs/common';

/**
 * Basic application service.
 */
@Injectable()
export class AppService {
  /**
   * Returns a simple greeting.
   * @returns "Hello World!" string.
   */
  getHello(): string {
    return 'Hello World!';
  }
}
