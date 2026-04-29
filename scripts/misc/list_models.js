const https = require('https');

async function listModels() {
    const key = 'AIzaSyCY2NBRvTazcdUnqqv1roMFGGX3LQ1qJkA';
    return new Promise((resolve) => {
        const req = https.request(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, {
            method: 'GET'
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                try {
                    const json = JSON.parse(data);
                    if (json.models) {
                        console.log('AVAILABLE MODELS:');
                        json.models.forEach(m => console.log(' - ' + m.name));
                    } else {
                        console.log('Error/No models:', json);
                    }
                } catch(e) { console.log(data); }
                resolve();
            });
        });
        req.on('error', (e) => resolve());
        req.end();
    });
}
listModels();
