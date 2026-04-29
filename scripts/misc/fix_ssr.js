const fs = require('fs');

// Read Sidebar.tsx
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// Check if it already has 'use client' at top
if (!code.startsWith("'use client'")) {
    code = "'use client';\n" + code;
}

// The real fix: Add suppressHydrationWarning and a mounted state guard
// This forces the component to SKIP rendering anything during SSR
// and only render the real content after client-side hydration

// Find the export default function Sidebar
const insertPoint = `export default function Sidebar() {`;
const mountedState = `export default function Sidebar() {
    const [clientReady, setClientReady] = useState(false);
    useEffect(() => { setClientReady(true); }, []);
`;

code = code.replace(insertPoint, mountedState);

// Find the return statement and add client guard
// Find the <> return 
code = code.replace(
    /return \(\s*<>/m,
    `if (!clientReady) return null;

    return (
        <>`
);

fs.writeFileSync('src/components/Sidebar.tsx', code, 'utf8');
console.log('Sidebar patched with client-only rendering!');
