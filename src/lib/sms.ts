import prisma from './prisma';

/**
 * Normalizes phone numbers to standard international format (e.g., exactly '9665XXXXXXXX')
 * without the '+' sign, as preferred by Mena-region gateways.
 */
function normalizePhone(phone: string): string {
    let p = phone.replace(/\D/g, ''); // strip Non-digits
    if (p.startsWith('05')) {
        p = '966' + p.substring(1);
    } else if (p.startsWith('5')) {
        p = '966' + p;
    } else if (p.startsWith('00966')) {
        p = p.substring(2);
    }
    return p;
}

/**
 * Unified SMS Dispatcher.
 * Retrieves configured gateway from settings and executes the SMS API call.
 */
export async function sendSMS(phone: string, message: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const settings = await prisma.setting.findMany({
            where: { key: { in: ['sms_enabled', 'sms_provider', 'sms_api_key', 'sms_sender_id'] } }
        });
        
        const config: Record<string, string> = {};
        settings.forEach(s => config[s.key] = s.value || '');

        if (config['sms_enabled'] !== '1' || !config['sms_api_key'] || !config['sms_sender_id']) {
            return { success: false, error: 'SMS Gateway is not fully configured or is disabled.' };
        }

        const normalizedPhone = normalizePhone(phone);
        if (normalizedPhone.length < 9) {
            return { success: false, error: 'Invalid phone number length.' };
        }

        const provider = config['sms_provider'] || 'taqnyat';

        if (provider === 'taqnyat') {
            const res = await fetch('https://api.taqnyat.sa/v1/messages', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config['sms_api_key']}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    recipients: [normalizedPhone],
                    body: message,
                    sender: config['sms_sender_id']
                })
            });
            const data = await res.json();
            if (res.ok) {
                console.log('✅ SMS Sent via Taqnyat');
                return { success: true, data };
            } else {
                console.error('❌ Taqnyat API Error:', data);
                return { success: false, error: JSON.stringify(data) };
            }
        } 
        else if (provider === 'unifonic') {
            const formData = new URLSearchParams();
            formData.append('AppSid', config['sms_api_key']);
            formData.append('SenderID', config['sms_sender_id']);
            formData.append('Body', message);
            formData.append('Recipient', normalizedPhone);

            const res = await fetch('https://el.cloud.unifonic.com/rest/SMS/messages', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'content-type': 'application/x-www-form-urlencoded'
                },
                body: formData.toString()
            });
            const data = await res.json();
            if (res.ok) {
                console.log('✅ SMS Sent via Unifonic');
                return { success: true, data };
            } else {
                console.error('❌ Unifonic API Error:', data);
                return { success: false, error: JSON.stringify(data) };
            }
        }

        return { success: false, error: 'Unknown SMS provider configured.' };

    } catch (error: any) {
        console.error('SMS Dispatcher Exception:', error);
        return { success: false, error: error.message };
    }
}
