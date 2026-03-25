fetch('http://204.168.144.74/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: '123' })
})
.then(res => res.text().then(text => console.log('STATUS:', res.status, '\\nRESPONSE:', text)))
.catch(err => console.error('FETCH ERROR:', err));
