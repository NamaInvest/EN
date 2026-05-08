export interface SagaStep<T = any> {
  name: string;
  execute: (ctx: T) => Promise<T>;
  compensate: (ctx: T) => Promise<void>;
}

export class Saga<T> {
  private steps: SagaStep<T>[] = [];
  private executed: SagaStep<T>[] = [];

  constructor(public readonly name: string) {}

  addStep(step: SagaStep<T>): this {
    this.steps.push(step);
    return this;
  }

  async run(initialContext: T): Promise<T> {
    let ctx = initialContext;

    try {
      for (const step of this.steps) {
        console.log(`[Saga: ${this.name}] Executing step: ${step.name}`);
        ctx = await step.execute(ctx);
        this.executed.push(step);
      }
      return ctx;
    } catch (error: any) {
      console.error(`[Saga: ${this.name}] Failed at step. Starting compensation...`, error);
      
      // Execute compensation steps in reverse order
      for (const step of this.executed.reverse()) {
        try {
          console.log(`[Saga: ${this.name}] Compensating step: ${step.name}`);
          await step.compensate(ctx);
        } catch (compErr) {
          console.error(`[Saga: ${this.name}] Compensation failed for step: ${step.name}`, compErr);
          // In a real system, you'd alert an operator or write to a Dead Letter Queue
        }
      }
      throw error; // Re-throw original error after compensation
    }
  }
}
