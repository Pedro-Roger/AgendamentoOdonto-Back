import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
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

const mockTenants = { createForDentist: jest.fn() };

function makeService() {
  mockTenants.createForDentist.mockResolvedValue({ id: 'tenant-do-dentista' });
  return new UsersService(mockRepo as any, mockTenants as any);
}

describe('UsersService — USR-002 RBAC roles', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a DENTISTA user successfully — como MASTER da Compania própria', async () => {
    mockRepo.findByEmail.mockResolvedValue(null);
    mockRepo.create.mockResolvedValue({ id: '1', role: UserRole.MASTER });
    const svc = makeService();
    const result = await svc.create({
      name: 'Dr. Silva',
      email: 'silva@clinic.com',
      password: 'senha123',
      role: UserRole.DENTISTA,
    }, 't1');
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: UserRole.MASTER, tenantId: 'tenant-do-dentista' }),
    );
    expect(result).toMatchObject({ role: UserRole.MASTER });
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

describe('UsersService — SUPERADMIN não é atribuível via API (achado crítico de revisão)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('MASTER não consegue criar usuário com role SUPERADMIN', async () => {
    mockRepo.findByEmail.mockResolvedValue(null);
    const svc = makeService();
    await expect(
      svc.create(
        { name: 'Invasor', email: 'invasor@c.com', password: 'senha123', role: UserRole.SUPERADMIN },
        't1',
      ),
    ).rejects.toThrow(BadRequestException);
    expect(mockRepo.create).not.toHaveBeenCalled();
    expect(mockTenants.createForDentist).not.toHaveBeenCalled();
  });

  it('MASTER não consegue promover usuário existente para SUPERADMIN', async () => {
    mockRepo.findById.mockResolvedValue({ id: 'u1', email: 'u1@c.com', role: UserRole.ADMIN });
    const svc = makeService();
    await expect(
      svc.update('u1', { role: UserRole.SUPERADMIN }, 'me', 't1'),
    ).rejects.toThrow(BadRequestException);
    expect(mockRepo.update).not.toHaveBeenCalled();
  });
});

describe('UsersService — dentista ganha Compania própria', () => {
  beforeEach(() => jest.clearAllMocks());

  it('cria uma Compania nova para o dentista em vez de herdar a do criador', async () => {
    mockRepo.findByEmail.mockResolvedValue(null);
    mockRepo.create.mockResolvedValue({ id: 'u1', role: UserRole.DENTISTA });
    const svc = makeService();
    await svc.create(
      { name: 'Dr. Silva', email: 'silva@c.com', password: 'senha123', role: UserRole.DENTISTA },
      'tenant-da-herlania',
    );
    expect(mockTenants.createForDentist).toHaveBeenCalledWith('Dr. Silva');
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-do-dentista' }),
    );
  });

  it('entra na Compania própria como MASTER, para poder administrar o próprio consultório', async () => {
    mockRepo.findByEmail.mockResolvedValue(null);
    mockRepo.create.mockResolvedValue({ id: 'u1', role: UserRole.MASTER });
    const svc = makeService();
    await svc.create(
      { name: 'Dr. Silva', email: 'silva@c.com', password: 'senha123', role: UserRole.DENTISTA },
      'tenant-da-herlania',
    );
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: UserRole.MASTER, tenantId: 'tenant-do-dentista' }),
    );
  });

  it.each([UserRole.RECEPCIONISTA, UserRole.ADMIN, UserRole.MASTER])(
    '%s continua na Compania de quem criou',
    async (role) => {
      mockRepo.findByEmail.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue({ id: 'u2', role });
      const svc = makeService();
      await svc.create(
        { name: 'Equipe', email: `${role}@c.com`, password: 'senha123', role },
        'tenant-da-herlania',
      );
      expect(mockTenants.createForDentist).not.toHaveBeenCalled();
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-da-herlania' }),
      );
    },
  );

  it('não cria Compania órfã quando o email já existe', async () => {
    mockRepo.findByEmail.mockResolvedValue({ id: 'existente' });
    const svc = makeService();
    await expect(
      svc.create(
        { name: 'Dr. Silva', email: 'dup@c.com', password: 'senha123', role: UserRole.DENTISTA },
        't1',
      ),
    ).rejects.toThrow(ConflictException);
    expect(mockTenants.createForDentist).not.toHaveBeenCalled();
  });

  it('bloqueia promover usuário existente a DENTISTA (recriaria o vazamento)', async () => {
    mockRepo.findById.mockResolvedValue({ id: 'u1', email: 'u1@c.com', role: UserRole.RECEPCIONISTA });
    const svc = makeService();
    await expect(
      svc.update('u1', { role: UserRole.DENTISTA }, 'me', 't1'),
    ).rejects.toThrow(BadRequestException);
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('permite atualizar um dentista sem mexer no papel', async () => {
    mockRepo.findById.mockResolvedValue({ id: 'u1', email: 'u1@c.com', role: UserRole.DENTISTA });
    mockRepo.update.mockResolvedValue({ id: 'u1' });
    const svc = makeService();
    await svc.update('u1', { role: UserRole.DENTISTA, name: 'Dr. Silva' }, 'me', 't1');
    expect(mockRepo.update).toHaveBeenCalled();
  });
});

describe('UsersService — tenant isolation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('list calls listSafe scoped to the tenantId', async () => {
    mockRepo.listSafe.mockResolvedValue([]);
    const svc = makeService();
    await svc.list('t1');
    expect(mockRepo.listSafe).toHaveBeenCalledWith('t1');
  });

  it('update on a target in another tenant returns NotFound', async () => {
    mockRepo.findById.mockResolvedValue(null);
    const svc = makeService();
    await expect(
      svc.update('u9', { name: 'New' }, 'me', 't1'),
    ).rejects.toThrow(NotFoundException);
    expect(mockRepo.findById).toHaveBeenCalledWith('u9', 't1');
  });

  it('update threads tenantId into findById and repo.update', async () => {
    mockRepo.findById.mockResolvedValue({ id: 'u1', email: 'u1@c.com', role: UserRole.DENTISTA });
    mockRepo.update.mockResolvedValue({ id: 'u1' });
    const svc = makeService();
    await svc.update('u1', { name: 'Novo Nome' }, 'me', 't1');
    expect(mockRepo.findById).toHaveBeenCalledWith('u1', 't1');
    expect(mockRepo.update).toHaveBeenCalledWith('u1', { name: 'Novo Nome' }, 't1');
  });
});
