import { Project, SyntaxKind } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';

const project = new Project();
project.addSourceFilesAtPaths('src/app/api/**/*.ts');

let count = 0;

for (const sourceFile of project.getSourceFiles()) {
  let modified = false;

  const varDecls = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
  for (const decl of varDecls) {
    if (decl.getName() === 'tenant') {
      const parent = decl.getParentIfKind(SyntaxKind.VariableDeclarationList);
      if (parent) {
        // Only remove if it's inside a function body and not a parameter or destructure that we need
        // Actually, if it's `const tenant = searchParams.get('tenantId');` we can just remove the parent Statement
        const stmt = parent.getParentIfKind(SyntaxKind.VariableStatement);
        if (stmt) {
          stmt.remove();
          modified = true;
          continue;
        }
      }
    }
  }

  // Also remove `const { tenant } = await req.json();` or `const { tenant } = body;`
  // This is tricky using AST if there are other variables in destructuring.
  // Instead, let's use a targeted regex for the remaining files, since we know exactly what they look like.
}
