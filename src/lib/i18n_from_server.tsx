// This file was found to be largely a duplicate of i18n.tsx but with hardcoded strings causing build errors.
// It has been streamlined to just re-export or use the standardized JSON dictionary.
'use client';

export * from './i18n';
// useTranslation is exported cleanly through the wildcard above or explicitly if needed
