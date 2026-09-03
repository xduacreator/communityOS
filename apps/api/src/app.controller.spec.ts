import { Test, TestingModule } from '@nestjs/testing';
import { AppController, detectImageExtension } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('returns the service greeting', () => {
    expect(appController.getHello()).toBe('Hello World!');
  });
});

describe('image signature validation', () => {
  it.each([
    [Buffer.from([0xff, 0xd8, 0xff, 0x00]), '.jpg'],
    [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), '.png'],
    [Buffer.from('GIF89a', 'ascii'), '.gif'],
    [Buffer.from('RIFF0000WEBP', 'ascii'), '.webp'],
  ])('recognizes supported image bytes', (buffer, extension) => {
    expect(detectImageExtension(buffer)).toBe(extension);
  });

  it('rejects HTML disguised as an image', () => {
    expect(
      detectImageExtension(Buffer.from('<script>alert(1)</script>')),
    ).toBeNull();
  });
});
