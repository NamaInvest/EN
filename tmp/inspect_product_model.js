const fs = require('fs');

const schemaPath = 'prisma/schema.prisma';
const content = fs.readFileSync(schemaPath, 'utf8');

function getModelDefinition(modelName) {
    const lines = content.split('\n');
    let insideModel = false;
    let result = [];
    for (let line of lines) {
        if (line.trim().startsWith(`model ${modelName} `) || line.trim() === `model ${modelName} {`) {
            insideModel = true;
        }
        if (insideModel) {
            result.push(line);
            if (line.trim().startsWith('}')) {
                insideModel = false;
                break;
            }
        }
    }
    return result.join('\n');
}

console.log(getModelDefinition('Product'));
