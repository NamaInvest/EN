export class SubcontractingService {
  async sendToSubcontractor(woId: string, materials: any[], subcontractorId: string) {
    // Stub: Send materials to subcontractor
    return { success: true };
  }

  async receiveFromSubcontractor(woId: string, finishedGoods: any[]) {
    // Stub: Receive finished goods
    return { success: true };
  }
}
