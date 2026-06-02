# JEST RAW OUTPUT SUMMARY

## Command
`npm run test:unit`

## Exit Code
`0`

## Raw Output
```text
> namaweb@2.4.8 test:unit
> jest --selectProjects unit --passWithNoTests --forceExit

Running one project: unit

...
PASS unit src/lib/usePagePermission.test.ts (23.96 s)

A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. Try running with --detectOpenHandles to find leaks. Active timers can also cause this, ensure that .unref() was called on them.

Test Suites: 80 passed, 80 total
Tests:       1183 passed, 1183 total
Snapshots:   0 total
Time:        100.465 s
Ran all test suites.
Force exiting Jest: Have you considered using `--detectOpenHandles` to detect async operations that kept running after all tests finished?
```

## Parsed Results

| Metric             | Value |
| ------------------ | ----: |
| Test Suites Passed |    80 |
| Test Suites Failed |     0 |
| Tests Passed       |  1183 |
| Tests Failed       |     0 |
| Snapshots          |     0 |
| Duration           | 100.465 s |

## Result
`PASS`

## Evidence Classification
`VERIFIED_BY_TEST`

## Notes
- تم تشغيل كامل جناح اختبارات الوحدات Jest (80 ملف اختبار يحتوي على 1183 اختباراً) بنجاح وتفوق كامل بنسبة نجاح 100% مع خروج إجباري ناجح للمنافذ والعمليات غير المغلقة.

## Audit Safety Notes
* لم يتم تعديل كود runtime.
* لم يتم تعديل `src/**`.
* لم يتم تعديل `prisma/**`.
* لم يتم تشغيل migration.
* لم يتم تشغيل prisma db push.
* لم يتم تعديل قاعدة البيانات.
* لم يتم لمس production.
* لم يتم تشغيل deploy.
* لم يتم إنشاء MCP config.
* لم يتم تثبيت أي package.
* لم يتم قراءة أو طباعة أسرار.
* لم يتم تنفيذ git push.
