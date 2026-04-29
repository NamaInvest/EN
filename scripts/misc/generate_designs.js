const fs = require('fs');
const path = require('path');

const sourceDir = "C:\\Users\\1\\Desktop\\stitch_namaa_invest_motion_redesign";
const targetBaseDir = "d:\\namasoft9-3-main\\src\\app";

function convertHtmlToJsx(html, id) {
  let bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return '';
  let bodyContent = bodyMatch[1];
  bodyContent = bodyContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  let styleMatch = html.match(/<style>([\s\S]*?)<\/style>/i);
  let styles = styleMatch ? styleMatch[1] : '';
  
  const tailwindConfigMatch = html.match(/<script id="tailwind-config">([\s\S]*?)<\/script>/i);
  const tailwindConfig = tailwindConfigMatch ? tailwindConfigMatch[1] : '';

  const safeStyles = styles.replace(/`/g, '\\`').replace(/\$/g, '\\$');
  const safeConfig = tailwindConfig.replace(/`/g, '\\`').replace(/\$/g, '\\$');
  const safeBody = bodyContent.replace(/`/g, '\\`').replace(/\$/g, '\\$');

  const finalJsx = `
"use client";
import React, { useEffect } from 'react';

export default function Design() {
  useEffect(() => {
    // Inject Tailwind CDN
    if (!document.getElementById('tailwind-cdn-script')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn-script';
      script.src = "https://cdn.tailwindcss.com?plugins=forms,container-queries";
      document.head.appendChild(script);
    }
    
    // Inject Tailwind Config
    const existingConfig = document.getElementById('tailwind-config-script');
    if (existingConfig) existingConfig.remove();
    
    const config = document.createElement('script');
    config.id = 'tailwind-config-script';
    config.innerHTML = \`${safeConfig}\`;
    document.head.appendChild(config);

    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-visible');
            }
        });
    }, observerOptions);

    // Use a short timeout to ensure DOM is ready
    setTimeout(() => {
      document.querySelectorAll('.reveal-hidden').forEach((el) => observer.observe(el));
    }, 100);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;family=Noto+Sans+Arabic:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: \`${safeStyles}\` }} />
      <div dir="rtl" className="bg-surface text-on-surface">
        <div dangerouslySetInnerHTML={{ __html: \`${safeBody}\` }} />
      </div>
    </>
  );
}
`;
  return finalJsx;
}

[1, 2, 3, 4].forEach(id => {
  const htmlPath = path.join(sourceDir, String(id), 'code.html');
  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf8');
    const jsx = convertHtmlToJsx(html, id);
    
    const targetDir = path.join(targetBaseDir, 'design' + id);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(targetDir, 'page.tsx'), jsx);
    console.log('Generated design' + id + '/page.tsx');
  }
});
