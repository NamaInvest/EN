import { NextResponse } from 'next/server';

export async function GET() {
    // This API provides the latest version for the desktop application.
    // In production, this can be managed via DB, but hardcoding for now as requested.
    return NextResponse.json({
        success: true,
        version: '1.0.0', // Update this when releasing a new desktop version
        mandatory: true,
        downloadUrl: 'https://namainvist.com/download/latest.exe',
        releaseNotes: 'Performance improvements and bug fixes.'
    });
}
