# 61 - أدلة الدعم الفني (Support Runbooks)

> Step-by-step playbooks للـ Support team

---

## 🎫 Ticketing System

### الـ Workflow:
```
1. Customer Reports → /support/tickets
2. Auto-categorize (AI)
3. Assign to agent
4. SLA tracking starts
5. Investigation
6. Resolution
7. Customer feedback
8. Close
```

### الـ SLAs:
| Priority | First Response | Resolution |
|---|---|---|
| **Critical** | 30 min | 4 hours |
| **High** | 2 hours | 24 hours |
| **Medium** | 8 hours | 3 days |
| **Low** | 24 hours | 7 days |

---

## 📋 Common Runbooks

### Runbook 1: "لا أستطيع تسجيل الدخول"

```
Causes:
- Wrong password
- Account locked
- MFA issue
- Session expired
- Browser cache
- Subdomain incorrect

Steps:
1. Verify the subdomain (e.g., aljassim.namainvist.com)
2. Check username spelling
3. Try password reset:
   /api/auth/forgot-password
4. Check email (inc. spam)
5. If MFA: verify TOTP app sync (time)
6. If locked:
   - As admin: /users/{id}/unlock
   - Reset session token
7. Clear browser cache + cookies
8. Try incognito mode
9. Check browser console for errors
10. If still failing: escalate to dev
```

---

### Runbook 2: "الفواتير لا تظهر"

```
Causes:
- Permission missing
- Filters applied
- Soft-deleted
- Wrong branch
- DB issue

Steps:
1. Verify user has 'sales' permission
2. Check active filters:
   - Date range
   - Status filter
   - Customer filter
   - Branch filter
3. Clear all filters → reload
4. Check if user is in correct branch
5. As admin: check soft-deleted:
   SELECT * FROM sales_invoice WHERE deleted_at IS NOT NULL;
6. Check tenant context:
   - الـ subdomain صحيح؟
   - الـ JWT يحتوي على tenantId صحيح؟
7. Check Sentry for errors
```

---

### Runbook 3: "ZATCA Rejected My Invoice"

```
Common reasons:
- Invalid VAT number
- Invalid CR
- ICV out of sequence
- PIH mismatch
- XML format issue
- Production CSID expired
- Network issue

Steps:
1. Get invoice ID + error from customer
2. Query:
   SELECT zatcaResponse FROM sales_invoice WHERE id = X;
3. Parse the error message
4. Common fixes:
   
   IF "Invalid VAT number":
     - Check tax_number in Settings
     - Must be 15 digits, start/end with 3
     - Update in /settings → re-submit
   
   IF "ICV out of sequence":
     - Check zatca_invoice_counter
     - Look for gaps:
       SELECT zatcaIcv FROM sales_invoice 
       ORDER BY zatcaIcv DESC LIMIT 10;
     - Fix counter if needed (CAREFUL!)
     - Re-submit
   
   IF "PIH mismatch":
     - Get last_pih from Settings
     - Compare with last invoice hash
     - Fix and re-submit
   
   IF "Production CSID expired":
     - /api/zatca/onboard/renew
     - Re-onboard if needed
   
5. Re-submit:
   POST /api/zatca/retry/{invoiceId}
6. Verify cleared
7. Document the case
```

---

### Runbook 4: "POS Doesn't Print"

```
Causes:
- Printer offline
- Wrong printer selected
- USB disconnected
- Driver issue
- Browser permissions
- Receipt template issue

Steps:
1. Check printer power & USB connection
2. Print test page from OS
3. Verify in /settings/printers:
   - Correct printer name
   - Correct paper size (80mm vs 58mm)
4. In browser:
   - Print preview shows correctly?
   - Browser printer settings
5. Clear print queue (if stuck)
6. Restart printer
7. Restart POS browser tab
8. If qz-tray used:
   - Restart qz-tray service
   - Re-authorize
9. Check console for errors
10. Test with different printer (eliminate hardware)
```

---

### Runbook 5: "Slow Performance"

```
Steps:
1. Verify it's user-specific or system-wide:
   - Other users affected?
   - All endpoints slow or specific?
2. Check user's network (speed test)
3. Check Cloudflare status
4. Check our metrics:
   - /api/metrics
   - Prometheus dashboard
5. Common issues:
   
   A. Heavy report query:
      - Add pagination
      - Add indexes
      - Cache results
   
   B. N+1 queries:
      - Code review
      - Add includes
   
   C. Memory issues:
      - PM2 status
      - Restart if needed:
        pm2 restart main-site
   
   D. DB connections exhausted:
      - Check active connections:
        SELECT * FROM pg_stat_activity;
      - Identify long-running queries
   
   E. Cron job blocking:
      - Check running crons
      - May need scaling
6. Document findings
```

