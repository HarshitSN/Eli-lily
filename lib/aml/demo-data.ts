// Demo data for AML Transaction Monitoring Agent
import { Transaction, Account } from './pattern-detector';

export const demoAccounts: Account[] = [
  // Shell companies for Round-Tripping pattern
  {
    id: 'ACC001',
    ownerName: 'Meridian Holdings Ltd',
    ownerType: 'corporate',
    riskProfile: 'high',
    jurisdiction: 'Cyprus',
    isShellCompany: true,
    beneficialOwners: ['BO001']
  },
  {
    id: 'ACC002',
    ownerName: 'Pacific Ventures Inc',
    ownerType: 'corporate',
    riskProfile: 'high',
    jurisdiction: 'BVI',
    isShellCompany: true,
    beneficialOwners: ['BO001']
  },
  // Legitimate business (origin of funds)
  {
    id: 'ACC003',
    ownerName: 'Global Tech Solutions',
    ownerType: 'corporate',
    riskProfile: 'low',
    jurisdiction: 'USA',
    isShellCompany: false,
    beneficialOwners: ['BO001']
  },
  // Funnel account operations
  {
    id: 'ACC004',
    ownerName: 'Sunrise Imports LLC',
    ownerType: 'corporate',
    riskProfile: 'high',
    jurisdiction: 'USA',
    isShellCompany: true,
    beneficialOwners: ['BO002']
  },
  // Money mules for funnel
  {
    id: 'ACC005',
    ownerName: 'John Smith',
    ownerType: 'individual',
    riskProfile: 'high',
    jurisdiction: 'USA',
    isShellCompany: false,
    beneficialOwners: []
  },
  {
    id: 'ACC006',
    ownerName: 'Jane Doe',
    ownerType: 'individual',
    riskProfile: 'high',
    jurisdiction: 'USA',
    isShellCompany: false,
    beneficialOwners: []
  },
  {
    id: 'ACC007',
    ownerName: 'Mike Johnson',
    ownerType: 'individual',
    riskProfile: 'high',
    jurisdiction: 'USA',
    isShellCompany: false,
    beneficialOwners: []
  },
  // Multi-tier layering accounts
  {
    id: 'ACC008',
    ownerName: 'Alpha Consulting Group',
    ownerType: 'corporate',
    riskProfile: 'medium',
    jurisdiction: 'UK',
    isShellCompany: true,
    beneficialOwners: ['BO003']
  },
  {
    id: 'ACC009',
    ownerName: 'Beta Investments Ltd',
    ownerType: 'corporate',
    riskProfile: 'medium',
    jurisdiction: 'Singapore',
    isShellCompany: true,
    beneficialOwners: ['BO003']
  },
  {
    id: 'ACC010',
    ownerName: 'Gamma Holdings Trust',
    ownerType: 'corporate',
    riskProfile: 'high',
    jurisdiction: 'Cayman Islands',
    isShellCompany: true,
    beneficialOwners: ['BO003']
  },
  // Synthetic identity ring
  {
    id: 'ACC011',
    ownerName: 'Robert Williams',
    ownerType: 'individual',
    riskProfile: 'high',
    jurisdiction: 'USA',
    isShellCompany: false,
    beneficialOwners: ['BO004']
  },
  {
    id: 'ACC012',
    ownerName: 'David Brown',
    ownerType: 'individual',
    riskProfile: 'high',
    jurisdiction: 'USA',
    isShellCompany: false,
    beneficialOwners: ['BO004']
  },
  {
    id: 'ACC013',
    ownerName: 'James Wilson',
    ownerType: 'individual',
    riskProfile: 'high',
    jurisdiction: 'USA',
    isShellCompany: false,
    beneficialOwners: ['BO004']
  },
  // Money circle accounts
  {
    id: 'ACC014',
    ownerName: 'Circle Corp A',
    ownerType: 'corporate',
    riskProfile: 'high',
    jurisdiction: 'USA',
    isShellCompany: true,
    beneficialOwners: ['BO005']
  },
  {
    id: 'ACC015',
    ownerName: 'Circle Corp B',
    ownerType: 'corporate',
    riskProfile: 'high',
    jurisdiction: 'USA',
    isShellCompany: true,
    beneficialOwners: ['BO005']
  },
  {
    id: 'ACC016',
    ownerName: 'Circle Corp C',
    ownerType: 'corporate',
    riskProfile: 'high',
    jurisdiction: 'USA',
    isShellCompany: true,
    beneficialOwners: ['BO005']
  },
  // Normal accounts for contrast
  {
    id: 'ACC017',
    ownerName: 'Regular Business Inc',
    ownerType: 'corporate',
    riskProfile: 'low',
    jurisdiction: 'USA',
    isShellCompany: false,
    beneficialOwners: []
  },
  {
    id: 'ACC018',
    ownerName: 'Individual Customer',
    ownerType: 'individual',
    riskProfile: 'low',
    jurisdiction: 'USA',
    isShellCompany: false,
    beneficialOwners: []
  }
];

