"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Paintbrush, LayoutTemplate, Plus } from 'lucide-react';

export default function StatementTemplatesPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Statement Templates</h1>
                    <p className="text-muted-foreground">Design and manage customer statement layouts</p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" /> New Template
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-primary">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-xl">Standard Bilingual</CardTitle>
                            <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">Default</span>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="h-32 bg-muted rounded-md flex items-center justify-center border border-dashed">
                            <LayoutTemplate className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>AR + EN</span>
                            <span>ZATCA Compliant</span>
                        </div>
                        <div className="flex gap-2">
                            <Button className="w-full" variant="outline">Edit</Button>
                            <Button className="w-full" variant="outline">Preview</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-xl">Detailed Arabic</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="h-32 bg-muted rounded-md flex items-center justify-center border border-dashed">
                            <Paintbrush className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>AR Only</span>
                            <span>Standard</span>
                        </div>
                        <div className="flex gap-2">
                            <Button className="w-full" variant="outline">Edit</Button>
                            <Button className="w-full" variant="outline">Preview</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
