import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { requireSession } from '@/lib/session';

const SYSTEM_PROMPT = `You are PropComply AI, a specialist compliance assistant for UK property sector AML/KYC.

Your expertise covers:
- UK Money Laundering Regulations 2017 (MLR 2017) — CDD, EDD, SDD, ongoing monitoring
- FATF guidance on property sector money laundering risks
- MLR 2017 Reg.21 — MLRO designation, SAR obligations, tipping-off (s.333A POCA 2002)
- HM Treasury Sanctions (UK Sanctions Act 2018, OFSI guidance)
- FCA AML guidance for estate/letting agents
- UK GDPR / Data Protection Act 2018 — lawful basis, data minimisation, retention
- Immigration Act 2014 / Right to Rent scheme — civil penalties, share codes, BRP checks
- HMRC AML Supervision for estate agents
- Companies House — UBO resolution, PSC register, corporate CDD
- EPC/MEES regulations (Minimum Energy Efficiency Standards)
- HMO licensing requirements (Housing Act 2004, local licensing schemes)

Guidelines:
- Give precise, actionable guidance grounded in UK statute and regulatory guidance
- Always note when professional legal/compliance advice should be sought
- Never disclose or hint at whether a specific SAR has been, or may be, filed (tipping-off)
- Cite the relevant regulation, section, or guidance document where appropriate
- Be concise but thorough`;

export async function POST(request: Request) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { message, conversationHistory } = body as {
      message: string;
      conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    };

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // If no API key is configured, fall back to keyword-matched static responses
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        response: getFallbackResponse(message),
        timestamp: new Date().toISOString(),
        fallback: true,
      });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const messages: Anthropic.MessageParam[] = [
      ...(conversationHistory ?? []),
      { role: 'user', content: message },
    ];

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const content = response.content[0];
    const text = content.type === 'text' ? content.text : '';

    return NextResponse.json({
      response: text,
      timestamp: new Date().toISOString(),
      usage: response.usage,
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    // Graceful fallback if API call fails
    const body = await request.json().catch(() => ({}));
    return NextResponse.json({
      response: getFallbackResponse((body as Record<string, unknown>).message as string || ''),
      timestamp: new Date().toISOString(),
      fallback: true,
    });
  }
}

function getFallbackResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('mlr') || lower.includes('money laundering') || lower.includes('cdd')) {
    return 'Under UK MLR 2017, regulated firms must apply CDD when establishing a business relationship, for occasional transactions over €15,000, or when suspicious of money laundering or terrorist financing. PropComply automates CDD through its Trust Ladder framework.';
  }
  if (lower.includes('trust ladder') || lower.includes('trust level')) {
    return 'The PropComply Trust Ladder is a 6-level identity assurance framework (Level 0–5). Each level requires additional evidence — from self-declaration through to government-verified credentials — unlocking capabilities such as Right to Rent verification and guarantor replacement.';
  }
  if (lower.includes('right to rent') || lower.includes('immigration')) {
    return 'Right to Rent is mandated by Immigration Act 2014 s.20. Landlords and agents must check all adult occupiers have the right to rent in England. Civil penalties up to £3,000 per occupier apply. PropComply automates this via Home Office share codes and biometric checks at Trust Level 2+.';
  }
  if (lower.includes('enhanced due diligence') || lower.includes('edd')) {
    return 'EDD is required under MLR 2017 Reg.33 for PEPs, high-risk third countries, complex/unusual transactions, and sanctions hits. It requires establishing source of funds, source of wealth, and obtaining senior management approval before proceeding. MLRO sign-off is mandatory.';
  }
  if (lower.includes('sar') || lower.includes('suspicious activity')) {
    return 'SARs must be submitted to the National Crime Agency (NCA) under POCA 2002 s.330 where a suspicion of money laundering arises. The MLRO is the designated authority. Tipping off — disclosing that a SAR has been made — is a criminal offence under s.333A POCA 2002.';
  }
  if (lower.includes('epc') || lower.includes('mees')) {
    return 'Under the Minimum Energy Efficiency Standards (MEES) Regulations 2015, privately rented properties in England must achieve at least an EPC rating of E. Properties rated F or G cannot lawfully be let. PropComply flags EPC ratings below E as a property risk signal.';
  }
  return 'PropComply AI provides guidance on UK AML/KYC compliance for the property sector, covering MLR 2017, Right to Rent, sanctions screening, EDD, and MLRO obligations. Please specify your compliance query and I will provide targeted guidance.';
}