// Generate demo transactions
function generateDemoTransactions(): Transaction[] {
  const transactions: Transaction[] = [];
  let txId = 1;
  const baseDate = new Date('2026-01-15');

  // Pattern 1: Round-Tripping (ACC003 -> ACC001 -> ACC002 -> ACC003)
  const roundTripAmounts = [50000, 75000, 60000];
  roundTripAmounts.forEach((amount, i) => {
    const day = i * 10;
    transactions.push({
      id: `TX${String(txId++).padStart(4, '0')}`,
      timestamp: new Date(baseDate.getTime() + day * 24 * 60 * 60 * 1000),
      fromAccount: 'ACC003',
      toAccount: 'ACC001',
      amount,
      currency: 'USD',
      type: 'wire',
      purpose: 'Investment payment',
      sourceCountry: 'USA',
      destinationCountry: 'Cyprus'
    });
    transactions.push({
      id: `TX${String(txId++).padStart(4, '0')}`,
      timestamp: new Date(baseDate.getTime() + (day + 2) * 24 * 60 * 60 * 1000),
      fromAccount: 'ACC001',
      toAccount: 'ACC002',
      amount,
      currency: 'USD',
      type: 'wire',
      purpose: 'Loan disbursement',
      sourceCountry: 'Cyprus',
      destinationCountry: 'BVI'
    });
    transactions.push({
      id: `TX${String(txId++).padStart(4, '0')}`,
      timestamp: new Date(baseDate.getTime() + (day + 5) * 24 * 60 * 60 * 1000),
      fromAccount: 'ACC002',
      toAccount: 'ACC003',
      amount: amount * 1.02,
      currency: 'USD',
      type: 'wire',
      purpose: 'Loan repayment with interest',
      sourceCountry: 'BVI',
      destinationCountry: 'USA'
    });
  });

  // Pattern 2: Funnel Account (Fan-In/Fan-Out)
  // Multiple small deposits to ACC004, then bulk transfer out
  for (let i = 0; i < 25; i++) {
    transactions.push({
      id: `TX${String(txId++).padStart(4, '0')}`,
      timestamp: new Date(baseDate.getTime() + i * 12 * 60 * 60 * 1000),
      fromAccount: ['ACC005', 'ACC006', 'ACC007'][i % 3],
      toAccount: 'ACC004',
      amount: 8000 + Math.floor(Math.random() * 1999),
      currency: 'USD',
      type: 'cash',
      purpose: 'Business revenue',
      sourceCountry: 'USA',
      destinationCountry: 'USA'
    });
  }
  // Fan-out to "suppliers"
  transactions.push({
    id: `TX${String(txId++).padStart(4, '0')}`,
    timestamp: new Date(baseDate.getTime() + 26 * 12 * 60 * 60 * 1000),
    fromAccount: 'ACC004',
    toAccount: 'ACC017',
    amount: 180000,
    currency: 'USD',
    type: 'wire',
    purpose: 'Supplier payment - Electronics',
    sourceCountry: 'USA',
    destinationCountry: 'China'
  });

  // Pattern 3: Multi-Tier Layering
  const layeringFlow = [
    { from: 'ACC003', to: 'ACC008', purpose: 'Consulting services', amount: 100000 },
    { from: 'ACC008', to: 'ACC009', purpose: 'Investment funding', amount: 95000 },
    { from: 'ACC009', to: 'ACC010', purpose: 'Loan disbursement', amount: 90000 },
  ];
  layeringFlow.forEach((flow, i) => {
    transactions.push({
      id: `TX${String(txId++).padStart(4, '0')}`,
      timestamp: new Date(baseDate.getTime() + (30 + i * 3) * 24 * 60 * 60 * 1000),
      fromAccount: flow.from,
      toAccount: flow.to,
      amount: flow.amount,
      currency: 'USD',
      type: 'wire',
      purpose: flow.purpose,
      sourceCountry: flow.from.includes('ACC003') ? 'USA' : (flow.from.includes('ACC008') ? 'UK' : 'Singapore'),
      destinationCountry: flow.to.includes('ACC008') ? 'UK' : (flow.to.includes('ACC009') ? 'Singapore' : 'Cayman Islands')
    });
  });

  // Pattern 4: Synthetic Identity Ring
  // Small transactions to build credibility, then larger transfers
  [11, 12, 13].forEach((accNum, idx) => {
    const accId = `ACC${accNum}`;
    for (let i = 0; i < 10; i++) {
      transactions.push({
        id: `TX${String(txId++).padStart(4, '0')}`,
        timestamp: new Date(baseDate.getTime() + (40 + i) * 24 * 60 * 60 * 1000),
        fromAccount: 'ACC018',
        toAccount: accId,
        amount: 500 + Math.random() * 500,
        currency: 'USD',
        type: 'ach',
        purpose: 'Payment',
        sourceCountry: 'USA',
        destinationCountry: 'USA'
      });
    }
    // Then large outflow
    transactions.push({
      id: `TX${String(txId++).padStart(4, '0')}`,
      timestamp: new Date(baseDate.getTime() + 55 * 24 * 60 * 60 * 1000),
      fromAccount: accId,
      toAccount: 'ACC010',
      amount: 8000,
      currency: 'USD',
      type: 'wire',
      purpose: 'Investment',
      sourceCountry: 'USA',
      destinationCountry: 'Cayman Islands'
    });
  });

  // Pattern 8: Money Circle (closed network)
  const circleFlows = [
    ['ACC014', 'ACC015'], ['ACC015', 'ACC016'], ['ACC016', 'ACC014'],
    ['ACC014', 'ACC015'], ['ACC015', 'ACC016'], ['ACC016', 'ACC014'],
    ['ACC014', 'ACC015'], ['ACC015', 'ACC016'], ['ACC016', 'ACC014'],
    ['ACC014', 'ACC015'], ['ACC015', 'ACC016'], ['ACC016', 'ACC014'],
  ];
  circleFlows.forEach((flow, i) => {
    transactions.push({
      id: `TX${String(txId++).padStart(4, '0')}`,
      timestamp: new Date(baseDate.getTime() + (60 + i * 2) * 24 * 60 * 60 * 1000),
      fromAccount: flow[0],
      toAccount: flow[1],
      amount: 15000 + Math.random() * 5000,
      currency: 'USD',
      type: 'ach',
      purpose: 'Invoice payment',
      sourceCountry: 'USA',
      destinationCountry: 'USA'
    });
  });

  // Pattern 9: Scatter-Gather (Smurfing)
  // Multiple people deposit just under $10k to same account
  for (let i = 0; i < 8; i++) {
    transactions.push({
      id: `TX${String(txId++).padStart(4, '0')}`,
      timestamp: new Date(baseDate.getTime() + (80 + i * 6) * 60 * 60 * 1000),
      fromAccount: `ACC${20 + i}`,
      toAccount: 'ACC017',
      amount: 9500 + Math.random() * 400,
      currency: 'USD',
      type: 'cash',
      purpose: 'Deposit',
      sourceCountry: 'USA',
      destinationCountry: 'USA'
    });
  }

  // Normal transactions (for contrast)
  for (let i = 0; i < 50; i++) {
    transactions.push({
      id: `TX${String(txId++).padStart(4, '0')}`,
      timestamp: new Date(baseDate.getTime() + Math.random() * 90 * 24 * 60 * 60 * 1000),
      fromAccount: 'ACC017',
      toAccount: 'ACC018',
      amount: 1000 + Math.random() * 5000,
      currency: 'USD',
      type: 'ach',
      purpose: 'Payment for services',
      sourceCountry: 'USA',
      destinationCountry: 'USA'
    });
  }

  return transactions;
}

