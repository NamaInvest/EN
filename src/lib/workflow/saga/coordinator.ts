export interface SagaStep<T = any> {
  name: string;
  execute: (ctx: T) => Promise<T>;
  compensate: (ctx: T) => Promise<void>;
}

export class Saga<T> {
  private steps: SagaStep<T>[] = [];
  private executed: SagaStep<T>[] = [];
  public name: string = 'UntitledSaga';

  addStep(step: SagaStep<T>): this {
    this.steps.push(step);
    return this;
  }

  async run(initialContext: T): Promise<T> {
    let ctx = initialContext;

    try {
      for (const step of this.steps) {
        console.log(`Saga step: ${step.name}`);
        ctx = await step.execute(ctx);
        this.executed.push(step);
      }
      return ctx;
    } catch (error) {
      console.error(`Saga failed at step. Compensating...`, { error });
      for (const step of this.executed.reverse()) {
        try {
          await step.compensate(ctx);
        } catch (compErr) {
          console.error(`Compensation failed: ${step.name}`, { compErr });
        }
      }
      throw error;
    }
  }

  /** Alias for run() — preferred for API route callers */
  execute(initialContext: T): Promise<T> {
    return this.run(initialContext);
  }
}
