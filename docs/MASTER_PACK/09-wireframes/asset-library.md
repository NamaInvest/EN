# Asset Library & Wireframes Documentation

## 1. Wireframes Overview
Wireframes for this project follow standard design tokens defined in the `DESIGN.md` of the `designs/wireframes/` directory.

### Design Tokens
- **Direction:** RTL (Right-to-Left) for Arabic interfaces
- **Font:** IBM Plex Sans Arabic
- **Primary Color:** `#0F766E` (Teal 700)
- **Density:** Compact
- **Theme:** Light mode (with partial dark mode variants)

## 2. Empty States & Illustrations
We avoid paid assets (like Shutterstock) for standard UI empty states. Instead, we rely on open-source vector illustrations from [unDraw](https://undraw.co/) which provides commercial-free MIT/Open source SVGs that can be recolored.

### Usage
We have a shared React component `EmptyState` (`src/components/ui/empty-state.tsx`) to standardize all "No Data", "No Results", or "Error" screens.

**Example Implementation:**
```tsx
import { EmptyState } from '@/components/ui/empty-state';

export default function NoInvoicesView() {
  return (
    <EmptyState
      variant="no-data"
      illustration="/assets/empty-states/no-data.svg"
      title="لا توجد فواتير"
      message="لم تقم بإنشاء أي فاتورة حتى الآن."
      cta={{ label: 'إنشاء فاتورة', onClick: () => console.log('Create') }}
    />
  );
}
```

## 3. Automating Downloads
To refresh or add new assets, simply edit `assets-manifest.json` and run:
```bash
./scripts/download-assets.sh
```

## 4. Licensing
All icons from `lucide-react` are MIT Licensed.
All illustrations downloaded from `unDraw` are Open Source and royalty-free for commercial projects without attribution requirements.
