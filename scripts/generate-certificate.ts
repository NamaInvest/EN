import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

/**
 * Generates a professional PDF certificate using Puppeteer.
 * @param userId The ID or name of the user receiving the certificate.
 * @param courseId The course/module they completed.
 * @param score Their final score.
 */
export async function generateCertificate(userId: string, courseId: string, score: number) {
    console.log(`🎓 Generating PDF Certificate for User ${userId}, Course: ${courseId} (Score: ${score}%)`);
    
    const outputDir = path.resolve(process.cwd(), 'public/certificates');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const fileName = `cert-${userId}-${courseId}.pdf`;
    const outputPath = path.join(outputDir, fileName);

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Arial', sans-serif; text-align: center; color: #333; margin: 0; padding: 0; background-color: #f9f9f9; }
                .cert-container { border: 15px solid #004d40; width: 800px; height: 600px; padding: 50px; margin: 50px auto; background-color: white; position: relative; }
                .cert-header { font-size: 40px; font-weight: bold; color: #004d40; margin-bottom: 20px; text-transform: uppercase; }
                .cert-subheader { font-size: 20px; color: #555; margin-bottom: 50px; }
                .cert-body { font-size: 24px; margin-bottom: 40px; }
                .cert-name { font-size: 36px; font-weight: bold; color: #d32f2f; text-decoration: underline; margin: 20px 0; }
                .cert-course { font-size: 28px; font-weight: bold; color: #1976d2; margin: 20px 0; }
                .cert-footer { font-size: 18px; color: #777; position: absolute; bottom: 50px; width: calc(100% - 100px); display: flex; justify-content: space-between; }
                .signature { border-top: 2px solid #333; padding-top: 10px; width: 250px; }
            </style>
        </head>
        <body>
            <div class="cert-container">
                <div class="cert-header">Certificate of Completion</div>
                <div class="cert-subheader">Nama Invest Enterprise Training System</div>
                
                <div class="cert-body">
                    This is to proudly certify that
                    <div class="cert-name">${userId}</div>
                    has successfully completed the enterprise module:
                    <div class="cert-course">${courseId}</div>
                    with an outstanding score of <strong>${score}%</strong>.
                </div>
                
                <div class="cert-footer">
                    <div class="signature">
                        <strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')}
                    </div>
                    <div class="signature">
                        <strong>Authorized Signature</strong>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

    try {
        const browser = await puppeteer.launch({ 
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true 
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
        
        await page.pdf({ 
            path: outputPath, 
            format: 'A4', 
            landscape: true, 
            printBackground: true 
        });
        
        await browser.close();
        console.log(`✅ PDF Certificate successfully generated at public/certificates/${fileName}`);
        
        return `/certificates/${fileName}`;
    } catch (error) {
        console.error('❌ Failed to generate PDF certificate:', error);
        throw error;
    }
}

