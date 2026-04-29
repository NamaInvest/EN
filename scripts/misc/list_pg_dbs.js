const { exec } = require('child_process');
exec('sudo -u postgres psql -c "\\l"', (err, stdout, stderr) => {
    if (err) {
        console.error('Error:', stderr);
        return;
    }
    console.log(stdout);
});
