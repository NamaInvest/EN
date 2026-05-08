import { z } from 'zod';
import { Chain } from '../base/chain.interface';

export const intentRouterChain: Chain<any, any> = {
  name: 'router.intent',
  description: 'يصنّف نية المستخدم ويوجّهه للـ chain المناسب',
  inputSchema: z.object({ message: z.string() }),
  outputSchema: z.object({ text: z.string() }),

  async execute(input, ctx) {
    // Dummy logic
    const category = 'question';
    
    switch (category) {
      case 'question':
        return { text: 'إجابة على سؤالك من المراجع' };
      default:
        return { text: 'لم أفهم طلبك، يرجى إعادة الصياغة.' };
    }
  },
};
