# 1️⃣4️⃣ Shutterstock / Media & Assets | الوسائط والأصول

## 🔍 الحالة الحالية

### 🔴 الفجوات
- لا CDN
- لا تحسين تلقائي للصور
- صور الـ stock غير منظّمة
- Next.js Image Optimization غير مفعّل بشكل صحيح
- لا Asset Library صفحة admin
- لا Watermark service للفواتير
- لا lazy loading + blur placeholders

---

## 🎯 الخطة التفصيلية

### المرحلة 14.1 — CDN Setup (3 أيام)

#### Cloudflare R2 + CDN
```bash
# .env additions
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=namasoft-media
R2_PUBLIC_URL=https://media.namasoft.com
```

```typescript
// src/lib/storage/r2.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export class R2Storage {
  async upload(key: string, body: Buffer | Uint8Array, contentType: string): Promise<string> {
    await r2Client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }));
    return `${process.env.R2_PUBLIC_URL}/${key}`;
  }

  async delete(key: string): Promise<void> {
    await r2Client.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    }));
  }
}
```

---

### المرحلة 14.2 — Next.js Image Optimization (1 يوم)

```typescript
// next.config.ts
const config: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'media.namasoft.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
  },
};
```

```typescript
// src/components/ui/Image.tsx
import NextImage from 'next/image';
import { useState } from 'react';

interface ImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
}

export function Image({ src, alt, width, height, fill, priority, className }: ImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={cn('relative overflow-hidden bg-gray-100', className)}>
      <NextImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        priority={priority}
        onLoad={() => setIsLoading(false)}
        className={cn(
          'transition-opacity duration-500',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-gray-200" />
      )}
    </div>
  );
}
```

---

### المرحلة 14.3 — Asset Upload Pipeline (3 أيام)

```typescript
// src/lib/storage/upload-pipeline.ts
import sharp from 'sharp';

export class AssetUploadPipeline {
  constructor(private r2: R2Storage) {}

  async uploadImage(
    file: File,
    options: {
      tenantId: string;
      category: 'logo' | 'product' | 'avatar' | 'banner' | 'document';
      maxWidth?: number;
      generateThumbnail?: boolean;
    }
  ): Promise<UploadedAsset> {
    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Resize + optimize
    const optimized = await sharp(buffer)
      .resize(options.maxWidth || 1920, null, { withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    // 2. Generate variants
    const variants: Record<string, Buffer> = { original: optimized };

    if (options.generateThumbnail) {
      variants.thumbnail = await sharp(buffer)
        .resize(200, 200, { fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();
    }

    // 3. Upload all variants
    const baseKey = `${options.tenantId}/${options.category}/${cuid()}`;
    const urls: Record<string, string> = {};

    for (const [variant, data] of Object.entries(variants)) {
      const key = `${baseKey}/${variant}.webp`;
      urls[variant] = await this.r2.upload(key, data, 'image/webp');
    }

    // 4. Persist metadata
    const asset = await prisma.asset.create({
      data: {
        tenantId: options.tenantId,
        category: options.category,
        originalName: file.name,
        mimeType: 'image/webp',
        sizeBytes: optimized.length,
        urls,
        metadata: { width: options.maxWidth, generatedAt: new Date() },
      },
    });

    return { id: asset.id, urls };
  }

  async uploadDocument(
    file: File,
    options: { tenantId: string; type: string }
  ): Promise<UploadedAsset> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `${options.tenantId}/documents/${options.type}/${cuid()}-${file.name}`;
    const url = await this.r2.upload(key, buffer, file.type);

    const asset = await prisma.asset.create({
      data: {
        tenantId: options.tenantId,
        category: 'document',
        originalName: file.name,
        mimeType: file.type,
        sizeBytes: buffer.length,
        urls: { original: url },
      },
    });

    return { id: asset.id, urls: { original: url } };
  }
}
```

---

### المرحلة 14.4 — Asset Library UI (5 أيام)

