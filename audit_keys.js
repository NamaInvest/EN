// List all missing sys.str keys from settings page
const ar = JSON.parse(require('fs').readFileSync('src/locales/ar.json', 'utf8'));

// These are the keys we know are used in settings/page.tsx (from the user's screenshot)
const keysUsedInUI = [
    'sys.str_4390','sys.str_4391','sys.str_4392','sys.str_4393','sys.str_4394','sys.str_4395','sys.str_4396',
    'sys.str_4397','sys.str_4398','sys.str_4399','sys.str_4400','sys.str_4401','sys.str_4402','sys.str_4403',
    'sys.str_4404','sys.str_4405','sys.str_4406','sys.str_4407','sys.str_4408','sys.str_4409','sys.str_4410',
    'sys.str_4411','sys.str_4412','sys.str_4413','sys.str_4414','sys.str_4415','sys.str_4416','sys.str_4417',
    'sys.str_4418','sys.str_4419','sys.str_4420','sys.str_4421','sys.str_4422','sys.str_4423','sys.str_4424',
    'sys.str_4425','sys.str_4426','sys.str_4427','sys.str_4428','sys.str_4429','sys.str_4430','sys.str_4431',
    'sys.str_4432','sys.str_4433','sys.str_4434','sys.str_4435','sys.str_4436','sys.str_4437','sys.str_4438',
    'sys.str_4439','sys.str_4440','sys.str_4441','sys.str_4442','sys.str_4443','sys.str_4444',
    'sys.str_4536','sys.str_4537','sys.str_4538','sys.str_4539','sys.str_4540','sys.str_4541','sys.str_4542',
];

console.log('Checking if keys exist in ar.json:');
let missing = [];
keysUsedInUI.forEach(k => {
    const val = ar[k];
    if (!val) {
        missing.push(k);
        console.log('MISSING:', k);
    } else {
        console.log('✓', k, '=', val.slice(0, 40));
    }
});
console.log('\nTotal missing:', missing.length);
