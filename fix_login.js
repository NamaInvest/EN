const fs = require('fs');
const p = 'src/app/login/page.tsx';
let code = fs.readFileSync(p, 'utf8');

// 1. Add useTranslation hook inside LoginForm right after its opening brace
code = code.replace(
    'function LoginForm() {\r\n    const [username',
    'function LoginForm() {\r\n    const { t } = useTranslation();\r\n    const [username'
);

// 2. Fix t() used before hook in useState initial value
code = code.replace(
    "useState(t('sys.str_4019'))",
    "useState('نما انفست')"
);

// 3. Remove redundant useTranslation from LoginPage (since it was never used there before)
// Keep the existing one as is for any t() calls in LoginPage.

fs.writeFileSync(p, code);
console.log('Fixed LoginForm to have its own useTranslation hook');
