const fs = require('fs');

function parseSchema(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const models = {};
    let currentModel = null;

    for (let line of lines) {
        line = line.trim();
        if (line.startsWith('model ')) {
            const modelName = line.split(' ')[1];
            currentModel = modelName;
            models[currentModel] = { fields: {}, attributes: [] };
        } else if (line.startsWith('}')) {
            currentModel = null;
        } else if (currentModel && line.length > 0) {
            if (line.startsWith('@@')) {
                models[currentModel].attributes.push(line);
            } else if (!line.startsWith('//')) {
                // It's a field
                // split by whitespace
                const parts = line.split(/\s+/);
                const fieldName = parts[0];
                const fieldType = parts[1];
                if (fieldName && fieldType) {
                    models[currentModel].fields[fieldName] = line;
                }
            }
        }
    }
    return models;
}

const localSchema = parseSchema('prisma/schema.prisma');
const serverSchema = parseSchema('tmp/server_schema.prisma');

console.log('Comparing local schema vs server schema...');

const localModels = Object.keys(localSchema);
const serverModels = Object.keys(serverSchema);

// Find missing models
const missingOnServer = localModels.filter(m => !serverSchema[m]);
const extraOnServer = serverModels.filter(m => !localSchema[m]);

if (missingOnServer.length > 0) {
    console.log('\n❌ Models missing on server:', missingOnServer);
} else {
    console.log('\n✅ No models missing on server.');
}

if (extraOnServer.length > 0) {
    console.log('\n⚠️ Extra models on server:', extraOnServer);
}

// Find field differences in common models
for (const model of localModels) {
    if (serverSchema[model]) {
        const localFields = localSchema[model].fields;
        const serverFields = serverSchema[model].fields;
        
        const localFieldNames = Object.keys(localFields);
        const serverFieldNames = Object.keys(serverFields);
        
        const missingFields = localFieldNames.filter(f => !serverFields[f]);
        const extraFields = serverFieldNames.filter(f => !localFields[f]);
        
        const modifiedFields = [];
        for (const field of localFieldNames) {
            if (serverFields[field] && serverFields[field] !== localFields[field]) {
                modifiedFields.push({
                    field,
                    local: localFields[field],
                    server: serverFields[field]
                });
            }
        }
        
        if (missingFields.length > 0 || extraFields.length > 0 || modifiedFields.length > 0) {
            console.log(`\nDiff in model [${model}]:`);
            if (missingFields.length > 0) console.log('  ❌ Missing fields on server:', missingFields);
            if (extraFields.length > 0) console.log('  ⚠️ Extra fields on server:', extraFields);
            if (modifiedFields.length > 0) {
                console.log('  ⚙️ Modified fields:');
                modifiedFields.forEach(m => {
                    console.log(`     - ${m.field}:`);
                    console.log(`       Local : ${m.local}`);
                    console.log(`       Server: ${m.server}`);
                });
            }
        }
    }
}
