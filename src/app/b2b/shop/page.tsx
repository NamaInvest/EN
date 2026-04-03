'use client';

import { useState, useEffect } from 'react';

interface Product {
    id: number;
    name: string;
    barcode: string | null;
    sellPrice: number;
    currentStock: number;
    taxRate: number;
    imagePath: string;
}

interface CartItem extends Product {
    cartQuantity: number;
}

export default function B2BShopPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/b2b/shop');
            if (res.status === 401) {
                window.location.href = '/b2b/login';
                return;
            }
            const data = await res.json();
            if (data.success) {
                setProducts(data.products);
            }
        } catch (e) {
            console.error('Failed to load products', e);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (p: Product) => {
        setCart(prev => {
            const ext = prev.find(x => x.id === p.id);
            if (ext) {
                return prev.map(x => x.id === p.id ? { ...x, cartQuantity: x.cartQuantity + 1 } : x);
            }
            return [...prev, { ...p, cartQuantity: 1 }];
        });
    };

    const removeFromCart = (id: number) => {
        setCart(prev => prev.filter(x => x.id !== id));
    };

    const submitOrder = async () => {
        setPlacingOrder(true);
        try {
            const res = await fetch('/api/b2b/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cart: cart.map(c => ({
                        productId: c.id,
                        name: c.name,
                        price: c.sellPrice,
                        quantity: c.cartQuantity,
                        taxRate: c.taxRate
                    }))
                })
            });
            const data = await res.json();
            if (data.success) {
                setCart([]);
                setSuccessMessage(`✅ تم اعتماد طلبية رقم #${data.order.orderNo} بنجاح! سيتم تجهيزها قريباً.`);
                setTimeout(() => setSuccessMessage(''), 8000);
            } else {
                alert(data.error);
            }
        } catch (e: any) {
            alert('فشل الإرسال: ' + e.message);
        } finally {
            setPlacingOrder(false);
        }
    };

    const filteredProducts = products.filter(p => p.name.includes(searchQuery) || (p.barcode && p.barcode.includes(searchQuery)));

    const cartTotal = cart.reduce((sum, item) => sum + (item.sellPrice * item.cartQuantity), 0);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '30px', alignItems: 'start' }}>
            
            {/* Catalog Section */}
            <div>
                <input 
                    type="text" 
                    placeholder="ابحث عن منتج أو باركود..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '15px 20px', borderRadius: '30px', border: '1px solid #ddd', marginBottom: '30px', fontSize: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', outline: 'none' }}
                />

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>جاري تحميل المنتجات...</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                        {filteredProducts.map(p => (
                            <div key={p.id} style={{
                                background: '#fff', borderRadius: '15px', padding: '20px', 
                                boxShadow: '0 10px 40px rgba(0,0,0,0.04)', transition: 'transform 0.2s', cursor: 'pointer',
                                display: 'flex', flexDirection: 'column'
                            }}
                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ height: '140px', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', borderRadius: '10px', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', overflow: 'hidden' }}>
                                    {p.imagePath ? <img src={p.imagePath} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📦 لا توجد صورة'}
                                </div>
                                <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#2c3e50', marginBottom: '8px' }}>{p.name}</div>
                                <div style={{ color: '#7f8c8d', fontSize: '13px', marginBottom: '15px', flex: 1 }}>المخزون المتاح: {p.currentStock > 0 ? p.currentStock : <span style={{color: 'red'}}>نفذت الكمية</span>}</div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ color: '#27ae60', fontWeight: '900', fontSize: '18px' }}>{p.sellPrice} <span style={{fontSize: '12px'}}>ر.س</span></div>
                                    <button 
                                        disabled={p.currentStock <= 0}
                                        onClick={() => addToCart(p)}
                                        style={{ 
                                            background: p.currentStock > 0 ? '#3498db' : '#ccc', 
                                            color: '#fff', border: 'none', borderRadius: '50%', width: '35px', height: '35px', 
                                            fontSize: '18px', cursor: p.currentStock > 0 ? 'pointer' : 'not-allowed',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Glassmorphism Cart Sidebar */}
            <div style={{ 
                background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)', 
                borderRadius: '20px', padding: '25px', boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
                position: 'sticky', top: '30px', border: '1px solid rgba(255,255,255,0.4)'
            }}>
                <h2 style={{ fontSize: '20px', color: '#2c3e50', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>🛒 سلة المشتريات (B2B)</h2>
                
                {successMessage && (
                    <div style={{ background: '#d4edda', color: '#155724', padding: '15px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', lineHeight: '1.5' }}>
                        {successMessage}
                    </div>
                )}

                <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px', paddingRight: '10px' }}>
                    {cart.length === 0 ? <div style={{ color: '#95a5a6', textAlign: 'center', padding: '30px 0' }}>السلة فارغة</div> : cart.map((c, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa', padding: '15px', borderRadius: '12px', marginBottom: '10px' }}>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#34495e' }}>{c.name}</div>
                                <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '4px' }}>{c.sellPrice} ر.س × {c.cartQuantity}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <div style={{ fontWeight: 'bold' }}>{c.sellPrice * c.cartQuantity}</div>
                                <button 
                                    onClick={() => removeFromCart(c.id)}
                                    style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '16px' }}
                                >✕</button>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontSize: '18px', fontWeight: 'bold', color: '#2c3e50' }}>
                    <span>المجموع التقريبي:</span>
                    <span style={{ color: '#27ae60' }}>{cartTotal.toFixed(2)} ر.س</span>
                </div>

                <button 
                    onClick={submitOrder}
                    disabled={cart.length === 0 || placingOrder}
                    style={{ 
                        width: '100%', padding: '15px', 
                        background: cart.length > 0 ? 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)' : '#bdc3c7', 
                        color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', 
                        cursor: cart.length > 0 && !placingOrder ? 'pointer' : 'not-allowed',
                        boxShadow: cart.length > 0 ? '0 10px 20px rgba(46, 204, 113, 0.3)' : 'none',
                        transition: '0.2s'
                    }}
                >
                    {placingOrder ? 'جاري الاعتماد...' : 'اعتماد طلبية الشراء'}
                </button>
            </div>
        </div>
    );
}

