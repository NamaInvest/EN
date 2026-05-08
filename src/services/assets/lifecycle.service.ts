export class AssetLifecycleService {
  async capitalizeAsset(poId: string) {
    return { assetId: 'ast-1' };
  }
  async disposeAsset(assetId: string) {
    return { success: true };
  }
}
