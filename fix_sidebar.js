const fs = require('fs');
let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

const replacement = `<span className="leading-snug">{gl(lang, (item as any).lk)}</span>
                      </Link>
                      {((item as any).subItems || []).length > 0 && (
                        <div className="pl-12 pr-4 py-2 space-y-1">
                          {((item as any).subItems || []).map((subItem: any) => {
                            const isSubActive = pathname === subItem.href;
                            return (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                onClick={() => setIsOpen(false)}
                                className={\`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all \${isSubActive ? 'bg-blue-50/50 text-blue-700 font-semibold' : 'text-slate-500 hover:text-slate-800'}\`}
                                style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                              >
                                <span className="text-[13px] opacity-70">{subItem.icon}</span>
                                <span>{gl(lang, subItem.lk)}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}`;

content = content.replace(/<span className="leading-snug">\{gl\(lang, \(item as any\)\.lk\)\}<\/span>\s*<\/Link>/, replacement);

fs.writeFileSync('src/components/Sidebar.tsx', content);
