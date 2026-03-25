'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, MapPin, ShieldCheck, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ZatcaOnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form State for ZATCA Phase 2 CSR Generation
    const [formData, setFormData] = useState({
        organizationName: '',
        vatNumber: '',
        crn: '',
        city: '',
        branchName: '',
        street: '',
        buildingNo: '',
        district: '',
        postalCode: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const nextStep = () => {
        if (step < 3) setStep(step + 1);
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Basic validation mock
        if (!formData.organizationName || !formData.vatNumber || !formData.crn) {
            alert('يرجى تعبئة الحقول الإلزامية');
            setLoading(false);
            return;
        }

        try {
            // Save data to localStorage to pass to the provisioning screen
            localStorage.setItem('zatca_onboarding_data', JSON.stringify(formData));
            
            // Simulate API delay for CSR processing
            setTimeout(() => {
                router.push('/onboarding/provisioning');
            }, 1500);
        } catch (error) {
            alert('حدث خطأ أثناء حفظ البيانات');
            setLoading(false);
        }
    };

    return (
        <div className="onboarding-container" dir="rtl">
            <style jsx>{`
                .onboarding-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f8fafc;
                    font-family: 'Inter', system-ui, sans-serif;
                    padding: 2rem;
                }
                .wizard-card {
                    background: white;
                    width: 100%;
                    max-width: 800px;
                    border-radius: 20px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.05);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                .wizard-header {
                    background: #1e293b;
                    color: white;
                    padding: 2.5rem 3rem;
                    text-align: center;
                    position: relative;
                }
                .wizard-header h1 {
                    margin: 0 0 0.5rem 0;
                    font-size: 1.8rem;
                }
                .wizard-header p {
                    margin: 0;
                    color: #94a3b8;
                    font-size: 1.05rem;
                }
                .stepper {
                    display: flex;
                    justify-content: center;
                    gap: 3rem;
                    margin-top: 2rem;
                    position: relative;
                }
                .stepper::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 20%;
                    right: 20%;
                    height: 2px;
                    background: #334155;
                    z-index: 1;
                    transform: translateY(-50%);
                }
                .step-indicator {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #334155;
                    color: #94a3b8;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    position: relative;
                    z-index: 2;
                    transition: all 0.3s;
                    border: 4px solid #1e293b;
                }
                .step-indicator.active {
                    background: #3b82f6;
                    color: white;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
                }
                .step-indicator.completed {
                    background: #10b981;
                    color: white;
                }
                .wizard-body {
                    padding: 3rem;
                }
                .form-group {
                    margin-bottom: 1.5rem;
                }
                .form-label {
                    display: block;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    color: #334155;
                }
                .form-input {
                    width: 100%;
                    padding: 0.875rem 1rem;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    font-size: 1rem;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .form-input:focus {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
                .grid-2 {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                }
                .wizard-footer {
                    padding: 1.5rem 3rem;
                    background: #f1f5f9;
                    border-top: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .btn {
                    padding: 0.875rem 1.5rem;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 1rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: background 0.2s;
                    border: none;
                }
                .btn-primary {
                    background: #3b82f6;
                    color: white;
                }
                .btn-primary:hover {
                    background: #2563eb;
                }
                .btn-primary:disabled {
                    background: #94a3b8;
                    cursor: not-allowed;
                }
                .btn-secondary {
                    background: white;
                    color: #475569;
                    border: 1px solid #cbd5e1;
                }
                .btn-secondary:hover {
                    background: #f8fafc;
                }
                .step-content {
                    animation: fadeIn 0.3s ease-in-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <div className="wizard-card">
                <div className="wizard-header">
                    <h1>تأسيس النظام المحاسبي</h1>
                    <p>مرحلة الدمج والربط التلقائي مع هيئة الزكاة والضريبة والجمارك</p>
                    
                    <div className="stepper">
                        <div className={`step-indicator ${step >= 1 ? (step === 1 ? 'active' : 'completed') : ''}`}>
                            {step > 1 ? <CheckCircle2 size={20} /> : '1'}
                        </div>
                        <div className={`step-indicator ${step >= 2 ? (step === 2 ? 'active' : 'completed') : ''}`}>
                            {step > 2 ? <CheckCircle2 size={20} /> : '2'}
                        </div>
                        <div className={`step-indicator ${step >= 3 ? (step === 3 ? 'active' : 'completed') : ''}`}>
                            {step > 3 ? <CheckCircle2 size={20} /> : '3'}
                        </div>
                    </div>
                </div>

                <div className="wizard-body">
                    {step === 1 && (
                        <div className="step-content">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '1rem', borderRadius: '12px' }}>
                                    <Building2 size={32} />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, color: '#1e293b' }}>البيانات الأساسية للمنشأة</h2>
                                    <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>البيانات القانونية المطلوبة لاستخراج الشهادة الرقمية CSR</p>
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">اسم المنشأة التجاري (كامل)</label>
                                <input name="organizationName" value={formData.organizationName} onChange={handleChange} className="form-input" placeholder="مثال: شركة نما تك لتقنية المعلومات" />
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">الرقم الضريبي (VAT)</label>
                                    <input name="vatNumber" value={formData.vatNumber} onChange={handleChange} className="form-input" placeholder="يبدأ بـ 3 وينتهي بـ 3 (15 خانة)" maxLength={15} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">رقم السجل التجاري (CRN)</label>
                                    <input name="crn" value={formData.crn} onChange={handleChange} className="form-input" placeholder="10 خانات" maxLength={10} />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="step-content">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{ background: '#f0fdf4', color: '#10b981', padding: '1rem', borderRadius: '12px' }}>
                                    <MapPin size={32} />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, color: '#1e293b' }}>العنوان الوطني للمنشأة</h2>
                                    <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>حسب متطلبات فاتورة - المرحلة الثانية (الربط والتكامل)</p>
                                </div>
                            </div>

                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">المدينة</label>
                                    <input name="city" value={formData.city} onChange={handleChange} className="form-input" placeholder="مثال: الرياض" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">الحي</label>
                                    <input name="district" value={formData.district} onChange={handleChange} className="form-input" placeholder="مثال: حي العليا" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">اسم الشارع</label>
                                <input name="street" value={formData.street} onChange={handleChange} className="form-input" placeholder="مثال: طريق الملك فهد" />
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">رقم المبنى</label>
                                    <input name="buildingNo" value={formData.buildingNo} onChange={handleChange} className="form-input" placeholder="4 أرقام" maxLength={4} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">الرمز البريدي</label>
                                    <input name="postalCode" value={formData.postalCode} onChange={handleChange} className="form-input" placeholder="5 أرقام" maxLength={5} />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="step-content">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{ background: '#fdf2f8', color: '#ec4899', padding: '1rem', borderRadius: '12px' }}>
                                    <ShieldCheck size={32} />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, color: '#1e293b' }}>إعداد العقد الموحد للفرع</h2>
                                    <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>إعداد الفرع الرئيسي لتهيئة بيئة السيرفر المستقلة الخاصة بك</p>
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">اسم الفرع (بالنظام)</label>
                                <input name="branchName" value={formData.branchName || 'الفرع الرئيسي'} onChange={handleChange} className="form-input" />
                            </div>

                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', marginTop: '2rem' }}>
                                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#334155' }}>إقرار</h3>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                    أقر بأن جميع البيانات المدخلة صحيحة ومطابقة لبيانات المنشأة في وزارة التجارة وهيئة الزكاة والضريبة والجمارك. أوكيل نظام نما تك بإنشاء الشهادات الرقمية الخاصة بالمرحلة الثانية (Fatoora) آلياً وتخزينها بأمان على السيرفر المستقل.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="wizard-footer">
                    {step > 1 ? (
                        <button className="btn btn-secondary" onClick={prevStep} disabled={loading}>
                            <ArrowRight size={18} /> 이전 الخـطوة السـابقة
                        </button>
                    ) : <div></div>}
                    
                    {step < 3 ? (
                        <button className="btn btn-primary" onClick={nextStep}>
                            التالي <ArrowLeft size={18} />
                        </button>
                    ) : (
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ background: '#10b981' }}>
                            {loading ? 'جاري إنشاء السيرفر وبيئة العمل...' : 'اعتماد وإنشاء السيرفر'} 
                            {!loading && <ShieldCheck size={18} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
