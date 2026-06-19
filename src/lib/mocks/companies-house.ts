// Mock Companies House API — FR-CDD001, FR-CDD002
// Real integration: https://developer.company-information.service.gov.uk/

export interface CHCompany {
  companyNumber: string;
  companyName: string;
  companyStatus: 'active' | 'dissolved' | 'liquidation' | 'administration';
  companyType: string;
  incorporatedOn: string;
  registeredAddress: {
    addressLine1: string;
    locality: string;
    postalCode: string;
    country: string;
  };
  sicCodes: string[];
  officers: CHOfficer[];
  pscs: CHPSC[]; // Persons with Significant Control
}

export interface CHOfficer {
  name: string;
  role: string;
  appointedOn: string;
  resignedOn?: string;
  nationality?: string;
  dateOfBirth?: { month: number; year: number };
  address: { addressLine1: string; locality: string; postalCode: string };
}

export interface CHPSC {
  name: string;
  naturesOfControl: string[];
  notifiedOn: string;
  ceasedOn?: string;
  nationality?: string;
  dateOfBirth?: { month: number; year: number };
  countryOfResidence?: string;
}

const MOCK_COMPANIES: Record<string, CHCompany> = {
  '12345678': {
    companyNumber: '12345678',
    companyName: 'Apex Property Holdings Ltd',
    companyStatus: 'active',
    companyType: 'ltd',
    incorporatedOn: '2018-03-15',
    registeredAddress: {
      addressLine1: '10 Canary Wharf',
      locality: 'London',
      postalCode: 'E14 5AB',
      country: 'England',
    },
    sicCodes: ['68100', '68209'],
    officers: [
      {
        name: 'James Thornton',
        role: 'director',
        appointedOn: '2018-03-15',
        nationality: 'British',
        dateOfBirth: { month: 7, year: 1975 },
        address: { addressLine1: '10 Canary Wharf', locality: 'London', postalCode: 'E14 5AB' },
      },
    ],
    pscs: [
      {
        name: 'James Thornton',
        naturesOfControl: ['ownership-of-shares-75-to-100-percent'],
        notifiedOn: '2018-03-15',
        nationality: 'British',
        dateOfBirth: { month: 7, year: 1975 },
        countryOfResidence: 'England',
      },
    ],
  },
  '99999999': {
    companyNumber: '99999999',
    companyName: 'Offshore Shell Ventures Ltd',
    companyStatus: 'active',
    companyType: 'ltd',
    incorporatedOn: '2021-01-10',
    registeredAddress: {
      addressLine1: '1 Nominee Services',
      locality: 'Douglas',
      postalCode: 'IM1 1AA',
      country: 'Isle of Man',
    },
    sicCodes: ['64209'],
    officers: [
      {
        name: 'Nominee Director Services Ltd',
        role: 'director',
        appointedOn: '2021-01-10',
        address: { addressLine1: '1 Nominee Services', locality: 'Douglas', postalCode: 'IM1 1AA' },
      },
    ],
    pscs: [], // No PSC — red flag
  },
};

export async function lookupCompany(companyNumber: string): Promise<CHCompany | null> {
  await delay(120);
  return MOCK_COMPANIES[companyNumber] ?? generateMockCompany(companyNumber);
}

export async function searchCompanies(query: string): Promise<CHCompany[]> {
  await delay(150);
  const lower = query.toLowerCase();
  const matches = Object.values(MOCK_COMPANIES).filter(c =>
    c.companyName.toLowerCase().includes(lower) || c.companyNumber.includes(query)
  );
  return matches.length ? matches : [generateMockCompany('10000001')];
}

function generateMockCompany(companyNumber: string): CHCompany {
  return {
    companyNumber,
    companyName: `Mock Company ${companyNumber} Ltd`,
    companyStatus: 'active',
    companyType: 'ltd',
    incorporatedOn: '2020-06-01',
    registeredAddress: {
      addressLine1: '1 Business Park',
      locality: 'Manchester',
      postalCode: 'M1 1AA',
      country: 'England',
    },
    sicCodes: ['68100'],
    officers: [
      {
        name: 'Test Director',
        role: 'director',
        appointedOn: '2020-06-01',
        nationality: 'British',
        address: { addressLine1: '1 Business Park', locality: 'Manchester', postalCode: 'M1 1AA' },
      },
    ],
    pscs: [
      {
        name: 'Test Director',
        naturesOfControl: ['ownership-of-shares-75-to-100-percent'],
        notifiedOn: '2020-06-01',
        nationality: 'British',
      },
    ],
  };
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
