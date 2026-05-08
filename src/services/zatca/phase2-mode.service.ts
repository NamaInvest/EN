export class ZATCAPhase2ModeService {
  async determineMode(invoice: any) {
    return { mode: 'STANDARD' }; // or SIMPLIFIED
  }
}
