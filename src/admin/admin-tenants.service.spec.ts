import { NotFoundException } from '@nestjs/common';
import { AdminTenantsService } from './admin-tenants.service';

const mockRepo = {
  findById: jest.fn(),
  listWithCounts: jest.fn(),
  findByIdWithCounts: jest.fn(),
  updateActive: jest.fn(),
};
const mockTenantsService = { create: jest.fn() };

function makeService() {
  return new AdminTenantsService(mockRepo as any, mockTenantsService as any);
}

describe('AdminTenantsService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('listWithCounts delega ao repositório', async () => {
    mockRepo.listWithCounts.mockResolvedValue([{ id: 't1' }]);
    expect(await makeService().listWithCounts()).toEqual([{ id: 't1' }]);
  });

  it('getByIdWithCounts lança NotFound quando a Compania não existe', async () => {
    mockRepo.findByIdWithCounts.mockResolvedValue(null);
    await expect(makeService().getByIdWithCounts('nada')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('getByIdWithCounts retorna a Compania com contagens', async () => {
    mockRepo.findByIdWithCounts.mockResolvedValue({ id: 't1', usersCount: 1 });
    expect(await makeService().getByIdWithCounts('t1')).toEqual({ id: 't1', usersCount: 1 });
  });

  it('create reaproveita TenantsService.create (mesma validação de nome/slug único)', async () => {
    mockTenantsService.create.mockResolvedValue({ id: 't-new' });
    const result = await makeService().create({ name: 'X', slug: 'x' });
    expect(mockTenantsService.create).toHaveBeenCalledWith({ name: 'X', slug: 'x' });
    expect(result).toEqual({ id: 't-new' });
  });

  it('setActive lança NotFound se a Compania não existe', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(makeService().setActive('nada', false)).rejects.toBeInstanceOf(NotFoundException);
    expect(mockRepo.updateActive).not.toHaveBeenCalled();
  });

  it('setActive desativa e retorna a Compania com contagens atualizadas', async () => {
    mockRepo.findById.mockResolvedValue({ id: 't1' });
    mockRepo.findByIdWithCounts.mockResolvedValue({ id: 't1', isActive: false, usersCount: 2 });
    const result = await makeService().setActive('t1', false);
    expect(mockRepo.updateActive).toHaveBeenCalledWith('t1', false);
    expect(result).toEqual({ id: 't1', isActive: false, usersCount: 2 });
  });
});