```typescript
// src/app/(dashboard)/admin/assets/page.tsx
export default function AssetLibraryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">مكتبة الأصول</h1>

      <Tabs defaultValue="logos">
        <TabsList>
          <TabsTrigger value="logos">الشعارات</TabsTrigger>
          <TabsTrigger value="products">صور المنتجات</TabsTrigger>
          <TabsTrigger value="banners">البانرات</TabsTrigger>
          <TabsTrigger value="documents">المستندات</TabsTrigger>
        </TabsList>

        <TabsContent value="logos">
          <AssetGrid category="logo" />
        </TabsContent>
        {/* ... */}
      </Tabs>

      <UploadZone onUpload={handleUpload} accept="image/*" />
    </div>
  );
}

// src/components/assets/AssetGrid.tsx
export function AssetGrid({ category }: { category: string }) {
  const { data, isLoading } = useAssets(category);

  if (isLoading) return <SkeletonGrid count={12} />;
  if (!data?.length) return <EmptyState title="لا توجد أصول" />;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {data.map(asset => (
        <AssetCard key={asset.id} asset={asset} />
      ))}
    </div>
  );
}
```

---

### المرحلة 14.5 — Stock Images Integration (3 أيام)

```typescript
// src/lib/stock-images/unsplash.ts
export class UnsplashService {
  private apiKey = process.env.UNSPLASH_ACCESS_KEY;

  async search(query: string, options: { perPage?: number } = {}): Promise<StockImage[]> {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${options.perPage || 20}`,
      { headers: { Authorization: `Client-ID ${this.apiKey}` } }
    );

    const data = await response.json();
    return data.results.map((img: any) => ({
      id: img.id,
      url: img.urls.regular,
      thumbnail: img.urls.small,
      width: img.width,
      height: img.height,
      alt: img.alt_description,
      author: img.user.name,
      authorUrl: img.user.links.html,
    }));
  }

  async download(imageId: string): Promise<Buffer> {
    // Fetch with download tracking
    const meta = await fetch(`https://api.unsplash.com/photos/${imageId}/download`, {
      headers: { Authorization: `Client-ID ${this.apiKey}` },
    });
    const { url } = await meta.json();

    const response = await fetch(url);
    return Buffer.from(await response.arrayBuffer());
  }
}
```

---

### المرحلة 14.6 — Watermark Service (2 أيام)

```typescript
// src/lib/storage/watermark.ts
import sharp from 'sharp';

export class WatermarkService {
  async addWatermark(
    imageBuffer: Buffer,
    options: {
      text?: string;
      logoPath?: string;
      position?: 'center' | 'bottom-right';
      opacity?: number;
    }
  ): Promise<Buffer> {
    let composite: any[] = [];

    if (options.text) {
      const svg = `
        <svg width="600" height="100" xmlns="http://www.w3.org/2000/svg">
          <text x="50%" y="50%" text-anchor="middle" dy=".3em"
                font-family="Arial" font-size="48" fill="white"
                opacity="${options.opacity || 0.3}">
            ${options.text}
          </text>
        </svg>
      `;
      composite.push({
        input: Buffer.from(svg),
        gravity: options.position === 'center' ? 'center' : 'southeast',
      });
    }

    if (options.logoPath) {
      composite.push({
        input: options.logoPath,
        gravity: options.position === 'center' ? 'center' : 'southeast',
        opacity: options.opacity || 0.3,
      });
    }

    return await sharp(imageBuffer).composite(composite).toBuffer();
  }
}

// الاستخدام للفواتير
const watermarked = await watermarkService.addWatermark(invoicePdfBuffer, {
  text: 'نسخة للعميل',
  position: 'center',
  opacity: 0.15,
});
```

---

## 📊 المخرجات

| المقياس | قبل | بعد |
|---------|-----|-----|
| CDN | لا | Cloudflare R2 |
| Image format | JPEG/PNG | WebP/AVIF auto |
| Lazy loading | لا | كل الصور |
| Blur placeholders | لا | كل الصور |
| Asset Library | لا | UI كامل |
| Stock images | لا | Unsplash API |
| Watermark | لا | للفواتير |
| Bundle size reduction | — | ~30% |

---

## ⏱️ الجدول الزمني
- **المدة:** 17 يوم عمل
- **الفريق:** 1 frontend + 1 backend
- **الأولوية:** 🟢 منخفضة

---

## ✅ معايير القبول
- [ ] R2 bucket فعّال + CDN domain
- [ ] كل الصور WebP/AVIF
- [ ] Lighthouse Performance > 90
- [ ] Asset Library UI متاح
- [ ] Unsplash integration فعّالة
- [ ] Watermark على invoice PDFs
