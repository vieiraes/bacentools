import { Test, TestingModule } from '@nestjs/testing';
import { BacenInformesService } from './bacen-informes.service';

describe('BacenInformesService', () => {
  let service: BacenInformesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BacenInformesService],
    }).compile();

    service = module.get<BacenInformesService>(BacenInformesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
