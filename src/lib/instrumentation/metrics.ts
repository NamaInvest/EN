// Stub for Prometheus metrics
export const httpRequestsTotal = {
  inc: (labels?: any) => { /* console.log('httpRequestsTotal.inc', labels); */ }
};

export const httpRequestDuration = {
  observe: (labels: any, value: number) => { /* ... */ }
};

export const journalEntriesPosted = {
  inc: (labels?: any) => { /* ... */ }
};

export const llmTokensConsumed = {
  inc: (labels?: any) => { /* ... */ }
};

export const queueJobsActive = {
  set: (labels: any, value: number) => { /* ... */ }
};

export const register = {
  contentType: 'text/plain; version=0.0.4',
  metrics: async () => '# HELP mock_metrics Mocked metrics\n# TYPE mock_metrics counter\nmock_metrics 1\n'
};
