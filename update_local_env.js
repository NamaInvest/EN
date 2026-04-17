const fs = require('fs');
let env = fs.readFileSync('.env', 'utf8');

if (!env.includes('NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL')) {
    env += '\nNEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/company-info';
    env += '\nNEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/company-info\n';
} else {
    env = env.replace(/NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=.*(\r?\n)/, 'NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/company-info$1');
    env = env.replace(/NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=.*(\r?\n)?/, 'NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/company-info$1');
}
fs.writeFileSync('.env', env);
console.log('Local .env updated');
