import { Test } from '@nestjs/testing';
import { AdminModule } from './admin.module';
import { AdminTenantsService } from './admin-tenants.service';
import { TENANTS_REPOSITORY } from '../tenants/repositories/tenants.repository.interface';

/**
 * AdminTenantsService depende de TENANTS_REPOSITORY (exportado por TenantsModule) e de
 * TenantsService. Se qualquer um dos dois deixar de ser exportado/importado, isso só quebraria
 * no boot da API em produção — este teste resolve o grafo de DI no CI, mesmo padrão de
 * `users.module.spec.ts`.
 */
describe('AdminModule — grafo de dependências', () => {
  it('resolve AdminTenantsService com TENANTS_REPOSITORY injetado', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AdminModule] }).compile();
    const service = moduleRef.get(AdminTenantsService);
    expect(service).toBeInstanceOf(AdminTenantsService);
    expect(moduleRef.get(TENANTS_REPOSITORY, { strict: false })).toBeDefined();
    await moduleRef.close();
  });
});
