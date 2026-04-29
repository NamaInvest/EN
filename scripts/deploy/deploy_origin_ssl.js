const { Client } = require('ssh2');

const crtContent = `-----BEGIN CERTIFICATE-----
MIIEqDCCA5CgAwIBAgIUBDfjZTUJ4AIzaTwRVsZGKF/riC0wDQYJKoZIhvcNAQEL
BQAwgYsxCzAJBgNVBAYTAlVTMRkwFwYDVQQKExBDbG91ZEZsYXJlLCBJbmMuMTQw
MgYDVQQLEytDbG91ZEZsYXJlIE9yaWdpbiBTU0wgQ2VydGlmaWNhdGUgQXV0aG9y
aXR5MRYwFAYDVQQHEw1TYW4gRnJhbmNpc2NvMRMwEQYDVQQIEwpDYWxpZm9ybmlh
MB4XDTI2MDQxMjAyMjQwMFoXDTQxMDQwODAyMjQwMFowYjEZMBcGA1UEChMQQ2xv
dWRGbGFyZSwgSW5jLjEdMBsGA1UECxMUQ2xvdWRGbGFyZSBPcmlnaW4gQ0ExJjAk
BgNVBAMTHUNsb3VkRmxhcmUgT3JpZ2luIENlcnRpZmljYXRlMIIBIjANBgkqhkiG
9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxBHKr+zV+AUIqyROQyNsOyKoHf7KzIKyah7C
SKYlzAEOdIy2ggv/y6AyzbNQpB/CCXQiZJgwyZLNJTfKc+WiW7XNPBdCqpYp5sxR
Z1wisQvhKsGoQ7oMReAVqr9EyLJlx35Y6SGDQAtxE1SS4UI/1htlT/h0EARDusrp
IQUBKHyy657bzhLPqi+4CfaaGe/SVIlDUbBhIQKgvoFIsAIjpUb101y9ysGwgvmL
dHSMFDVieAfOJUGnor2GfImApKVZXq6AstZDarr2FlSKcIXWkcmpx30sKrxJq/6T
MhZVdLIAzc6+kYvf/h/7e8W2B3Ou/Hzc8V7S4bduHYS33VWpeQIDAQABo4IBKjCC
ASYwDgYDVR0PAQH/BAQDAgWgMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcD
ATAMBgNVHRMBAf8EAjAAMB0GA1UdDgQWBBSJtU7yiJsDWuATLKQ7btfUsBMBLTAf
BgNVHSMEGDAWgBQk6FNXXXw0QIep65TbuuEWePwppDBABggrBgEFBQcBAQQ0MDIw
MAYIKwYBBQUHMAGGJGh0dHA6Ly9vY3NwLmNsb3VkZmxhcmUuY29tL29yaWdpbl9j
YTArBgNVHREEJDAighAqLm5hbWFpbnZpc3QuY29tgg5uYW1haW52aXN0LmNvbTA4
BgNVHR8EMTAvMC2gK6AphidodHRwOi8vY3JsLmNsb3VkZmxhcmUuY29tL29yaWdp
bl9jYS5jcmwwDQYJKoZIhvcNAQELBQADggEBACy4E5v7qK/8FJwS61+DoP/iOppe
FTuISRAtiBqEfMTKbYeDfXhV8HeCaKgSVkbcT1s2EQ3xI0TD5SxX857KIe2WF9dM
EyIbDm9iOcmDfmaxqhh8DANr95WFx6c+QI82WCkfXJ1itDeZpqy5Se4vzG1uLafE
wPA9I2KJCkTapep99eXpMrA3TIIXEqKVltyvmBj1CtmD5lJmLz/DSdu8mTmnYl10
YLxeqj/zYsPnOBvND9XxLptvAuMSRdBs1i70zyo7J8YkqivCvOl74D0XInRfv9t5
E0N7+62BuONpynpqJRo50fkmaGy9oahnrokFARfoHcJ5VGxC87khu9EmKpg=
-----END CERTIFICATE-----`;

