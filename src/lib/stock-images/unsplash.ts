import { logger } from '@/lib/logger';

const log = logger.child({ service: 'Unsplash' });

export interface StockImage {
  id: string;
  url: string;
  thumbnail: string;
  width: number;
  height: number;
  alt: string;
  author: string;
  authorUrl: string;
}

export class UnsplashService {
  private apiKey = process.env.UNSPLASH_ACCESS_KEY || 'dummy_key';

  async search(query: string, options: { perPage?: number } = {}): Promise<StockImage[]> {
    log.info(`[Unsplash] Searching for ${query}`);
    // Stub Unsplash API call
    return [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1',
        thumbnail: 'https://images.unsplash.com/photo-1?w=200',
        width: 1920,
        height: 1080,
        alt: `Stock image for ${query}`,
        author: 'John Doe',
        authorUrl: 'https://unsplash.com/@johndoe',
      }
    ];
  }

  async download(imageId: string): Promise<Buffer> {
    log.info(`[Unsplash] Downloading image ${imageId}`);
    return Buffer.from('stub_downloaded_image_data');
  }
}
