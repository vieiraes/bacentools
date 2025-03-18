import { Test, TestingModule } from '@nestjs/testing';
import { BacenInformesController } from './bacen-informes.controller';

describe('BacenInformesController', () => {
  let controller: BacenInformesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BacenInformesController],
    }).compile();

    controller = module.get<BacenInformesController>(BacenInformesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
