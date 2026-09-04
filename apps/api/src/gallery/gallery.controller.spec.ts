import { GalleryController } from './gallery.controller';

describe('GalleryController', () => {
  let controller: GalleryController;

  beforeEach(() => {
    controller = new GalleryController({} as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
