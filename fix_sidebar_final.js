const fs = require('fs');
let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// Fix u.permissions.map
content = content.replace(/u\.permissions\.map/g, '(u.permissions || []).map');

// Fix menuItems.map
content = content.replace(/menuItems\.map/g, '(menuItems || []).map');

// Fix filteredMenu.map
content = content.replace(/filteredMenu\.map/g, '(filteredMenu || []).map');

// Fix group.items.map
content = content.replace(/group\.items\.map/g, '(group.items || []).map');

// Now, add the subItems rendering safely.
const linkBlock = `return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={\`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-[15px] transition-all \${
                          isActive 
                            ? 'bg-blue-50 text-blue-700 font-bold' 
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 font-medium'
                        }\`}
                        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                      >
                        <span className={\`text-lg shrink-0 \${isActive ? 'opacity-100' : 'opacity-70'}\`}>{item.icon}</span>
                        <span className="leading-snug">{gl(lang, item.lk)}</span>
                      </Link>
                    );`;

const newLinkBlock = `return (
                      <div key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={\`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-[15px] transition-all \${
                            isActive 
                              ? 'bg-blue-50 text-blue-700 font-bold' 
                              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 font-medium'
                          }\`}
                          style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                        >
                          <span className={\`text-lg shrink-0 \${isActive ? 'opacity-100' : 'opacity-70'}\`}>{item.icon}</span>
                          <span className="leading-snug">{gl(lang, item.lk)}</span>
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
                        )}
                      </div>
                    );`;

content = content.replace(linkBlock, newLinkBlock);
fs.writeFileSync('src/components/Sidebar.tsx', content);
