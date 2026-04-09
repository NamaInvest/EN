const { execSync } = require('child_process');
try {
    console.log(execSync('git checkout src/lib/translations.ts').toString());
    console.log("Restored translations.ts successfully.");
} catch (e) {
    console.log("Git checkout failed:", e.message);
}
