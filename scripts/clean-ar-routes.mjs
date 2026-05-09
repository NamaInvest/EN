import { readFileSync, writeFileSync } from 'fs';

function cleanRoute(filePath) {
  let c = readFileSync(filePath, 'utf8');
  const orig = c;
  
  // Remove the injected Zod validation block that was mistakenly added to _POST/_GET:
  // Pattern:
  //   const body = await req.json().catch(() => ({}));
  //   const parsed = SomeSchema.safeParse(body);
  //   if (!parsed.success) { return NextResponse.json(...); }
  //   const data = parsed.data;
  const zodBlockPattern = /\n[ \t]*const body = await req\.json\(\)\.catch\([^;]+;\n[ \t]*const parsed = \w+\.safeParse\(body\);\n[ \t]*if \(!parsed\.success\) \{[^}]+\}\n[ \t]*const data = parsed\.data;\n/g;
  c = c.replace(zodBlockPattern, '\n');
  
  if (c !== orig) {
    writeFileSync(filePath, c, 'utf8');
    console.log('Fixed:', filePath);
  } else {
    console.log('No match:', filePath);
  }
}

cleanRoute('src/app/api/ar/credit/route.ts');
cleanRoute('src/app/api/ar/dunning/route.ts');
