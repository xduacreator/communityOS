import { UserController } from './user.controller';

describe('UserController', () => {
  let controller: UserController;

  beforeEach(() => {
    controller = new UserController({} as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
