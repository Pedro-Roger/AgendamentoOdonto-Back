import { Test } from '@nestjs/testing';
import { UsersModule } from './users.module';
import { UsersService } from './users.service';
import { TenantsService } from '../tenants/tenants.service';

/**
 * UsersService passou a depender de TenantsService para dar Compania própria ao dentista.
 * Se UsersModule deixar de importar TenantsModule, isso só quebraria no boot da API em
 * produção — este teste faz o grafo de DI ser resolvido no CI.
 */
describe('UsersModule — grafo de dependências', () => {
  it('resolve UsersService com TenantsService injetado', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [UsersModule] }).compile();
    const service = moduleRef.get(UsersService);
    expect(service).toBeInstanceOf(UsersService);
    expect(moduleRef.get(TenantsService, { strict: false })).toBeInstanceOf(TenantsService);
    await moduleRef.close();
  });
});
