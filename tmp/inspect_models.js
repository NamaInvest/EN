const fs = require('fs');

const schemaPath = 'prisma/schema.prisma';
const content = fs.readFileSync(schemaPath, 'utf8');

const targetModels = [
    'SalesInvoice',
    'EventLog',
    'SalesOrder',
    'WmsTask',
    'Q2CJourney',
    'P2PJourney',
    'O2DJourney'
];

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

for (const model of targetModels) {
    console.log(`\n=========================================\nMODEL: ${model}\n=========================================`);
    const def = getModelDefinition(model);
    if (def) {
        console.log(def);
    } else {
        console.log('Not found in schema.');
    }
}
