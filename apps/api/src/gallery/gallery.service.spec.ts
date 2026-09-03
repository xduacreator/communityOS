import { GalleryService } from './gallery.service';

describe('GalleryService', () => {
  let service: GalleryService;

  beforeEach(() => {
    service = new GalleryService({} as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
