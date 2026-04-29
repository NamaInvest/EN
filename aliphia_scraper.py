from playwright.sync_api import sync_playwright
import pandas as pd
import sys

# تجنب مشاكل ترميز النصوص في شاشة الويندوز
sys.stdout.reconfigure(encoding='utf-8')

def run_scraper():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()
        
        try:
            print("جارٍ فتح صفحة تسجيل الدخول...")
            page.goto("https://aliphia.com/v1/app/") 
            
            print("\n==============================================")
            print("🔴 الرجاء تسجيل الدخول يدوياً في المتصفح الذي فتح الآن...")
            print("🔴 بعد أن تسجل الدخول وتفتح لوحة التحكم بالكامل،")
            print("🔴 ارجع إلى هذه الشاشة السوداء (الطرفية) واضغط زر Enter.")
            print("==============================================\n")
            
            # ننتظر إشارة المستخدم بدلاً من الاعتماد على العناصر البرمجية
            input("اضغط Enter هـنـا بـعـد الانتهاء من تسجيل الدخول...")
            
            print("✅ جاري استخراج البيانات من الصفحة الحالية...")
            
            selectors = [
                "button", 
                "a[href]", 
                "[role='button']", 
                "[role='menuitem']",
                ".nav-item", 
                ".menu-item",
                ".dropdown-toggle",
                "input[type='submit']"
            ]
            
            all_elements = []
            seen = set()
            
            for selector in selectors:
                elements = page.locator(selector).all()
                for el in elements:
                    try:
                        name = (el.inner_text().strip() or 
                                el.get_attribute("value") or 
                                el.get_attribute("aria-label") or 
                                el.get_attribute("title"))
                        
                        if not name:  
                            name = "بدون نص (أيقونة فقط)"
                        
                        tag = el.evaluate("el => el.tagName").lower()
                        element_type = "زر" if tag == "button" else "رابط" if tag == "a" else "قائمة" if "menu" in selector else "إدخال"
                        
                        action = el.get_attribute("href") or el.get_attribute("onclick") or "JavaScript Action"
                        element_id = f"{name}_{action}_{element_type}"
                        
                        if element_id not in seen and name:
                            seen.add(element_id)
                            all_elements.append({
                                "الاسم الظاهر": name,
                                "النوع": element_type,
                                "الوظيفة/الرابط": str(action)[:100] + "..." if action and len(str(action)) > 100 else action,
                                "الكلاس": el.get_attribute("class"),
                                "التحديد (Selector)": selector
                            })
                    except Exception as e:
                        continue
            
            df = pd.DataFrame(all_elements)
            df.to_excel("buttons_inventory_after_login.xlsx", index=False, engine='openpyxl')
            print(f"🎉 تم استخراج {len(all_elements)} عنصر وحفظها بنجاح في ملف Excel.")
            
        except Exception as e:
            print(f"❌ حدث خطأ: {e}")
            
        finally:
            input("\nاضغط Enter لإغلاق المتصفح وإنهاء السكريبت...")
            browser.close()

if __name__ == "__main__":
    run_scraper()
