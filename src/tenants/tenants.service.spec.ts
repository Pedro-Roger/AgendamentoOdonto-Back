import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { TenantsService } from './tenants.service';

const mockRepo = { findBySlug: jest.fn(), findById: jest.fn(), create: jest.fn(), list: jest.fn() };
function makeService() { return new TenantsService(mockRepo as any); }

describe('TenantsService', () => {
  beforeEach(() => jest.clearAllMocks());
  it('cria tenant com slug normalizado', async () => {
    mockRepo.findBySlug.mockResolvedValue(null);
    mockRepo.create.mockResolvedValue({ id: 't1', slug: 'dra-herlania' });
    await makeService().create({ name: 'Dra Herlânia', slug: 'Dra Herlânia' });
    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ slug: 'dra-herlania' }));
  });
  it('rejeita slug duplicado', async () => {
    mockRepo.findBySlug.mockResolvedValue({ id: 't0' });
    await expect(makeService().create({ name: 'X', slug: 'dra-herlania' })).rejects.toBeInstanceOf(ConflictException);
  });
  it('rejeita nome vazio', async () => {
    await expect(makeService().create({ name: '  ', slug: 'x' })).rejects.toBeInstanceOf(BadRequestException);
  });
  it('resolveBySlug lança NotFound quando inexistente', async () => {
    mockRepo.findBySlug.mockResolvedValue(null);
    await expect(makeService().resolveBySlug('nada')).rejects.toBeInstanceOf(NotFoundException);
  });
  it('resolveBySlug retorna o tenant', async () => {
    mockRepo.findBySlug.mockResolvedValue({ id: 't1', isActive: true });
    expect(await makeService().resolveBySlug('dra-herlania')).toMatchObject({ id: 't1' });
  });
});
