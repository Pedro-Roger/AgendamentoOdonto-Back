import { ArgumentsHost, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { DiscordService } from '../discord/discord.service';

function mockHost(request: any = { method: 'GET', url: '/x' }) {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;
  return { host, response };
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let discord: jest.Mocked<DiscordService>;

  beforeEach(() => {
    discord = { sendAlert: jest.fn().mockResolvedValue(undefined) } as any;
    filter = new AllExceptionsFilter(discord);
  });

  it('não dispara alerta Discord para 404 de rota inexistente (Cannot GET ...)', async () => {
    const exception = new NotFoundException('Cannot GET /pdown');
    const { host, response } = mockHost({ method: 'GET', url: '/pdown' });

    await filter.catch(exception, host);

    expect(discord.sendAlert).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(404);
  });

  it('dispara alerta Discord para 404 de negócio real (paciente não encontrado)', async () => {
    const exception = new NotFoundException('Paciente não encontrado');
    const { host } = mockHost({ method: 'GET', url: '/patients/123' });

    await filter.catch(exception, host);

    expect(discord.sendAlert).toHaveBeenCalledTimes(1);
    expect(discord.sendAlert).toHaveBeenCalledWith(
      expect.objectContaining({ level: 'warn' }),
    );
  });

  it('continua disparando alerta Discord para 5xx', async () => {
    const exception = new InternalServerErrorException('Falha inesperada');
    const { host } = mockHost({ method: 'POST', url: '/appointments' });

    await filter.catch(exception, host);

    expect(discord.sendAlert).toHaveBeenCalledTimes(1);
    expect(discord.sendAlert).toHaveBeenCalledWith(
      expect.objectContaining({ level: 'error' }),
    );
  });
});
