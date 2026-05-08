import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {

  try {
    const sequences = await prisma.numberingSequence.findMany({
            take: 100,
      orderBy: { code: 'asc' },
    });
    
    // We need to convert BigInt to string so it can be serialized to JSON
    const serializedSequences = sequences.map((seq: any) => ({
      ...seq,
      current: seq.current.toString(),
    }));

    return NextResponse.json({ sequences: serializedSequences });
  } catch (error: any) {
    console.error('Error fetching numbering sequences:', error);
    return NextResponse.json({ error: 'Failed to fetch numbering sequences' }, { status: 500 });
  }
}
