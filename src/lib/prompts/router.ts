import fs from 'fs';
import path from 'path';

export interface PromptIntent {
  id: string;
  role: string;
  intent: string;
  system_prompt: string;
  user_template: string;
  required_context_files: string[];
  tools_allowed: string[];
  expected_output_schema: string;
  saudi_compliance_tags: string[];
}

export interface ModuleCatalog {
  module: string;
  prompts: PromptIntent[];
}

export class PromptRouter {
  private catalogs: Map<string, ModuleCatalog> = new Map();

  constructor() {
    this.loadCatalogs();
  }

  private loadCatalogs() {
    const promptsDir = path.join(process.cwd(), 'src/lib/prompts');
    if (!fs.existsSync(promptsDir)) return;

    const modules = fs.readdirSync(promptsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const mod of modules) {
      const catalogPath = path.join(promptsDir, mod, 'catalog.json');
      if (fs.existsSync(catalogPath)) {
        try {
          const content = fs.readFileSync(catalogPath, 'utf8');
          const catalog: ModuleCatalog = JSON.parse(content);
          this.catalogs.set(mod, catalog);
        } catch (error) {
          console.error(`Failed to load prompt catalog for module ${mod}:`, error);
        }
      }
    }
  }

  public getPrompt(moduleName: string, intent: string): PromptIntent | null {
    const catalog = this.catalogs.get(moduleName);
    if (!catalog) return null;

    return catalog.prompts.find(p => p.intent.toUpperCase() === intent.toUpperCase()) || null;
  }

  public getMasterSystemPrompt(): string {
    const masterPath = path.join(process.cwd(), 'src/lib/prompts/system.master.md');
    if (fs.existsSync(masterPath)) {
      return fs.readFileSync(masterPath, 'utf8');
    }
    return '';
  }

  public listAvailableIntents(moduleName: string): string[] {
    const catalog = this.catalogs.get(moduleName);
    if (!catalog) return [];
    return catalog.prompts.map(p => p.intent);
  }
}

export const promptRouter = new PromptRouter();
