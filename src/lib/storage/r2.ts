// Stub implementation to avoid @aws-sdk/client-s3 dependency in architectural review
export class R2Storage {
  async upload(key: string, body: Buffer | Uint8Array, contentType: string): Promise<string> {
    console.log(`[R2Storage] Uploading to R2: ${key}`);
    return `https://media.namasoft.com/${key}`;
  }

  async delete(key: string): Promise<void> {
    console.log(`[R2Storage] Deleting from R2: ${key}`);
  }
}

export const r2Client = new R2Storage();
