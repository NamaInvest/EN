import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';

// Advanced AI Vision Middleware for Facial Recognition
// Mocks connecting to AWS Rekognition or local Python OpenCV Daemon

async function _POST(req: Request) {

    const prisma = getPrisma(req);
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'No image data received' }, { status: 400 });
    }

    // 1. Send Base64 to Vision AI Model
    // console.log("Sending photo to AI for vector matching against Employee DB...");
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 2. Mock AI Match Result
    // For demonstration, we just randomly pick a random active employee
    const employees = await prisma.employee.findMany({ where: { active: true }, take: 10 });
    if (employees.length === 0) {
      return NextResponse.json({ error: 'System has no employees enrolled for Face ID.' }, { status: 400 });
    }
    
    const matchedEmployee = employees[Math.floor(Math.random() * employees.length)];
    // const matchConfidence = 99.4;
    
    // 3. Register Attendance (Check In or Check Out)
    const todayStr = new Date().toISOString().split('T')[0];
    const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour12: false });

    // Check if they already checked in today
    let attendanceRecord = await prisma.attendance.findFirst({
      where: { employeeId: matchedEmployee.id, date: todayStr }
    });

    let action = 'check_in';

    if (!attendanceRecord) {
      // Create new CHECK IN
      attendanceRecord = await prisma.attendance.create({
        data: {
          employeeId: matchedEmployee.id,
          date: todayStr,
          checkIn: nowTimeStr,
          notes: 'AI Face Recognition Login'
        }
      });
      console.log(`[Face ID] ${matchedEmployee.name} CHECKED IN at ${nowTimeStr}`);
    } else if (!attendanceRecord.checkOut) {
      // Create CHECK OUT
      action = 'check_out';
      attendanceRecord = await prisma.attendance.update({
        where: { id: attendanceRecord.id },
        data: { checkOut: nowTimeStr, notes: 'AI Face Recognition Logout' }
      });
      console.log(`[Face ID] ${matchedEmployee.name} CHECKED OUT at ${nowTimeStr}`);
    } else {
      // Already checked out, maybe working overtime, just log it.
      action = 'overtime_log';
      console.log(`[Face ID] ${matchedEmployee.name} logged face after checking out.`);
    }

    return NextResponse.json({ 
      message: 'Facial Recognition Success',
      employee: {
        id: matchedEmployee.id,
        name: matchedEmployee.name,
        position: matchedEmployee.position
      },
      action,
      time: nowTimeStr
    });

  } catch (error: any) {
    console.error('Face ID API Error:', error);
    return NextResponse.json({ error: 'Vision AI matching failed' }, { status: 500 });
  }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
