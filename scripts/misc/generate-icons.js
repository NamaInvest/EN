const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const pngToIco = require('png-to-ico');

const INPUT = process.argv[2] || 'logo-source.png';
const PUBLIC = path.join(__dirname, 'public');
const APP = path.join(__dirname, 'src', 'app');
const ELECTRON_ASSETS = path.join(__dirname, 'electron', 'assets');

async function generateIcons() {
    // Ensure directories exist
    if (!fs.existsSync(ELECTRON_ASSETS)) fs.mkdirSync(ELECTRON_ASSETS, { recursive: true });

    const src = sharp(INPUT).resize({ fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });

    // Web icons
    console.log('📐 Generating web icons...');
    await sharp(INPUT).resize(192, 192).png().toFile(path.join(PUBLIC, 'icon-192x192.png'));
    await sharp(INPUT).resize(512, 512).png().toFile(path.join(PUBLIC, 'icon-512x512.png'));
    await sharp(INPUT).resize(180, 180).png().toFile(path.join(PUBLIC, 'apple-touch-icon.png'));
    
    // Favicon (32x32 PNG → ICO)
    console.log('🔷 Generating favicon.ico...');
    const png32 = await sharp(INPUT).resize(32, 32).png().toBuffer();
    const png16 = await sharp(INPUT).resize(16, 16).png().toBuffer();
    const png48 = await sharp(INPUT).resize(48, 48).png().toBuffer();
    const png256 = await sharp(INPUT).resize(256, 256).png().toBuffer();
    
    // Save 32x32 as temp for ico conversion
    const tmpPng = path.join(__dirname, '_tmp_favicon.png');
    fs.writeFileSync(tmpPng, png256);
    
    try {
        const ico = await pngToIco(tmpPng);
        fs.writeFileSync(path.join(APP, 'favicon.ico'), ico);
        console.log('✅ favicon.ico → src/app/');
    } catch(e) {
        console.log('⚠️ ICO conversion failed, using PNG fallback:', e.message);
        fs.writeFileSync(path.join(APP, 'favicon.ico'), png32);
    }
    fs.unlinkSync(tmpPng);

    // Electron icons (256x256 ICO for Windows)
    console.log('🖥️ Generating Electron icons...');
    const electronPng = path.join(ELECTRON_ASSETS, 'icon.png');
    await sharp(INPUT).resize(256, 256).png().toFile(electronPng);
    
    try {
        const electronIco = await pngToIco(electronPng);
        fs.writeFileSync(path.join(ELECTRON_ASSETS, 'icon.ico'), electronIco);
        console.log('✅ icon.ico → electron/assets/');
    } catch(e) {
        console.log('⚠️ Electron ICO failed:', e.message);
    }
    
    // OG Image (1200x630)
    await sharp(INPUT).resize(1200, 630, { fit: 'contain', background: '#0f172a' }).png().toFile(path.join(PUBLIC, 'og-image.png'));
    
    console.log('\n🎉 All icons generated!');
    console.log('  📁 public/icon-192x192.png');
    console.log('  📁 public/icon-512x512.png');
    console.log('  📁 public/apple-touch-icon.png');
    console.log('  📁 public/og-image.png');
    console.log('  📁 src/app/favicon.ico');
    console.log('  📁 electron/assets/icon.ico');
    console.log('  📁 electron/assets/icon.png');
}

generateIcons().catch(console.error);
