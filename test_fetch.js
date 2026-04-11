const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NzU4NzUzNzIsImV4cCI6MTc3NTk2MTc3Mn0.JI73TP7xcdARTJCwbb1PuWurdstPCRdgtUW89UBCfL8';
fetch('http://n11.namainvist.com/api/sales?action=delete_all', {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json().then(d => {
    console.log('STATUS:', r.status);
    console.log('BODY:', d);
})).catch(console.error);
