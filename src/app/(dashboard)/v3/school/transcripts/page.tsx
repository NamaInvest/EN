'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TranscriptGeneratorPage() {
    const [students] = useState([
        { id: 'STU-101', name: 'Omar Ali', grade: '10th Grade', gpa: 3.8, status: 'Graduated' },
        { id: 'STU-102', name: 'Sara Khalid', grade: '12th Grade', gpa: 3.9, status: 'Active' },
    ]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Transcript Generator</h1>
                <Button>Generate Bulk Transcripts</Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Students Eligible for Transcript</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-4 py-3">Student ID</th>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Grade Level</th>
                                    <th className="px-4 py-3">Cumulative GPA</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((stu, idx) => (
                                    <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                        <td className="px-4 py-3 font-mono text-gray-500">{stu.id}</td>
                                        <td className="px-4 py-3 font-bold">{stu.name}</td>
                                        <td className="px-4 py-3">{stu.grade}</td>
                                        <td className="px-4 py-3 font-bold text-blue-600">{stu.gpa}</td>
                                        <td className="px-4 py-3 text-gray-600">{stu.status}</td>
                                        <td className="px-4 py-3 text-right">
                                            <Button size="sm" variant="outline" className="text-green-600 border-green-500">Generate PDF</Button>
                                        </td>
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