export const demoTransactions = generateDemoTransactions();

// Demo alerts (pre-computed for the demo)
export const demoAlerts = [
  {
    id: 'alert-001',
    patternType: 'round_tripping' as const,
    severity: 'high' as const,
    riskScore: 75,
    involvedAccounts: ['ACC003', 'ACC001', 'ACC002'],
    transactionIds: ['TX0001', 'TX0002', 'TX0003', 'TX0004', 'TX0005', 'TX0006', 'TX0007', 'TX0008', 'TX0009'],
    patternIndicators: [
      'Circular fund flow: funds leaving ACC003 return via ACC001 and ACC002',
      'Shell companies in Cyprus and BVI involved',
      'Funds return within 5 days with ~2% interest (disguised)'
    ],
    timestamp: new Date(),
    status: 'open' as const
  },
  {
    id: 'alert-002',
    patternType: 'funnel_account' as const,
    severity: 'critical' as const,
    riskScore: 85,
    involvedAccounts: ['ACC004', 'ACC005', 'ACC006', 'ACC007', 'ACC017'],
    transactionIds: ['TX0010', 'TX0011', 'TX0012', 'TX0013', 'TX0014', 'TX0015', 'TX0034'],
    patternIndicators: [
      '25 deposits, each below $10,000 CTR threshold',
      '91% of balance transferred out within 24 hours',
      'Fan-In from multiple individuals → bulk wire to offshore supplier'
    ],
    timestamp: new Date(),
    status: 'open' as const
  },
  {
    id: 'alert-003',
    patternType: 'multi_tier_layering' as const,
    severity: 'high' as const,
    riskScore: 70,
    involvedAccounts: ['ACC003', 'ACC008', 'ACC009', 'ACC010'],
    transactionIds: ['TX0035', 'TX0036', 'TX0037'],
    patternIndicators: [
      '3-hop transfer chain detected',
      'Cross-border: USA → UK → Singapore → Cayman Islands',
      'Each transfer has different justification (consulting, investment, loan)'
    ],
    timestamp: new Date(),
    status: 'open' as const
  },
  {
    id: 'alert-004',
    patternType: 'synthetic_identity' as const,
    severity: 'high' as const,
    riskScore: 80,
    involvedAccounts: ['ACC011', 'ACC012', 'ACC013'],
    transactionIds: ['TX0038', 'TX0039', 'TX0040', 'TX0041', 'TX0042', 'TX0043', 'TX0044', 'TX0045', 'TX0046'],
    patternIndicators: [
      '3 accounts with shared beneficial owner BO004',
      'Seasoning behavior: small deposits for credibility building',
      'Large outflows to offshore shell company'
    ],
    timestamp: new Date(),
    status: 'open' as const
  },
  {
    id: 'alert-005',
    patternType: 'money_circle' as const,
    severity: 'high' as const,
    riskScore: 75,
    involvedAccounts: ['ACC014', 'ACC015', 'ACC016'],
    transactionIds: ['TX0047', 'TX0048', 'TX0049', 'TX0050', 'TX0051', 'TX0052', 'TX0053', 'TX0054', 'TX0055', 'TX0056', 'TX0057', 'TX0058'],
    patternIndicators: [
      'Closed network of 3 accounts',
      '100% of transactions stay within the circle',
      'Circular payment pattern: A→B→C→A repeated'
    ],
    timestamp: new Date(),
    status: 'open' as const
  },
  {
    id: 'alert-006',
    patternType: 'scatter_gather' as const,
    severity: 'critical' as const,
    riskScore: 90,
    involvedAccounts: ['ACC017', 'ACC020', 'ACC021', 'ACC022', 'ACC023', 'ACC024', 'ACC025', 'ACC026'],
    transactionIds: ['TX0059', 'TX0060', 'TX0061', 'TX0062', 'TX0063', 'TX0064', 'TX0065', 'TX0066'],
    patternIndicators: [
      '8 sources depositing to single account within 48 hours',
      'Total: $76,000 - all structured below $10,000',
      'Classic smurfing/structuring pattern'
    ],
    timestamp: new Date(),
    status: 'open' as const
  }
];
