import { BadRequestException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';

const mockRepo = {
  findByDateWithRelations: jest.fn(),
  findByServiceAndDate: jest.fn(),
  findByPatient: jest.fn(),
  findByDateRange: jest.fn(),
};

function makeService() {
  return new AppointmentsService(mockRepo as any);
}

describe('AppointmentsService — AGD-001 week range', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns appointments within date range', async () => {
    mockRepo.findByDateRange.mockResolvedValue([
      { id: 'a1', date: '2026-06-09', time: '09:00' },
      { id: 'a2', date: '2026-06-10', time: '14:00' },
    ]);
    const svc = makeService();
    const result = await svc.findByDateRange('2026-06-09', '2026-06-15', 't1');
    expect(result).toHaveLength(2);
    expect(mockRepo.findByDateRange).toHaveBeenCalledWith('2026-06-09', '2026-06-15', 't1');
  });

  it('throws when range exceeds 31 days', async () => {
    const svc = makeService();
    await expect(svc.findByDateRange('2026-06-01', '2026-07-10', 't1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws when to is before from', async () => {
    const svc = makeService();
    await expect(svc.findByDateRange('2026-06-15', '2026-06-10', 't1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('allows same-day range', async () => {
    mockRepo.findByDateRange.mockResolvedValue([]);
    const svc = makeService();
    await expect(svc.findByDateRange('2026-06-10', '2026-06-10', 't1')).resolves.toEqual([]);
  });
});
