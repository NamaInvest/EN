import os

# الإعدادات
TARGET_DIRS = ['src', 'docs']  # المجلدات التي سنقرأها
# الامتدادات المهمة فقط (تجاهل الصور والملفات الثقيلة)
EXTENSIONS = ['.ts', '.tsx', '.prisma', '.md', '.py', '.sql', '.json'] 
OUTPUT_FILE = 'project_context.txt'
# مجلدات يجب تجاهلها تماماً إذا وجدت داخل src
IGNORE_DIRS = ['node_modules', '.next', 'dist', '__tests__']

def generate_context():
    count = 0
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
        outfile.write("PROJECT STRUCTURE AND CONTENT\n")
        outfile.write("============================\n\n")

        for target in TARGET_DIRS:
            if not os.path.exists(target):
                print(f"⚠️ المجلد {target} غير موجود، سيتم تخطيه.")
                continue

            for root, dirs, files in os.walk(target):
                # تجاهل المجلدات غير المرغوبة
                dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

                for file in files:
                    if any(file.endswith(ext) for ext in EXTENSIONS):
                        file_path = os.path.join(root, file)
                        try:
                            with open(file_path, 'r', encoding='utf-8') as infile:
                                content = infile.read()
                                
                                # كتابة اسم الملف كعنوان للقسم
                                outfile.write(f"\n--- START OF FILE: {file_path} ---\n")
                                outfile.write(content)
                                outfile.write(f"\n--- END OF FILE: {file_path} ---\n")
                                
                                count += 1
                                print(f"✅ تمت إضافة: {file_path}")
                        except Exception as e:
                            print(f"❌ تعذر قراءة {file_path}: {e}")

    print(f"\n✨ اكتمل العمل! تم جمع {count} ملف في {OUTPUT_FILE}")

if __name__ == "__main__":
    generate_context()