import re

def fix_arabic_typography():
    filepath = 'd:/namasoft9-3-main/src/app/page.tsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix letter spacing (tracking-tight ruins Arabic cursive)
    content = content.replace('tracking-tighter', 'tracking-normal')
    content = content.replace('tracking-tight', 'tracking-normal')
    
    # Fix line height (leading-tight squishes Arabic text vertically)
    content = content.replace('leading-[1.2]', 'leading-[1.6]')
    content = content.replace('leading-[1.1]', 'leading-[1.6]')
    content = content.replace('leading-tight', 'leading-[1.6]')
    
    # Increase top padding to prevent overlap with navbar
    content = content.replace('pt-32 pb-24 px-6 md:px-16', 'pt-48 pb-24 px-6 md:px-16 mt-16')
    content = content.replace('pt-20', 'pt-32')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
if __name__ == '__main__':
    fix_arabic_typography()
