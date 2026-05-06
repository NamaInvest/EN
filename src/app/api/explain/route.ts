import ollama from 'ollama'

export async function POST(req: Request) {
    const { sectionName } = await req.json()

    // هنا نطلب من النموذج المحلي شرح القسم بناءً على فهمه للملفات
    const response = await ollama.chat({
        model: 'llama3',
        messages: [{ role: 'user', content: `اشرح لي وظيفة القسم التالي في نظام Nama ERP: ${sectionName}` }],
    })

    return Response.json({ explanation: response.message.content })
}