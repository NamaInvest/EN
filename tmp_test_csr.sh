#!/bin/bash
DIR=/tmp/zatca_test
UUID=$(cat /proc/sys/kernel/random/uuid)

cat > $DIR/zatca.cnf << ENDCFG
oid_section = zatca_oids

[zatca_oids]
certificateTemplateName = 1.3.6.1.4.1.311.20.2

[req]
default_bits = 2048
prompt = no
default_md = sha256
req_extensions = v3_req
distinguished_name = dn

[dn]
C = SA
OU = Spider Company for Car Services
O = Spider Company for Car Services
CN = PRD-7016739265-31133090250003
serialNumber = 1-Spider|2-Spider|3-$UUID
0.UID = 31133090250003
title = 1100
2.5.4.26 = 8809 Main najran
2.5.4.15 = Technology

[v3_req]
basicConstraints = CA:FALSE
keyUsage = digitalSignature, nonRepudiation
certificateTemplateName = ASN1:UTF8String:ZATCA-Code-Signing
ENDCFG

echo "=== Config ==="
cat $DIR/zatca.cnf
echo "=== Generating CSR ==="
openssl req -new -key $DIR/key.pem -out $DIR/csr.pem -config $DIR/zatca.cnf -extensions v3_req 2>&1
RC=$?
echo "RC=$RC"
if [ $RC -eq 0 ]; then
    echo "=== CSR Text ==="
    openssl req -text -noout -in $DIR/csr.pem 2>&1 | head -30
    CSR64=$(openssl req -in $DIR/csr.pem -outform DER 2>/dev/null | base64 -w0)
    echo "=== BASE64_LEN=${#CSR64} ==="
fi
