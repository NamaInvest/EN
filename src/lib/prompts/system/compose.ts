import { BASE_PERSONA } from './personas/base.persona';
import { CFO_PERSONA } from './personas/cfo.persona';

export type PersonaType = 'cfo' | 'auditor' | 'copilot' | 'nlq' | 'fraud' | 'ocr' | 'procurement' | 'hr';

export function composeSystemPrompt(
  persona: PersonaType,
  variables: Record<string, string>
): string {
  let promptTemplate = '';

  switch (persona) {
    case 'cfo':
      promptTemplate = CFO_PERSONA;
      break;
    default:
      promptTemplate = BASE_PERSONA;
      break;
  }

  let finalPrompt = promptTemplate;
  for (const [k, v] of Object.entries(variables)) {
    const regex = new RegExp(`{{${k}}}`, 'g');
    finalPrompt = finalPrompt.replace(regex, v || '');
  }

  return finalPrompt;
}