---

### Runbook 6: "Payroll Calculation Wrong"

```
Steps:
1. Identify specific employee
2. Get the PayrollInvoice details
3. Verify:
   - Base salary in Employee record
   - Allowances
   - Loans (active?)
   - GOSI calculation:
     * Saudi: 10% emp, 12% empl
     * GCC: 9%, 11%
     * Expat: 0%, 2%
     * Subject wage: max(1500, min(45000, salary))
   - Attendance (any absences?)
   - Overtime
4. Recalculate manually
5. Compare with system
6. If mismatch:
   - Could be employee data issue (nationality wrong?)
   - Could be allowance not in Settings
   - Could be GOSI subject status wrong
   - Could be bug → escalate
7. Fix the data
8. Re-run payroll for this employee:
   POST /api/payroll/runs/{id}/recalculate-employee/{empId}
```

---

### Runbook 7: "Bank Reconciliation Issues"

```
Steps:
1. Verify Bank Statement imported correctly:
   GET /api/accounting/bank-statements/{id}
2. Check opening/closing balances
3. Auto-match success rate:
   - If < 50%: data quality issue
   - If high: small adjustment needed
4. Common unmatched issues:
   
   A. Reference mismatch:
      - Customer wrote wrong reference
      - Manual match
   
   B. Multiple deposits combined:
      - Bank shows 1 entry of 10000
      - Our system has 3 entries of 3000 each
      - Need to split (manual)
   
   C. Bank fees not in books:
      - Add JE: Dr Bank Fees / Cr Bank
   
   D. Returned checks:
      - Reverse the original entry
      
5. Final reconciliation:
   Book Balance + Outstanding Items = Bank Balance
6. If still not balanced:
   - Detailed review of all entries
   - Look for missing entries
   - Look for duplicates
```

---

### Runbook 8: "Customer Says I Charged Them Twice"

```
Steps:
1. Get customer details + dates
2. Search invoices:
   - Same customer + similar amount + close dates
3. Verify with audit log:
   GET /api/audit-logs?tableName=SalesInvoice&customerId=X
4. Determine:
   A. Genuine duplicate (system bug?):
      - Issue Credit Note for the duplicate
      - JE: Dr Sales Return / Cr AR
      - Document in audit log
      - Investigate root cause (escalate)
   
   B. Customer mistake (not duplicate):
      - Explain to customer
      - Show evidence
      
   C. Payment duplicate:
      - Two payments for same invoice
      - Refund excess: Dr Bank / Cr Customer Refund Liability
5. Customer satisfaction follow-up
```

---

### Runbook 9: "Stock Showing Wrong Quantity"

```
Steps:
1. Get product + warehouse details
2. Check current stock:
   SELECT * FROM product_stock 
   WHERE product_id = X AND stock_id = Y;
3. Trace recent movements:
   SELECT * FROM stock_movement 
   WHERE product_id = X
   ORDER BY created_at DESC LIMIT 50;
4. Identify discrepancy:
   - Missing GRN?
   - Sale not recorded?
   - Transfer not completed?
   - Damage/waste not logged?
5. Physical count to verify
6. If variance:
   POST /api/stocktake (single product)
   - Adjusts the stock
   - JE: Dr/Cr Inventory Adjustment / Inventory
7. Document the reason
8. Root cause:
   - Training issue?
   - Process gap?
   - System bug? → escalate
```

---

### Runbook 10: "Webhook Not Firing"

```
Steps:
1. Verify subscription exists:
   GET /api/webhooks/subscriptions
2. Check it's active
3. Check delivery logs:
   GET /api/webhooks/{id}/deliveries
4. Common issues:
   
   A. Failed deliveries:
      - Verify endpoint URL is correct
      - Check endpoint is reachable
      - Check signature verification in customer code
      - Check rate limits
   
   B. Event not fired:
      - Verify event is in subscription
      - Check the action actually happened
      - Check EventBus logs
   
   C. Subscription auto-disabled:
      - After 10 failures
      - Re-enable:
        PUT /api/webhooks/{id} { active: true }
        
5. Test delivery:
   POST /api/webhooks/{id}/test
6. Document & fix
```

---

### Runbook 11: "Backup Failed"

```
Steps:
1. Check Telegram alerts (should be auto-notified)
2. Verify on server:
   ssh root@46.4.188.170
   cd /var/backups/namasoft
   ls -la $(date +%Y%m%d)*
3. Check disk space:
   df -h
4. Check cron logs:
   pm2 logs cron-backup --lines 50
5. Common issues:
   
   A. Disk full:
      - Clean old backups
      - Or add disk
   
   B. Permission denied:
      - Fix permissions:
        chown -R postgres /var/backups
   
   C. pg_dump timeout:
      - Large DB
      - Increase timeout
      - Or use --jobs for parallel
   
   D. Network issue (S3):
      - Check connectivity
      - Verify credentials
      - Use local backup until fixed
6. Run backup manually
7. Verify integrity:
   gunzip -t backup.sql.gz
8. Document
```

