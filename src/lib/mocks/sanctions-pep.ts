// Mock Sanctions & PEP Screening — FR-CDD003, FR-AML001
// Covers: UN, EU, OFAC, HM Treasury (UK), PEP Level 1-4, Adverse Media
// Real providers: Dow Jones, World-Check, ComplyAdvantage, LexisNexis

export type ScreeningStatus = 'clear' | 'match' | 'possible_match' | 'error';

export interface ScreeningResult {
  status: ScreeningStatus;
  sanctionsMatch: boolean;
  pepMatch: boolean;
  adverseMediaMatch: boolean;
  pepLevel?: 1 | 2 | 3 | 4; // 1=head of state, 4=family member/associate
  matchDetails: MatchDetail[];
  screenedAt: string;
  provider: string;
  referenceId: string;
}

export interface MatchDetail {
  listName: string;
  matchType: 'exact' | 'fuzzy' | 'alias';
  matchScore: number; // 0-100
  reason: string;
  listedSince?: string;
}

// Seeded names that trigger mock matches for testing
const SANCTIONED_NAMES = ['Viktor Petrov', 'Irina Volkov', 'Hassan Al-Rashid', 'Dmitry Kazan'];
const PEP_NAMES = ['Sir Robert Harrington', 'Lady Charlotte Pemberton', 'The Hon. James Wickfield'];
const ADVERSE_NAMES = ['Marcus Drellinger', 'Chen Baoming'];

export async function screenIndividual(
  fullName: string,
  dateOfBirth?: string,
  nationality?: string
): Promise<ScreeningResult> {
  await delay(200);

  const name = fullName.trim();
  const sanctionsMatch = SANCTIONED_NAMES.some(n => nameMatch(name, n));
  const pepMatch = PEP_NAMES.some(n => nameMatch(name, n));
  const adverseMatch = ADVERSE_NAMES.some(n => nameMatch(name, n));

  const matchDetails: MatchDetail[] = [];

  if (sanctionsMatch) {
    matchDetails.push({
      listName: 'HM Treasury Consolidated List',
      matchType: 'exact',
      matchScore: 98,
      reason: 'Asset freeze — sanctions designation',
      listedSince: '2022-03-01',
    });
  }
  if (pepMatch) {
    matchDetails.push({
      listName: 'PEP Database — Level 2',
      matchType: 'exact',
      matchScore: 95,
      reason: 'Senior public official or close associate',
    });
  }
  if (adverseMatch) {
    matchDetails.push({
      listName: 'Adverse Media — Financial Crime',
      matchType: 'fuzzy',
      matchScore: 82,
      reason: 'Reported involvement in financial misconduct',
    });
  }

  const hasMatch = sanctionsMatch || pepMatch || adverseMatch;

  return {
    status: hasMatch ? 'match' : 'clear',
    sanctionsMatch,
    pepMatch,
    adverseMediaMatch: adverseMatch,
    pepLevel: pepMatch ? 2 : undefined,
    matchDetails,
    screenedAt: new Date().toISOString(),
    provider: 'PropComply Mock Screening v1',
    referenceId: `SCR-${Date.now()}`,
  };
}

export async function screenCorporate(
  companyName: string,
  companyNumber?: string
): Promise<ScreeningResult> {
  await delay(180);

  const isShell = companyName.toLowerCase().includes('shell') ||
    companyName.toLowerCase().includes('offshore') ||
    companyName.toLowerCase().includes('nominee');

  const matchDetails: MatchDetail[] = [];

  if (isShell) {
    matchDetails.push({
      listName: 'High-Risk Corporate Indicators',
      matchType: 'fuzzy',
      matchScore: 70,
      reason: 'Company name pattern associated with shell/nominee structures',
    });
  }

  return {
    status: isShell ? 'possible_match' : 'clear',
    sanctionsMatch: false,
    pepMatch: false,
    adverseMediaMatch: isShell,
    matchDetails,
    screenedAt: new Date().toISOString(),
    provider: 'PropComply Mock Screening v1',
    referenceId: `SCR-CORP-${Date.now()}`,
  };
}

function nameMatch(input: string, target: string): boolean {
  return input.toLowerCase().includes(target.toLowerCase()) ||
    target.toLowerCase().includes(input.toLowerCase());
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
