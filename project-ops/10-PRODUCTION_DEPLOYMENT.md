# Production Deployment

## قبل النشر

- backup
- tests
- staging validation
- migration review
- rollback verification

---

# ممنوع

- deploy مباشر على production بدون staging
- destructive migration بدون backup
- deploy أثناء payroll run أو period close

---

# بعد النشر

- monitor errors
- monitor queues
- monitor DB
- monitor sync
- monitor ZATCA
