"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const api_keys_service_1 = require("./api-keys.service");
const crypto = __importStar(require("crypto"));
const mockRepo = {
    create: jest.fn(),
    listByTenant: jest.fn().mockResolvedValue([]),
    findByHash: jest.fn(),
    revoke: jest.fn(),
    touch: jest.fn(),
};
function makeService() {
    return new api_keys_service_1.ApiKeysService(mockRepo);
}
describe('ApiKeysService', () => {
    beforeEach(() => jest.clearAllMocks());
    it('gera chave, guarda hash e retorna a chave em claro uma vez', async () => {
        mockRepo.create.mockResolvedValue({ id: 'k1', prefix: 'abcd1234' });
        const result = await makeService().create('t1', { name: 'Site', allowedOrigins: [] });
        expect(result.plaintextKey).toMatch(/^sk_/);
        const dataArg = mockRepo.create.mock.calls[0][0];
        expect(dataArg.keyHash).toBeDefined();
        expect(dataArg.keyHash).not.toContain(result.plaintextKey);
        expect(dataArg.tenantId).toBe('t1');
    });
    it('valida uma chave correta retornando o tenant', async () => {
        const key = 'sk_teste123';
        const hash = crypto.createHash('sha256').update(key).digest('hex');
        mockRepo.findByHash.mockResolvedValue({ id: 'k1', tenantId: 't1', revokedAt: null, allowedOrigins: [] });
        const found = await makeService().validate(key);
        expect(mockRepo.findByHash).toHaveBeenCalledWith(hash);
        expect(found).toMatchObject({ tenantId: 't1' });
    });
    it('rejeita chave revogada', async () => {
        mockRepo.findByHash.mockResolvedValue({ id: 'k1', tenantId: 't1', revokedAt: new Date() });
        expect(await makeService().validate('sk_x')).toBeNull();
    });
});
//# sourceMappingURL=api-keys.service.spec.js.map