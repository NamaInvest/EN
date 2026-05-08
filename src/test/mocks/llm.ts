export class MockLLM {
  responses: Map<string, string> = new Map();

  setResponse(promptPattern: string, response: string) {
    this.responses.set(promptPattern, response);
  }

  async invoke(prompt: string): Promise<{ content: string }> {
    for (const [pattern, response] of this.responses) {
      if (prompt.includes(pattern)) return { content: response };
    }
    return { content: 'default mock response' };
  }
}
