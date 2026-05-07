'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function GradebookPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [students] = useState([
        { id: 'STU-101', name: 'Omar Ali', assignment1: 95, midTerm: 88, final: 92 },
        { id: 'STU-102', name: 'Sara Khalid', assignment1: 100, midTerm: 95, final: 98 },
        { id: 'STU-103', name: 'Ziad Fahad', assignment1: 75, midTerm: 80, final: 85 },
    ]);

    const calculateGrade = (student: any) => {
        const avg = (student.assignment1 * 0.2) + (student.midTerm * 0.3) + (student.final * 0.5);
        if (avg >= 90) return 'A';
        if (avg >= 80) return 'B';
        if (avg >= 70) return 'C';
        if (avg >= 60) return 'D';
        return 'F';
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Teacher Gradebook</h1>
                <Button>Save Grades</Button>
            </div>
            
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Class: Mathematics 101</CardTitle>
                        <select className="border p-2 rounded text-sm">
                            <option>Term 1 (Fall 2026)</option>
                            <option>Term 2 (Spring 2027)</option>
                        </select>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-4 py-3">Student ID</th>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Assignment 1 (20%)</th>
                                    <th className="px-4 py-3">Mid-Term (30%)</th>
                                    <th className="px-4 py-3">Final Exam (50%)</th>
                                    <th className="px-4 py-3 text-center">Final Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((stu, idx) => (
                                    <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                        <td className="px-4 py-3 font-mono text-gray-500">{stu.id}</td>
                                        <td className="px-4 py-3 font-bold">{stu.name}</td>
                                        <td className="px-4 py-3"><Input type="number" defaultValue={stu.assignment1} className="w-20" /></td>
                                        <td className="px-4 py-3"><Input type="number" defaultValue={stu.midTerm} className="w-20" /></td>
                                        <td className="px-4 py-3"><Input type="number" defaultValue={stu.final} className="w-20" /></td>
                                        <td className="px-4 py-3 text-center font-bold text-xl text-blue-600">{calculateGrade(stu)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
