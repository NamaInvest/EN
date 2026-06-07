# الخطوة التالية بعد بوابة Test DB Readiness (TEST_DB_NEXT_ACTION_GUIDE_AR)

## إذا TEST_DB_READINESS = NOT_READY
- جهّز `TEST_MODE=true` خارج Git.
- جهّز `TEST_DATABASE_URL` خارج Git.
- لا تطبع القيم.
- أعد تشغيل Readiness Gate.
- لا تشغل أي DB integration.

## إذا TEST_DB_READINESS = READY
- شغّل Smoke Test readiness-only.
- لا تشغل integration write إلا بعد rollback confirmation.
- انتقل إلى Finance DB Smoke Execution Wave.

## إذا Guard Failure
- توقف.
- راجع URL naming.
- راجع production-like indicators.
- لا تكمل.
