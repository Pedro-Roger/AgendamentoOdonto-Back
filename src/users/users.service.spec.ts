import { BadRequestException, ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRole } from '../common/enums/user-role.enum';

const mockRepo = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  countAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  listSafe: jest.fn(),
};

function makeService() {
  return new UsersService(mockRepo as any);
}

describe('UsersService — USR-002 RBAC roles', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a DENTISTA user successfully', async () => {
    mockRepo.findByEmail.mockResolvedValue(null);
    mockRepo.create.mockResolvedValue({ id: '1', role: UserRole.DENTISTA });
    const svc = makeService();
    const result = await svc.create({
      name: 'Dr. Silva',
      email: 'silva@clinic.com',
      password: 'senha123',
      role: UserRole.DENTISTA,
    }, 't1');
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: UserRole.DENTISTA, tenantId: 't1' }),
    );
    expect(result).toMatchObject({ role: UserRole.DENTISTA });
  });

  it('creates a RECEPCIONISTA user successfully', async () => {
    mockRepo.findByEmail.mockResolvedValue(null);
    mockRepo.create.mockResolvedValue({ id: '2', role: UserRole.RECEPCIONISTA });
    const svc = makeService();
    await svc.create({
      name: 'Ana Recep',
      email: 'ana@clinic.com',
      password: 'senha123',
      role: UserRole.RECEPCIONISTA,
    }, 't1');
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: UserRole.RECEPCIONISTA }),
    );
  });

  it('still creates MASTER and ADMIN users', async () => {
    mockRepo.findByEmail.mockResolvedValue(null);
    mockRepo.create.mockResolvedValue({ id: '3', role: UserRole.MASTER });
    const svc = makeService();
    await svc.create({ name: 'M', email: 'm@c.com', password: 'senha123', role: UserRole.MASTER }, 't1');
    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ role: UserRole.MASTER }));
  });

  it('throws ConflictException for duplicate email regardless of role', async () => {
    mockRepo.findByEmail.mockResolvedValue({ id: 'existing' });
    const svc = makeService();
    await expect(
      svc.create({ name: 'X', email: 'dup@c.com', password: 'senha123', role: UserRole.DENTISTA }, 't1'),
    ).rejects.toThrow(ConflictException);
  });

  it('throws BadRequestException for short password', async () => {
    mockRepo.findByEmail.mockResolvedValue(null);
    const svc = makeService();
    await expect(
      svc.create({ name: 'X', email: 'x@c.com', password: '123', role: UserRole.DENTISTA }, 't1'),
    ).rejects.toThrow(BadRequestException);
  });
});
