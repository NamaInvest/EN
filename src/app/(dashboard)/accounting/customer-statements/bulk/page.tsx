"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function BulkRunPage() {
    const [loading, setLoading] = useState(false);

    const handleRun = async () => {
        setLoading(true);
        setTimeout(() => {
            alert('Bulk batch submitted successfully');
            setLoading(false);
        }, 1500);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Bulk Statement Run</h1>
                <p className="text-muted-foreground">Generate and dispatch statements for multiple customers</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Batch Parameters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Customer Segment</Label>
                        <Select defaultValue="all">
                            <SelectTrigger>
                                <SelectValue placeholder="Select segment" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Active Customers (Auto-Email Enabled)</SelectItem>
                                <SelectItem value="vip">VIP Customers</SelectItem>
                                <SelectItem value="overdue">Customers with Overdue Balance</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Date From</Label>
                            <Input type="date" />
                        </div>
                        <div className="space-y-2">
                            <Label>Date To</Label>
                            <Input type="date" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Template Override</Label>
                        <Select defaultValue="default">
                            <SelectTrigger>
                                <SelectValue placeholder="Select template" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">Use Customer Default</SelectItem>
                                <SelectItem value="1">Standard Bilingual</SelectItem>
                                <SelectItem value="2">Detailed Arabic</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline">Preview Count</Button>
                    <Button onClick={handleRun} disabled={loading}>
                        {loading ? 'Processing...' : 'Run Batch Dispatch'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
