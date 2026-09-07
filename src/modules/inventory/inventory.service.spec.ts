import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../../database/prisma.service';

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: { uom: { findMany: jest.Mock; findUnique: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      uom: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation((args) => Promise.resolve({ id: '1', ...args.data })),
        update: jest.fn().mockImplementation((args) => Promise.resolve({ id: args.where.id, ...args.data })),
        delete: jest.fn().mockImplementation((args) => Promise.resolve({ id: args.where.id })),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUom', () => {
    it('should create a new UoM', async () => {
      const dto = { code: 'KG', name: 'Kilogram', type: 'WEIGHT' };
      const result = await service.createUom(dto);
      expect(result).toBeDefined();
      expect(result.code).toBe('KG');
    });

    it('should throw ConflictException for duplicate code', async () => {
      prisma.uom.findUnique.mockResolvedValue({ id: '1', code: 'KG' });
      await expect(service.createUom({ code: 'KG', name: 'Kilogram', type: 'WEIGHT' }))
        .rejects.toThrow('already exists');
    });
  });

  describe('findAllUoms', () => {
    it('should return empty array when no UoMs exist', async () => {
      const result = await service.findAllUoms();
      expect(result).toEqual([]);
    });
  });
});
