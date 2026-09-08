import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from './prisma/prisma.service';

describe('readiness', () => {
  it('checks the database and reports readiness', async () => {
    const query = jest.fn().mockResolvedValue([{ value: 1 }]);
    const transaction = jest.fn().mockImplementation((fn) => fn({ $queryRaw: query }));
    const controller = new HealthController({ $transaction: transaction } as unknown as PrismaService);
    await expect(controller.readiness()).resolves.toEqual({ status: 'ok' });
    expect(query).toHaveBeenCalled();
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), { maxWait: 2000, timeout: 2000 });
  });

  it('returns 503 without leaking database errors', async () => {
    const controller = new HealthController({
      $transaction: jest.fn().mockRejectedValue(new Error('private connection details')),
    } as unknown as PrismaService);
    await expect(controller.readiness()).rejects.toThrow(ServiceUnavailableException);
    await expect(controller.readiness()).rejects.toThrow('Service unavailable');
  });
});