---

### Runbook 12: "User Forgot MFA Device"

```
Steps:
1. Verify user identity:
   - Phone call to registered number
   - Or in-person if local
   - Check ID
2. If verified, options:
   
   A. Use backup codes:
      - User has them?
      - Login with backup code
      - Re-setup MFA
   
   B. Reset MFA (as admin):
      POST /api/admin/users/{id}/reset-mfa
      - Disables MFA
      - User re-enrolls
      - Generate new backup codes
   
   C. If admin's MFA:
      - Owner can reset
      - Or via direct DB (last resort)
3. Document the case
4. Audit log
5. Notify user to setup new MFA immediately
```

---

### Runbook 13: "Tenant Created Twice"

```
Causes:
- Race condition in provisioning
- Network retry
- Concurrent requests

Steps:
1. Verify on Master DB:
   SELECT * FROM tenant_account WHERE user_email = X;
2. Check provisioning logs
3. Determine which is "real":
   - Check both subdomains
   - Which has data?
   - Most likely: the older one
4. Resolution:
   A. If duplicate is empty:
      - DROP DATABASE {newer_tenant}_db;
      - DELETE from tenant_account (or soft delete)
   
   B. If both have data (rare):
      - Merge if possible
      - Or keep both with rename
5. Inform customer
6. Audit log
7. Prevent recurrence:
   - Idempotency keys
   - Lock on email during provision
```

---

### Runbook 14: "Cannot Print Receipt"

```
Steps:
1. Confirm POS session is open
2. Check browser allows pop-ups
3. Check printer configuration:
   - Browser print settings
   - Default printer
4. Test with standard browser print
5. If using qz-tray:
   - Status check
   - Authorization
6. Manual workaround:
   - Save as PDF
   - Print PDF later
7. Long-term:
   - Verify hardware
   - Update drivers
   - Re-install qz-tray if needed
```

---

### Runbook 15: "WhatsApp Bot Not Working"

```
Steps:
1. Check worker status:
   pm2 status whatsapp-worker
2. Check QR code:
   /settings/whatsapp
   - QR shown?
   - Status: connected?
3. If disconnected:
   - Need to re-scan QR
   - Mobile app: Settings → Linked devices → Add device
4. Common issues:
   
   A. Session expired:
      - Re-scan QR
   
   B. Puppeteer crashed:
      pm2 restart whatsapp-worker
   
   C. WhatsApp banned the number:
      - Use new number
      - Update settings
   
   D. Server out of memory:
      - Restart server
      - Or increase RAM
5. Test by sending message
6. Monitor for 5 minutes
```

---

## 🎓 Training for Support Agents

### Knowledge Base:
- /docs (internal)
- This Brain
- Recorded sessions
- Real ticket case studies

### Skills Required:
- ERP fundamentals
- Accounting basics (SOCPA-aware)
- ZATCA knowledge
- SQL (basic queries)
- Browser DevTools
- Empathy + communication
- Arabic + English

### Escalation Path:
```
L1 Support (frontline)
    ↓
L2 Support (technical)
    ↓
Dev Team (code issues)
    ↓
Architect (deep issues)
    ↓
CTO (critical)
```

---

## 📊 Support Metrics

### KPIs:
- **First Contact Resolution (FCR):** > 70%
- **Average Resolution Time:** < 4 hours
- **Customer Satisfaction (CSAT):** > 4.5/5
- **Tickets per Agent per Day:** 20-30
- **SLA Compliance:** > 95%

### Dashboard:
- Real-time ticket queue
- Agent performance
- Top issues this week
- SLA breach alerts
- Customer feedback scores

---

## 🛠 Tools

### Internal:
- /support — ticket system
- This Brain
- Logs access (read-only)
- DB query tool (limited, with audit)
- Audit Log access

### External:
- Sentry (for errors)
- Cloudflare (for DNS/network)
- Hetzner Console
- Status page (for outages)

---

## 🎯 Best Practices

1. ✅ **Listen first**, ask second
2. ✅ **Reproduce the issue**
3. ✅ **Document everything**
4. ✅ **Don't promise** what you can't deliver
5. ✅ **Set expectations** clearly
6. ✅ **Follow up** even after closing
7. ✅ **Be empathetic** — customer is frustrated
8. ❌ **Don't blame** the customer
9. ❌ **Don't make changes** in production without approval
10. ✅ **Escalate** when stuck (not too early, not too late)
