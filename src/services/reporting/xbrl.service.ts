export class XbrlExportService {
  async exportXbrl(periodId: string) {
    return { xbrlData: '<xbrl></xbrl>' };
  }
}
