import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class AiRateLimitService {
  private readonly attempts = new Map<string, number[]>();
  private readonly windowMs = 60_000;
  private readonly limit = 10;

  assertAllowed(userId: string, now = Date.now()): void {
    const cutoff = now - this.windowMs;
    const recent = (this.attempts.get(userId) ?? []).filter(
      (timestamp) => timestamp > cutoff,
    );

    if (recent.length >= this.limit) {
      throw new HttpException(
        'Too many AI requests. Please wait a minute and try again.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    recent.push(now);
    this.attempts.set(userId, recent);
  }
}
