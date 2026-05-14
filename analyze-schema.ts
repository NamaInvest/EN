import fs from 'fs';

const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

const models: any = {};
let currentModel = '';

for (const line of schema.split('\n')) {
  if (line.startsWith('model ')) {
    currentModel = line.split(' ')[1];
    models[currentModel] = { hasNameAr: false, hasIsActive: false, hasActive: false, hasNameEn: false };
  } else if (currentModel) {
    if (line.trim().startsWith('nameAr ')) models[currentModel].hasNameAr = true;
    if (line.trim().startsWith('isActive ')) models[currentModel].hasIsActive = true;
    if (line.trim().startsWith('active ')) models[currentModel].hasActive = true;
    if (line.trim().startsWith('nameEn ')) models[currentModel].hasNameEn = true;
  }
}

const nameArModels = Object.keys(models).filter(m => models[m].hasNameAr);
const isActiveModels = Object.keys(models).filter(m => models[m].hasIsActive);
const activeModels = Object.keys(models).filter(m => models[m].hasActive);

console.log('Models with nameAr:', nameArModels.join(', '));
console.log('Models with isActive:', isActiveModels.join(', '));
console.log('Models with active:', activeModels.join(', '));
