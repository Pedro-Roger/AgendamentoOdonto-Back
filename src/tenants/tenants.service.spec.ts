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
  it('createForDentist gera slug a partir do nome', async () => {
    mockRepo.findBySlug.mockResolvedValue(null);
    mockRepo.create.mockResolvedValue({ id: 't2', slug: 'dr-silva' });
    await makeService().createForDentist('Dr. Silva');
    expect(mockRepo.create).toHaveBeenCalledWith({ name: 'Dr. Silva', slug: 'dr-silva' });
  });

  it('createForDentist desambigua slug de homônimo em vez de falhar', async () => {
    mockRepo.findBySlug
      .mockResolvedValueOnce({ id: 't1' })
      .mockResolvedValueOnce({ id: 't2' })
      .mockResolvedValueOnce(null);
    mockRepo.create.mockResolvedValue({ id: 't3' });
    await makeService().createForDentist('Dr. Silva');
    expect(mockRepo.create).toHaveBeenCalledWith({ name: 'Dr. Silva', slug: 'dr-silva-3' });
  });

  it('createForDentist rejeita nome vazio', async () => {
    await expect(makeService().createForDentist('   ')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('resolveBySlug lança NotFound quando inexistente', async () => {
    mockRepo.findBySlug.mockResolvedValue(null);
    await expect(makeService().resolveBySlug('nada')).rejects.toBeInstanceOf(NotFoundException);
  });
  it('resolveBySlug retorna o tenant', async () => {
    mockRepo.findBySlug.mockResolvedValue({ id: 't1', isActive: true });
    expect(await makeService().resolveBySlug('dra-herlania')).toMatchObject({ id: 't1' });
  });
  it('resolveBySlug lança NotFound quando a Compania está desativada (booking público para de funcionar)', async () => {
    mockRepo.findBySlug.mockResolvedValue({ id: 't1', isActive: false });
    await expect(makeService().resolveBySlug('dra-herlania')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findById delega ao repositório', async () => {
    mockRepo.findById.mockResolvedValue({ id: 't1' });
    expect(await makeService().findById('t1')).toEqual({ id: 't1' });
    expect(mockRepo.findById).toHaveBeenCalledWith('t1');
  });
});
