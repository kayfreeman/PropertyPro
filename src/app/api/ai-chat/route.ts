import { NextResponse } from 'next/server';

// Mock AI chat response endpoint
// In production, this would connect to an LLM service
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message } = body as { message: string };

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const lower = message.toLowerCase();

    let response: string;

    if (lower.includes('mlr') || lower.includes('money laundering') || lower.includes('cdd')) {
      response = 'The UK Money Laundering Regulations 2017 (MLR 2017) require regulated businesses to perform Customer Due Diligence (CDD) when establishing a business relationship, carrying out occasional transactions over €15,000, or when there is suspicion of money laundering. PropComply automates CDD through its Trust Ladder framework.';
    } else if (lower.includes('trust ladder') || lower.includes('trust level')) {
      response = 'The PropComply Trust Ladder is a 6-level identity assurance framework ranging from Level 0 (Self-Declared) to Level 5 (Government Verified). Each level requires additional evidence and verification, unlocking more capabilities like Right to Rent verification, guarantor replacement, and banking referrals.';
    } else if (lower.includes('right to rent') || lower.includes('immigration')) {
      response = 'Right to Rent verification is mandated by the Immigration Act 2014. PropComply automates this through Home Office database integration, requiring Trust Level 2+ (Biometric Verified). Civil penalties of up to £3,000 per tenant apply for non-compliance.';
    } else if (lower.includes('enhanced due diligence') || lower.includes('edd')) {
      response = 'Enhanced Due Diligence (EDD) is triggered under UK MLR 2017 Reg.33 for PEPs, high-risk jurisdictions, complex transactions, sanctions hits, adverse media, and unusual transaction patterns. PropComply automatically escalates these cases to the compliance team.';
    } else {
      response = 'Thank you for your query. PropComply provides automated compliance tools covering AML, KYC, CDD, EDD, sanctions screening, and Right to Rent verification — all aligned with UK MLR 2017, UK GDPR, FCA Guidance, and Immigration Act 2014. Could you specify which area you need guidance on?';
    }

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI Chat POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
