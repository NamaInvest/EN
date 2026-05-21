# Asset Library & Illustrations

## Overview
This document tracks all external visual assets used in the application.

## Licensing
All assets must be completely open-source and free for commercial use without attribution requirements (e.g., MIT, CC0, unDraw license). 
**NO AI-generated images without legal approval.**

## Sources
1. **unDraw** (https://undraw.co/): Primary source for empty state SVG illustrations.
2. **Lucide Icons** (https://lucide.dev/): Primary UI icon set (used via `lucide-react`).

## Included Assets

### 1. Empty States (`public/assets/empty-states/`)
- `no-data.svg`: Used when a table or list has no records.
- `empty.svg`: Generic empty result or search with no matches.

### 2. Errors (`public/assets/errors/`)
- `404.svg`: Page not found illustration.
- `500.svg`: Server error or network failure illustration.

## Usage
Import and use the `<EmptyState>` component:

```tsx
import { EmptyState } from '@/components/ui/EmptyState';

<EmptyState
  variant="no-data"
  illustration="/assets/empty-states/no-data.svg"
  title="لا يوجد عملاء"
  message="لم يتم إضافة أي عملاء بعد."
/>
```

## Maintenance
To download or refresh the assets, run:
`bash scripts/download-assets.sh`
