import { HttpException } from '@nestjs/common';
import { AiRateLimitService } from './ai-rate-limit.service';

describe('AiRateLimitService', () => {
  it('allows ten requests per user per minute and rejects the eleventh', () => {
    const service = new AiRateLimitService();
    for (let index = 0; index < 10; index += 1) {
      expect(() => service.assertAllowed('user-1', 1_000)).not.toThrow();
    }
    expect(() => service.assertAllowed('user-1', 1_000)).toThrow(HttpException);
    expect(() => service.assertAllowed('user-2', 1_000)).not.toThrow();
  });

  it('discards attempts outside the rolling window', () => {
    const service = new AiRateLimitService();
    for (let index = 0; index < 10; index += 1) {
      service.assertAllowed('user-1', 1_000);
    }
    expect(() => service.assertAllowed('user-1', 61_001)).not.toThrow();
  });
});
