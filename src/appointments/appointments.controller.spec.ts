import { AppointmentsController } from './appointments.controller';

const mockService = {
  findByDateRange: jest.fn(),
  listByDate: jest.fn(),
  createInternal: jest.fn().mockResolvedValue({ id: 'a1' }),
  availability: jest.fn().mockResolvedValue([]),
};
function makeController() { return new AppointmentsController(mockService as any); }

describe('AppointmentsController — autenticado por tenant', () => {
  it('cria consulta no tenant do usuário', async () => {
    const user = { tenantId: 't1' } as any;
    const dto: any = { name: 'A', cpf: '1', email: 'a@b.com', phone: '9', serviceId: 's1', date: '2026-06-18', time: '09:00', anamnesisAnswers: [] };
    await makeController().create(user, dto);
    expect(mockService.createInternal).toHaveBeenCalledWith('t1', dto);
  });
  it('lista disponibilidade no tenant do usuário', async () => {
    const user = { tenantId: 't1' } as any;
    await makeController().availability(user, 's1', '2026-06-18');
    expect(mockService.availability).toHaveBeenCalledWith('t1', 's1', '2026-06-18');
  });
});
