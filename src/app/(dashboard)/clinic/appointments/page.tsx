'use client';

import React, { useState, useEffect } from 'react';

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Form states
    const [patientId, setPatientId] = useState('');
    const [doctorId, setDoctorId] = useState('');
    const [roomId, setRoomId] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [duration, setDuration] = useState('15');
    const [type, setType] = useState('CONSULT');
    const [notes, setNotes] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/clinic/appointments?date=${selectedDate}`);
            const json = await res.json();
            if (json.success) {
                setAppointments(json.data.appointments);
                setDoctors(json.data.metadata.doctors);
                setPatients(json.data.metadata.patients);
                setRooms(json.data.metadata.rooms);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/clinic/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId,
                    doctorId,
                    roomId,
                    date: selectedDate,
                    startTime,
                    duration: Number(duration),
                    type,
                    notes
                })
            });
            const data = await res.json();
            if (data.success) {
                setShowModal(false);
                fetchData();
                alert('تم الحجز بنجاح!');
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        📅 العيادات | جدول المواعيد (Appointments)
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">إدارة مواعيد الأطباء، وغرف الكشف، واستقبال المرضى</p>
                </div>
                <div className="flex gap-4 items-center">
                    <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="border dark:border-gray-600 rounded-md p-2 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                    />
                    <button 
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md font-bold shadow hover:bg-blue-700 transition"
                    >
                        + حجز موعد جديد
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-gray-500 font-medium">جاري تحميل الجدول...</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 overflow-hidden">
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700 flex gap-4">
                        <div className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full bg-blue-500"></span> استشارة</div>
                        <div className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full bg-green-500"></span> مراجعة</div>
                        <div className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full bg-purple-500"></span> إجراء طبي</div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                <tr>
                                    <th className="p-4 font-semibold">الوقت</th>
                                    <th className="p-4 font-semibold">المريض</th>
                                    <th className="p-4 font-semibold">الطبيب</th>
                                    <th className="p-4 font-semibold">العيادة / الغرفة</th>
                                    <th className="p-4 font-semibold">النوع</th>
                                    <th className="p-4 font-semibold">الحالة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500 font-medium">
                                            لا توجد مواعيد مجدولة لهذا اليوم.
                                        </td>
                                    </tr>
                                ) : (
                                    appointments.map((appt) => (
                                        <tr key={appt.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                            <td className="p-4 font-bold text-gray-900 dark:text-gray-100 font-mono" dir="ltr">{appt.startTime}</td>
                                            <td className="p-4 font-medium text-blue-700 dark:text-blue-400">{appt.patient?.nameAr || 'مريض غير معروف'}</td>
                                            <td className="p-4 text-gray-700 dark:text-gray-300">د. {appt.doctor?.nameAr || 'طبيب غير معروف'}</td>
                                            <td className="p-4 text-gray-600 dark:text-gray-400">{appt.room?.name || '---'}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 text-xs rounded-full font-bold ${
                                                    appt.type === 'CONSULT' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                                    appt.type === 'FOLLOWUP' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                                }`}>
                                                    {appt.type === 'CONSULT' ? 'استشارة' : appt.type === 'FOLLOWUP' ? 'مراجعة' : 'إجراء طبي'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 text-xs rounded-full font-bold border ${
                                                    appt.status === 'SCHEDULED' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                    appt.status === 'ARRIVED' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    'bg-gray-100 text-gray-600 border-gray-200'
                                                }`}>
                                                    {appt.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Booking Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col">
                        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 rounded-t-xl">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">حجز موعد جديد</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-red-500 font-bold text-xl">&times;</button>
                        </div>
                        
                        <form onSubmit={handleBook} className="p-6 flex-1 overflow-y-auto space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">المريض</label>
                                    <select required value={patientId} onChange={e => setPatientId(e.target.value)} className="w-full border dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                        <option value="">-- اختر المريض --</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.nameAr}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">الطبيب</label>
                                    <select required value={doctorId} onChange={e => setDoctorId(e.target.value)} className="w-full border dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                        <option value="">-- اختر الطبيب --</option>
                                        {doctors.map(d => <option key={d.id} value={d.id}>د. {d.nameAr}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">تاريخ الموعد</label>
                                    <input type="date" required value={selectedDate} disabled className="w-full border dark:border-gray-600 rounded p-2 bg-gray-100 dark:bg-gray-800 text-gray-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">وقت البدء</label>
                                    <input type="time" required value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full border dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">المدة (دقائق)</label>
                                    <select value={duration} onChange={e => setDuration(e.target.value)} className="w-full border dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                        <option value="15">15 دقيقة</option>
                                        <option value="30">30 دقيقة</option>
                                        <option value="45">45 دقيقة</option>
                                        <option value="60">60 دقيقة</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">نوع الموعد</label>
                                    <select value={type} onChange={e => setType(e.target.value)} className="w-full border dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                        <option value="CONSULT">استشارة</option>
                                        <option value="FOLLOWUP">مراجعة</option>
                                        <option value="PROCEDURE">إجراء طبي</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">العيادة / الغرفة (اختياري)</label>
                                    <select value={roomId} onChange={e => setRoomId(e.target.value)} className="w-full border dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                        <option value="">-- غرفة غير محددة --</option>
                                        {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">ملاحظات والتأمين</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="رقم الموافقة المسبقة للتأمين / ملاحظات الشكوى الطبية..." className="w-full border dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"></textarea>
                            </div>

                            <div className="mt-6 flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 rounded font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition">
                                    إلغاء
                                </button>
                                <button type="submit" className="px-6 py-2 rounded font-bold text-white bg-blue-600 hover:bg-blue-700 shadow transition">
                                    تأكيد وحفظ الموعد
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
