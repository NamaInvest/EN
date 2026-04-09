const { execSync } = require('child_process');
try {
    execSync('git checkout src/app/restaurant-pos/page.tsx');
    console.log('Restored successfully');
} catch (e) {
    console.error(e);
}
