import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';

// This Webhook receives messages sent back by employees/managers to the Official WhatsApp Number
// It allows for interactive DB mutations via text (e.g., "1" = approve, "2" = reject)

async function _POST(req: Request) {

    const prisma = getPrisma(req);
  try {
    const payload = await req.json();
    
    // Example Payload from Meta/WhatsApp Cloud API
    // { "entry": [ { "changes": [ { "value": { "messages": [ { "from": "9665XXXXXXXX", "text": { "body": "1" } } ] } } ] } ] }
    
    // Extract phone and message text safely
    const messages = payload?.entry?.[0]?.changes?.[0]?.value?.messages || [];
    if (!messages || messages.length === 0) {
      return NextResponse.json({ message: 'No messages found.' });
    }

    const message = messages[0];
    const incomingPhone = message.from; // Usually includes country code
    const textBody = message.text?.body?.trim();
    
    if (!textBody) return NextResponse.json({ message: 'Empty text body. Ignored.' });

    // 1. Identify the user by phone number
    // We normalize the phone number format to match DB (e.g. 05... vs 9665...)
    let localFormat = incomingPhone;
    if (incomingPhone.startsWith('966')) {
        localFormat = '0' + incomingPhone.substring(3);
    } else if (!incomingPhone.startsWith('0')) {
        localFormat = '0' + incomingPhone;
    }

    const user = await prisma.user.findFirst({
        where: { phone: localFormat }
    });

    if (!user) {
        return NextResponse.json({ message: 'Sender not identified in the User database.' });
    }

    // 2. Find any PENDING Approval Requests where this user is the required Approver
    // We check ApprovalStep for this user + pending status
    const pendingStep = await prisma.approvalStep.findFirst({
        where: { approverId: user.id, status: 'pending' },
        orderBy: { id: 'asc' } // Oldest pending first
    });

    if (!pendingStep) {
        // Just log generic chatter
        console.log(`[WhatsApp Agent] Unhandled chat from ${user.fullName}: ${textBody}`);
        return NextResponse.json({ message: 'No pending approvals for this user.' });
    }

    // 3. Process the explicit commands (1 = Approve, 2 = Reject, 3 = Info)
    if (textBody === '1' || textBody.toLowerCase() === 'نعم' || textBody.toLowerCase() === 'موافق') {
        // Approve Step
        await prisma.approvalStep.update({
            where: { id: pendingStep.id },
            data: { status: 'approved', actionDate: new Date() }
        });
        
        // Let's assume this means the entire request is approved for simplicity unless multi-step
        await prisma.approvalRequest.update({
            where: { id: pendingStep.requestId },
            data: { status: 'approved' }
        });

        console.log(`[WhatsApp Agent] ${user.fullName} approved request #${pendingStep.requestId} via WhatsApp.`);

        // In a real app we'd dispatch a WhatsApp reply back saying: "✅ تمت الموافقة بنجاح!"
        // sendWhatsAppText(incomingPhone, "✅ تمت الموافقة بنجاح على الطلب وتم اعتماده في النظام المالي.");

    } else if (textBody === '2' || textBody.toLowerCase() === 'لا' || textBody.toLowerCase() === 'رفض') {
        // Reject Step
        await prisma.approvalStep.update({
            where: { id: pendingStep.id },
            data: { status: 'rejected', actionDate: new Date(), notes: 'مرفوض عبر الواتساب' }
        });
        
        await prisma.approvalRequest.update({
            where: { id: pendingStep.requestId },
            data: { status: 'rejected' }
        });

        console.log(`[WhatsApp Agent] ${user.fullName} REJECTED request #${pendingStep.requestId} via WhatsApp.`);
    } else if (textBody === '3' || textBody.toLowerCase() === 'تفاصيل') {
        console.log(`[WhatsApp Agent] Replying with details for request #${pendingStep.requestId}`);
        // In a real app we'd reply with more detail.
    } else {
        console.log(`[WhatsApp Agent] Unrecognized command '${textBody}' from ${user.fullName}. Reminding them of the format.`);
    }

    return NextResponse.json({ message: 'Webhook Processed' });
  } catch (error: any) {
    console.error('WhatsApp Webhook Error:', error);
    return NextResponse.json({ error: 'Failed to process WhatsApp Webhook' }, { status: 500 });
  }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
