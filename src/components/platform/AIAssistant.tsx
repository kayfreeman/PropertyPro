'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Shield,
  FileCheck,
  Landmark,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

// Types
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Suggested questions
const SUGGESTED_QUESTIONS = [
  'What are the UK MLR 2017 requirements for CDD?',
  'How does the Trust Ladder work?',
  'Explain Right to Rent verification process',
  'What triggers Enhanced Due Diligence?',
];

// Regulatory badges
const REGULATORY_BADGES = [
  { name: 'UK GDPR', icon: <Shield className="size-3" />, color: '#10b981', bg: '#ecfdf5' },
  { name: 'UK MLR 2017', icon: <FileCheck className="size-3" />, color: '#0d9488', bg: '#f0fdfa' },
  { name: 'FCA Guidance', icon: <Landmark className="size-3" />, color: '#8b5cf6', bg: '#f5f3ff' },
  { name: 'Immigration Act 2014', icon: <AlertTriangle className="size-3" />, color: '#f59e0b', bg: '#fffbeb' },
];

// Mock AI responses based on keywords
function generateMockResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('mlr') || lower.includes('money laundering') || lower.includes('cdd')) {
    return `The UK Money Laundering Regulations 2017 (MLR 2017) require regulated businesses to perform Customer Due Diligence (CDD) when:\n\n• Establishing a business relationship\n• Carrying out occasional transactions over €15,000\n• There is a suspicion of money laundering or terrorist financing\n• The customer's verification status changes\n\nCDD involves:\n1. **Identifying the customer** — Full name, date of birth, address\n2. **Verifying identity** — Passport, national ID, biometric verification\n3. **Identifying beneficial owners** — For corporate entities (25%+ threshold)\n4. **Understanding the business relationship** — Purpose, nature, expected activity\n\nPropComply automates CDD through its Trust Ladder, with Level 1 (Document Verified) satisfying basic CDD requirements and Level 5 (Government Verified) providing the highest assurance.`;
  }

  if (lower.includes('trust ladder') || lower.includes('trust level')) {
    return `The PropComply Trust Ladder is a 6-level identity assurance framework:\n\n**Level 0 — Self-Declared**: Basic identity assertion, no verification\n**Level 1 — Document Verified**: Passport, National ID, Visa, Residence Permit verified\n**Level 2 — Biometric Verified**: Face match and liveness detection completed\n**Level 3 — Behaviour Verified**: Open Banking, income validation, financial behaviour analysis\n**Level 4 — Institutional Verified**: Employer, university, professional verification\n**Level 5 — Government Verified**: Government database verification (where legally available)\n\nEach level builds upon the previous, requiring additional evidence and verification. Higher trust levels unlock more capabilities:\n\n• Level 2+: Right to Rent verification\n• Level 3+: Guarantor replacement eligibility\n• Level 3+: Banking partner referrals\n• Level 4+: Enhanced credit assessments\n• Level 5+: Streamlined regulatory reporting`;
  }

  if (lower.includes('right to rent') || lower.includes('immigration')) {
    return `The Right to Rent verification process is mandated by the Immigration Act 2014, Section 22:\n\n**Legal Requirement**: All landlords in England must verify that tenants aged 18+ have the right to rent in the UK.\n\n**Process in PropComply**:\n1. **Identity Verification** — Tenant profile must reach Trust Level 2 (Biometric Verified)\n2. **Document Check** — Passport/ID + visa/residence permit verified\n3. **Home Office Check** — Automated query to Home Office database\n4. **Status Determination** — Verified, Pending, Failed, or Expired\n\n**Penalties**: Civil penalties of up to £3,000 per tenant for non-compliance.\n\n**Time-limited vs. Unlimited**: EEA/Swiss nationals have unlimited right to rent. Non-EEA nationals may have time-limited status requiring follow-up checks at expiry.\n\nPropComply automatically flags upcoming expirations and triggers re-verification workflows.`;
  }

  if (lower.includes('enhanced due diligence') || lower.includes('edd')) {
    return `Enhanced Due Diligence (EDD) is required under UK MLR 2017 Reg.33 in the following circumstances:\n\n**Automatic Triggers**:\n1. **PEP Identification** — Customer is a Politically Exposed Person or associated with one\n2. **High-risk jurisdiction** — Customer or transaction linked to a high-risk country (FATF list)\n3. **Complex transactions** — Unusually large or complex business relationships\n4. **Sanctions screening hits** — Potential matches on global sanctions lists\n5. **Adverse media** — Negative news screening flags\n6. **Unusual transaction patterns** — Suspicious behaviour or inconsistent financial activity\n\n**EDD Requirements**:\n• Enhanced source of funds verification\n• Senior management approval for the business relationship\n• Ongoing monitoring with increased frequency\n• Additional identity verification steps\n• Detailed documentation and audit trail\n\nIn PropComply, EDD is triggered automatically when compliance checks identify any of these risk factors. The platform escalates to the compliance team and requires sign-off before proceeding.`;
  }

  if (lower.includes('aml') || lower.includes('kyc')) {
    return `AML (Anti-Money Laundering) and KYC (Know Your Customer) are fundamental compliance requirements:\n\n**AML Checks** include:\n• Sanctions screening (OFAC, EU, UN lists)\n• PEP screening (Politically Exposed Persons)\n• Adverse media screening\n• Transaction monitoring\n• Suspicious Activity Reports (SARs)\n\n**KYC Process** involves:\n1. Customer Identification Program (CIP)\n2. Customer Due Diligence (CDD)\n3. Enhanced Due Diligence (EDD) where required\n4. Ongoing monitoring\n\nPropComply integrates all AML/KYC checks into a single workflow, triggered automatically during the verification process. Results are recorded with full audit trails for regulatory compliance.`;
  }

  if (lower.includes('guarantor')) {
    return `PropComply's Guarantor Replacement feature allows verified tenants to bypass traditional guarantor requirements:\n\n**Eligibility**: Trust Level 3+ (Behaviour Verified) with:\n• Compliance clearance (all checks passed)\n• Risk clearance (overall risk score ≥ 75)\n• Right to Rent verified\n\n**How It Works**:\n1. Profile reaches Trust Level 3+ through Open Banking, income, and behavioural verification\n2. Compliance and risk checks are automatically cleared\n3. A Guarantor Replacement Certificate is issued\n4. Partner landlords and letting agents accept this as an alternative to a traditional guarantor\n\n**Benefits**:\n• Removes financial barriers for renters\n• Faster tenancy applications\n• Data-driven trust instead of personal guarantees\n• Accepted across the PropComply partner ecosystem`;
  }

  return `Thank you for your question. Based on PropComply's compliance framework:\n\nThis is an important aspect of regulatory compliance. The platform provides automated tools for identity verification, compliance checking, risk assessment, and partner referrals — all built on UK regulatory requirements including:\n\n• **UK MLR 2017** — Money Laundering Regulations\n• **UK GDPR** — Data protection and privacy\n• **FCA Guidance** — Financial Conduct Authority requirements\n• **Immigration Act 2014** — Right to Rent obligations\n\nFor specific guidance on this topic, I'd recommend consulting with your compliance team or reviewing the relevant regulatory documentation. PropComply's automated checks ensure that all processes align with current regulatory requirements.\n\nWould you like me to explain any specific regulatory area in more detail?`;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Welcome to PropComply AI Assistant. I can help you with compliance queries, identity verification processes, risk assessments, and regulatory guidance. How can I assist you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      // Simulate AI response delay
      await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1200));

      const response = generateMockResponse(content);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    },
    [isLoading]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col max-h-[calc(100vh-8rem)]">
      <motion.div
        className="flex-1 flex flex-col min-h-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-teal-50 flex items-center justify-center">
                  <Bot className="size-5 text-teal-600" />
                </div>
                <div>
                  <CardTitle className="text-base">PropComply AI Assistant</CardTitle>
                  <CardDescription>Compliance & regulatory guidance chatbot</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className="font-medium"
                  style={{ backgroundColor: '#ecfdf5', color: '#10b981', borderColor: 'transparent' }}
                >
                  <Sparkles className="size-3 mr-1" />
                  Online
                </Badge>
              </div>
            </div>
            {/* Regulatory badges */}
            <div className="flex flex-wrap gap-2 mt-2">
              {REGULATORY_BADGES.map((badge) => (
                <Badge
                  key={badge.name}
                  className="font-medium text-xs gap-1"
                  style={{
                    backgroundColor: badge.bg,
                    color: badge.color,
                    borderColor: 'transparent',
                  }}
                >
                  {badge.icon}
                  {badge.name}
                </Badge>
              ))}
            </div>
          </CardHeader>

          <Separator />

          {/* Chat Messages Area */}
          <CardContent className="flex-1 min-h-0 p-0">
            <ScrollArea className="h-full max-h-[calc(100vh-22rem)]">
              <div className="p-4 space-y-4" ref={scrollRef}>
                <AnimatePresence mode="popLayout">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="size-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-1">
                          <Bot className="size-4 text-teal-600" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-teal-600 text-white rounded-br-md'
                            : 'bg-muted rounded-bl-md'
                        }`}
                      >
                        <div
                          className={`text-sm whitespace-pre-wrap leading-relaxed ${
                            message.role === 'assistant' ? 'prose-sm' : ''
                          }`}
                        >
                          {message.content.split('\n').map((line, i) => {
                            // Simple markdown-like bold rendering
                            const parts = line.split(/(\*\*[^*]+\*\*)/g);
                            return (
                              <span key={i}>
                                {i > 0 && <br />}
                                {parts.map((part, j) => {
                                  if (part.startsWith('**') && part.endsWith('**')) {
                                    return (
                                      <strong key={j}>{part.slice(2, -2)}</strong>
                                    );
                                  }
                                  // Handle bullet points
                                  if (part.startsWith('• ') || part.startsWith('•')) {
                                    return (
                                      <span key={j} className="flex items-start gap-1">
                                        <span className="shrink-0">•</span>
                                        <span>{part.replace(/^•\s*/, '')}</span>
                                      </span>
                                    );
                                  }
                                  return <span key={j}>{part}</span>;
                                })}
                              </span>
                            );
                          })}
                        </div>
                        <p
                          className={`text-xs mt-2 ${
                            message.role === 'user' ? 'text-teal-100' : 'text-muted-foreground'
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {message.role === 'user' && (
                        <div className="size-8 rounded-full bg-teal-600 flex items-center justify-center shrink-0 mt-1">
                          <User className="size-4 text-white" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Typing indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 justify-start"
                  >
                    <div className="size-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                      <Bot className="size-4 text-teal-600" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <motion.div
                          className="size-2 rounded-full bg-muted-foreground/50"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div
                          className="size-2 rounded-full bg-muted-foreground/50"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                        />
                        <motion.div
                          className="size-2 rounded-full bg-muted-foreground/50"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          <Separator />

          {/* Suggested Questions */}
          <div className="px-4 pt-3">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Sparkles className="size-3" />
              Suggested questions
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((question) => (
                <Button
                  key={question}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 rounded-full"
                  onClick={() => handleSuggestedQuestion(question)}
                  disabled={isLoading}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 pt-3">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about compliance, verification, risk assessment..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="bg-teal-600 hover:bg-teal-700 shrink-0"
              >
                <Send className="size-4" />
              </Button>
            </form>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
