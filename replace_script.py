import re

with open('src/app/(dashboard)/sales/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(
    r"const res = await fetch\('/api/sales', \{\s*"
    r"method: 'POST',\s*"
    r"headers: \{ 'Content-Type': 'application/json', Authorization: `Bearer \$\{token\}` \},\s*"
    r"body: JSON\.stringify\(\{\s*"
    r"customerId: customerId \|\| null,\s*"
    r"stockId: stockId \|\| '1',\s*"
    r"items: cart\.map\(c => \(\{\s*"
    r"productId: c\.productId, productName: c\.productName,\s*"
    r"quantity: c\.quantity, price: c\.price, discountRate: c\.discountRate,\s*"
    r"productUnitId: c\.productUnitId,\s*"
    r"unitFactor: c\.unitFactor,\s*"
    r"\}\)\),\s*"
    r"discountRate,\s*"
    r"paymentType,\s*"
    r"isTaxInclusive,\s*"
    r"taxRate: actualTaxRate,\s*"
    r"splitCash: paymentType === 'split' \? parseFloat\(splitCash\) \|\| 0 : undefined,\s*"
    r"splitCard: paymentType === 'split' \? parseFloat\(splitCard\) \|\| 0 : undefined,\s*"
    r"paid: paymentType === 'split' \? \(parseFloat\(splitCash\) \|\| 0\) \+ \(parseFloat\(splitCard\) \|\| 0\) : \(paidAmount \? parseFloat\(paidAmount\) : total\),\s*"
    r"userId: user\.id,\s*"
    r"notes: bnplOrderId \? notes \+ `\\nBNPL_REF:\$\{bnplOrderId\} \[\$\{paymentType\}\]` : notes,\s*"
    r"manualInvoiceNo: manualInvoiceNo \? parseInt\(manualInvoiceNo\) : undefined,\s*"
    r"manualDate: manualDate \|\| undefined,\s*"
    r"\}\),\s*"
    r"\}\);\s*"
    r"if \(res\.ok\) \{\s*"
    r"const invoice = await res\.json\(\);",
    re.MULTILINE
)

replacement = """const invoiceDataBody = {
                    customerId: customerId || null,
                    stockId: stockId || '1',
                    items: cart.map(c => ({
                        productId: c.productId, productName: c.productName,
                        quantity: c.quantity, price: c.price, discountRate: c.discountRate,
                        productUnitId: c.productUnitId,
                        unitFactor: c.unitFactor,
                    })),
                    discountRate,
                    paymentType,
                    isTaxInclusive,
                    taxRate: actualTaxRate,
                    splitCash: paymentType === 'split' ? parseFloat(splitCash) || 0 : undefined,
                    splitCard: paymentType === 'split' ? parseFloat(splitCard) || 0 : undefined,
                    paid: paymentType === 'split' ? (parseFloat(splitCash) || 0) + (parseFloat(splitCard) || 0) : (paidAmount ? parseFloat(paidAmount) : total),
                    userId: user.id,
                    notes: bnplOrderId ? notes + `\\nBNPL_REF:${bnplOrderId} [${paymentType}]` : notes,
                    manualInvoiceNo: manualInvoiceNo ? parseInt(manualInvoiceNo) : undefined,
                    manualDate: manualDate || undefined,
                    total: total, // For SQLite pending totals
                };

                const data = await saveInvoiceWithSync(invoiceDataBody, '/api/sales');
                const res = { ok: data && data.success };
                if (res.ok) {
                    const invoice = data.offline ? { id: data.uuid, invoiceNo: data.uuid, date: new Date().toISOString() } : data;"""

new_content = pattern.sub(replacement, content)

if content == new_content:
    print("NO MATCH FOUND")
else:
    with open('src/app/(dashboard)/sales/page.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS")