const keyContent = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDEEcqv7NX4BQir
JE5DI2w7Iqgd/srMgrJqHsJIpiXMAQ50jLaCC//LoDLNs1CkH8IJdCJkmDDJks0l
N8pz5aJbtc08F0KqlinmzFFnXCKxC+EqwahDugxF4BWqv0TIsmXHfljpIYNAC3ET
VJLhQj/WG2VP+HQQBEO6yukhBQEofLLrntvOEs+qL7gJ9poZ79JUiUNRsGEhAqC+
gUiwAiOlRvXTXL3KwbCC+Yt0dIwUNWJ4B84lQaeivYZ8iYCkpVleroCy1kNquvYW
VIpwhdaRyanHfSwqvEmr/pMyFlV0sgDNzr6Ri9/+H/t7xbYHc678fNzxXtLht24d
hLfdVal5AgMBAAECggEAAWYNF5ctaZEDoFDofAMfLQbQwzIDmVTfV/FzOlhxEZT6
WOt+C8xxHS893YjHbPxLAo1BB42sX2u8KeVNfOko8NWJqsGRuKzMjLhtZjrahn/K
sebiv+TuXHs+PFMT9wiKwFMO6E7UZFsQie5DA/dYhDr6zIi9rzWQlB8JbbJe8T57
Q79WyHcXvjtNGzpQSwHEy+dKfCq7Pwrap49QaJNDH8twI/A1PhoZQW5EHPwqL6O7
ob1szAXBU9l2dJ9hNWHgVfogCnBZxRjmMGbpYIQ14/405a1w5WGZ4GYTDFqL/LAJ
3e1UUOHt+3iLq1vJDlfW1/PoZZ03BqAnLxNxOdBY/wKBgQD4CexEGCeFWmrbKgRY
o487R8JfZBz+cd6mRm+ZFoc5a9Nq5PRyavQi73fe8BDwy0L/pbpYlocBEmdgnUo6
NjlzwsxbEkHl01wboc/SC74RY27E9J2SJ5+T1zZCty5/AJ4aKoU6QgkwTWA3c8r8
OdCHA8tXBSIRjJlBuCppDsW8IwKBgQDKXNl0f4BlPWZ92fdyS+et9FxxxyAqIc5y
KlP2TLk7PLPrpjVE6D2dKqFpBpBqYegbYBkk0PWZXUBZ2MQot8CniY9zWbnC7LPY
69a036rMdk90W1AXgifLdhNdHTcNW7IgJ2xuBFsPTMxImfAYMVtRs9Uy80t2rFxt
+1MGHEe/swKBgQDl7cznEr0QEVEc+UYuJPCRs2OrqdJ2zHfpC0JIV2njAOFrJfK0
XhESkYo9T61kiggBlE+571AW3kiWdzhn3fxEIz/s7G/J7LRlqQpNXDVFSTdVvKyU
38Y99jKGhejEMn5dIy19Y9nAvPmEbgKs7aswfYPxlwCN5BftpBssaFVEoQKBgGCH
lftqbrbcaS2TceQFrUhfjlF/6Snv4mi3JEITKzDErha0vChYmDuGgGR3CyCT/4I/
fv7+5oj34KB7NGcv8Ch7CADARkpjWw8YwNya7QCHVzNr83KjVZRKiMYcD4zBtuB7
rc91KHLN8YyYUd1YffUlUYfyYocDhTu5bUs25krdAoGAe6aufrik+tocEv/TDP7k
Fln+O8Im8m8on5FBk5IIUE4PTyvQlww/MROe4AFP6Hke1zh8ohW/MMsiYUzYS6Pg
zhr9IJ3hX3B6wYgvaD/6tPkAodWmvung1nRvq9p2kTuQIgx2+H8wqh1Dy0bUjO8u
qVyFtGec/7v0X8B9Q+dPoGU=
-----END PRIVATE KEY-----`;

const bashCommand = `
mkdir -p /etc/ssl/namainvist
cat << 'EOF' > /etc/ssl/namainvist/origin.crt
${crtContent}
EOF
cat << 'EOF' > /etc/ssl/namainvist/origin.key
${keyContent}
EOF
chmod 600 /etc/ssl/namainvist/origin.key

echo "Files deployed!"
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(bashCommand, (err, stream) => {
        if (err) throw err;
        stream.on('data', (d) => process.stdout.write(d))
              .on('error', (d) => process.stderr.write(d))
              .on('close', () => conn.end());
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
});
