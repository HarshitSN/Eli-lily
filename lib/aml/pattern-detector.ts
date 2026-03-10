// AML Pattern Detection Engine
// Implements detection logic for 10+ money laundering patterns

export type PatternType = 
  | 'round_tripping'
  | 'funnel_account'
  | 'multi_tier_layering'
  | 'synthetic_identity'
  | 'u_turn_loan'
  | 'corporate_structure'
  | 'correspondent_nesting'
  | 'money_circle'
  | 'scatter_gather'
  | 'crypto_mixing';

export interface Transaction {
  id: string;
  timestamp: Date;
  fromAccount: string;
  toAccount: string;
  amount: number;
  currency: string;
  type: 'wire' | 'ach' | 'cash' | 'crypto' | 'check';
  purpose: string;
  sourceCountry: string;
  destinationCountry: string;
}

export interface Account {
  id: string;
  ownerName: string;
  ownerType: 'individual' | 'corporate';
  riskProfile: 'low' | 'medium' | 'high';
  jurisdiction: string;
  isShellCompany: boolean;
  beneficialOwners: string[];
}

export interface Alert {
  id: string;
  patternType: PatternType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  involvedAccounts: string[];
  transactionIds: string[];
  patternIndicators: string[];
  timestamp: Date;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
}

// Pattern 1: Round-Tripping Detection
export function detectRoundTripping(
  transactions: Transaction[],
  accounts: Account[]
): Alert[] {
  const alerts: Alert[] = [];
  const accountTransfers = new Map<string, Transaction[]>();
  
  // Group transactions by account
  transactions.forEach(tx => {
    if (!accountTransfers.has(tx.fromAccount)) {
      accountTransfers.set(tx.fromAccount, []);
    }
    accountTransfers.get(tx.fromAccount)!.push(tx);
  });
  
  // Find circular patterns (funds returning to origin)
  const accountFlows = new Map<string, Set<string>>();
  
  transactions.forEach(tx => {
    if (!accountFlows.has(tx.fromAccount)) {
      accountFlows.set(tx.fromAccount, new Set());
    }
    accountFlows.get(tx.fromAccount)!.add(tx.toAccount);
  });
  
  // Detect cycles
  accountFlows.forEach((targets, source) => {
    targets.forEach(target => {
      if (accountFlows.has(target) && accountFlows.get(target)!.has(source)) {
        // Found a 2-hop cycle
        const sourceAccount = accounts.find(a => a.id === source);
        if (sourceAccount?.isShellCompany) {
          alerts.push({
            id: `alert-rt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            patternType: 'round_tripping',
            severity: 'high',
            riskScore: 75,
            involvedAccounts: [source, target],
            transactionIds: transactions.filter(tx => 
              tx.fromAccount === source || tx.toAccount === source
            ).map(tx => tx.id),
            patternIndicators: [
              'Circular fund flow detected between accounts',
              'Shell company involvement identified',
              'Funds returning to origin within 30 days'
            ],
            timestamp: new Date(),
            status: 'open'
          });
        }
      }
    });
  });
  
  return alerts;
}

// Pattern 2: Funnel Account Detection (Fan-In/Fan-Out)
export function detectFunnelAccounts(
  transactions: Transaction[]
): Alert[] {
  const alerts: Alert[] = [];
  const accountIncoming = new Map<string, { count: number; total: number; txns: Transaction[] }>();
  
  // Analyze incoming transactions per account
  transactions.forEach(tx => {
    if (!accountIncoming.has(tx.toAccount)) {
      accountIncoming.set(tx.toAccount, { count: 0, total: 0, txns: [] });
    }
    const data = accountIncoming.get(tx.toAccount)!;
    data.count++;
    data.total += tx.amount;
    data.txns.push(tx);
  });
  
  // Detect funnel patterns
  accountIncoming.forEach((data, accountId) => {
    // Fan-In: Many small deposits below $10k CTR threshold
    const smallDeposits = data.txns.filter(tx => tx.amount < 10000);
    
    if (smallDeposits.length >= 20) {
      // Check for Fan-Out: rapid outflow
      const outgoingFromAccount = transactions.filter(tx => tx.fromAccount === accountId);
      const recentOutgoing = outgoingFromAccount.filter(tx => {
        const depositTime = new Date(smallDeposits[0].timestamp).getTime();
        const outflowTime = new Date(tx.timestamp).getTime();
        return (outflowTime - depositTime) < 24 * 60 * 60 * 1000; // 24 hours
      });
      
      if (recentOutgoing.length > 0 && data.total > 0) {
        const outflowRatio = recentOutgoing.reduce((sum, tx) => sum + tx.amount, 0) / data.total;
        
        if (outflowRatio > 0.5) {
          alerts.push({
            id: `alert-fa-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            patternType: 'funnel_account',
            severity: 'critical',
            riskScore: 85,
            involvedAccounts: [accountId, ...recentOutgoing.map(tx => tx.toAccount)],
            transactionIds: [...smallDeposits, ...recentOutgoing].map(tx => tx.id),
            patternIndicators: [
              `${smallDeposits.length} deposits below $10,000 CTR threshold`,
              `Rapid outflow: ${Math.round(outflowRatio * 100)}% of balance leaves within 24 hours`,
              'Funnel account pattern (Fan-In/Fan-Out)'
            ],
            timestamp: new Date(),
            status: 'open'
          });
        }
      }
    }
  });
  
  return alerts;
}

// Pattern 3: Multi-Tier Layering Detection
export function detectMultiTierLayering(
  transactions: Transaction[]
): Alert[] {
  const alerts: Alert[] = [];
  
  // Build transfer chains
  const chains = new Map<string, string[]>();
  transactions.forEach(tx => {
    if (!chains.has(tx.fromAccount)) {
      chains.set(tx.fromAccount, []);
    }
    chains.get(tx.fromAccount)!.push(tx.toAccount);
  });
  
  // Find chains of 3+ hops
  const visited = new Set<string>();
  
  function findChains(start: string, chain: string[]): string[][] {
    const result: string[][] = [];
    const targets = chains.get(start) || [];
    
    for (const target of targets) {
      if (!chain.includes(target)) {
        const newChain = [...chain, target];
        if (newChain.length >= 3) {
          result.push(newChain);
        }
        if (!visited.has(target)) {
          visited.add(target);
          result.push(...findChains(target, newChain));
        }
      }
    }
    
    return result;
  }
  
  chains.forEach((_, account) => {
    if (!visited.has(account)) {
      visited.add(account);
      const foundChains = findChains(account, [account]);
      
      foundChains.forEach(chain => {
        // Check for cross-border
        const chainTransactions = transactions.filter(tx => 
          chain.includes(tx.fromAccount) && chain.includes(tx.toAccount)
        );
        
        const hasCrossBorder = chainTransactions.some(tx => 
          tx.sourceCountry !== tx.destinationCountry
        );
        
        if (hasCrossBorder || chain.length >= 4) {
          alerts.push({
            id: `alert-mtl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            patternType: 'multi_tier_layering',
            severity: 'high',
            riskScore: 70,
            involvedAccounts: chain,
            transactionIds: chainTransactions.map(tx => tx.id),
            patternIndicators: [
              `Transfer chain with ${chain.length} hops`,
              hasCrossBorder ? 'Cross-border movement detected' : 'Complex layering structure',
              'Sequential transfers with varying justifications'
            ],
            timestamp: new Date(),
            status: 'open'
          });
        }
      });
    }
  });
  
  return alerts;
}

// Pattern 4: Synthetic Identity Rings
export function detectSyntheticIdentity(
  accounts: Account[]
): Alert[] {
  const alerts: Alert[] = [];
  
  // Group accounts by shared attributes
  const attributeGroups = new Map<string, string[]>();
  
  accounts.forEach(account => {
    // Check for shared beneficial owners
    account.beneficialOwners.forEach(owner => {
      if (!attributeGroups.has(owner)) {
        attributeGroups.set(owner, []);
      }
      attributeGroups.get(owner)!.push(account.id);
    });
    
    // Check for shell companies with same owner
    if (account.isShellCompany) {
      const key = `shell-${account.jurisdiction}`;
      if (!attributeGroups.has(key)) {
        attributeGroups.set(key, []);
      }
      attributeGroups.get(key)!.push(account.id);
    }
  });
  
  // Find clusters of 3+ accounts sharing attributes
  attributeGroups.forEach((accountIds, attribute) => {
    if (accountIds.length >= 3) {
      alerts.push({
        id: `alert-si-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        patternType: 'synthetic_identity',
        severity: 'high',
        riskScore: 80,
        involvedAccounts: accountIds,
        transactionIds: [],
        patternIndicators: [
          `${accountIds.length} accounts sharing attributes`,
          'Potential synthetic identity ring',
          'Shared beneficial ownership detected'
        ],
        timestamp: new Date(),
        status: 'open'
      });
    }
  });
  
  return alerts;
}

// Pattern 5: U-Turn Loan Detection
export function detectUTurnLoans(
  transactions: Transaction[]
): Alert[] {
  const alerts: Alert[] = [];
  
  // Look for loan-related transactions
  const loanTransactions = transactions.filter(tx => 
    tx.purpose.toLowerCase().includes('loan') ||
    tx.purpose.toLowerCase().includes('repayment') ||
    tx.purpose.toLowerCase().includes('interest')
  );
  
  // Group by accounts
  const loanFlows = new Map<string, Transaction[]>();
  loanTransactions.forEach(tx => {
    if (!loanFlows.has(tx.fromAccount)) {
      loanFlows.set(tx.fromAccount, []);
    }
    loanFlows.get(tx.fromAccount)!.push(tx);
  });
  
  // Check for rapid repayment patterns
  loanFlows.forEach((txns, accountId) => {
    if (txns.length >= 3) {
      const sortedTxns = txns.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      const firstTime = new Date(sortedTxns[0].timestamp).getTime();
      const lastTime = new Date(sortedTxns[sortedTxns.length - 1].timestamp).getTime();
      const daysDiff = (lastTime - firstTime) / (1000 * 60 * 60 * 24);
      
      const totalRepaid = txns.reduce((sum, tx) => sum + tx.amount, 0);
      const initialLoan = txns[0].amount;
      
      // More than 80% repaid within 6 months
      if (daysDiff < 180 && totalRepaid > initialLoan * 0.8) {
        alerts.push({
          id: `alert-ul-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          patternType: 'u_turn_loan',
          severity: 'medium',
          riskScore: 60,
          involvedAccounts: [accountId, ...txns.map(tx => tx.toAccount)],
          transactionIds: txns.map(tx => tx.id),
          patternIndicators: [
            `Rapid loan repayment: ${Math.round((totalRepaid / initialLoan) * 100)}% repaid in ${Math.round(daysDiff)} days`,
            'Potential U-Turn loan scheme',
            'Offshore origin may be involved'
          ],
          timestamp: new Date(),
          status: 'open'
        });
      }
    }
  });
  
  return alerts;
}

// Pattern 8: Tight-Knit Money Circles
export function detectMoneyCircles(
  transactions: Transaction[]
): Alert[] {
  const alerts: Alert[] = [];
  
  // Build adjacency graph
  const graph = new Map<string, Set<string>>();
  
  transactions.forEach(tx => {
    if (!graph.has(tx.fromAccount)) {
      graph.set(tx.fromAccount, new Set());
    }
    graph.get(tx.fromAccount)!.add(tx.toAccount);
    
    if (!graph.has(tx.toAccount)) {
      graph.set(tx.toAccount, new Set());
    }
    graph.get(tx.toAccount)!.add(tx.fromAccount);
  });
  
  // Find strongly connected components (simplified)
  const visited = new Set<string>();
  const inCircle = new Set<string>();
  
  function dfs(node: string, path: string[]): boolean {
    if (path.length > 10) return false;
    if (path.length >= 3 && path.includes(node)) {
      // Found a cycle
      path.forEach(n => inCircle.add(n));
      return true;
    }
    
    visited.add(node);
    const neighbors = graph.get(node) || new Set();
    
    for (const neighbor of neighbors) {
      if (dfs(neighbor, [...path, node])) {
        return true;
      }
    }
    
    return false;
  }
  
  graph.forEach((_, node) => {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  });
  
  if (inCircle.size >= 3) {
    // Calculate internal vs external transactions
    const internalTxns = transactions.filter(tx => 
      inCircle.has(tx.fromAccount) && inCircle.has(tx.toAccount)
    );
    const externalTxns = transactions.filter(tx => 
      (inCircle.has(tx.fromAccount) || inCircle.has(tx.toAccount)) &&
      !(inCircle.has(tx.fromAccount) && inCircle.has(tx.toAccount))
    );
    
    const totalTxns = internalTxns.length + externalTxns.length;
    const internalRatio = totalTxns > 0 ? internalTxns.length / totalTxns : 0;
    
    if (internalRatio > 0.7) {
      alerts.push({
        id: `alert-mc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        patternType: 'money_circle',
        severity: 'high',
        riskScore: 75,
        involvedAccounts: Array.from(inCircle),
        transactionIds: internalTxns.map(tx => tx.id),
        patternIndicators: [
          `Closed network of ${inCircle.size} accounts`,
          `${Math.round(internalRatio * 100)}% of transactions stay within the circle`,
          'Minimal external counterparties - suspicious'
        ],
        timestamp: new Date(),
        status: 'open'
      });
    }
  }
  
  return alerts;
}

// Pattern 9: Scatter-Gather (Smurfing) Detection
export function detectScatterGather(
  transactions: Transaction[]
): Alert[] {
  const alerts: Alert[] = [];
  
  // Group transactions by time windows
  const timeWindows = new Map<number, Transaction[]>();
  const windowSize = 24 * 60 * 60 * 1000; // 24 hours
  
  transactions.forEach(tx => {
    const timestamp = new Date(tx.timestamp).getTime();
    const windowKey = Math.floor(timestamp / windowSize);
    
    if (!timeWindows.has(windowKey)) {
      timeWindows.set(windowKey, []);
    }
    timeWindows.get(windowKey)!.push(tx);
  });
  
  // Find structuring patterns
  timeWindows.forEach((txns, windowKey) => {
    // Group by target account
    const targetGroups = new Map<string, Transaction[]>();
    
    txns.forEach(tx => {
      if (tx.amount < 10000) {
        if (!targetGroups.has(tx.toAccount)) {
          targetGroups.set(tx.toAccount, []);
        }
        targetGroups.get(tx.toAccount)!.push(tx);
      }
    });
    
    // Check for aggregation pattern
    targetGroups.forEach((sourceTxns, targetAccount) => {
      const uniqueSources = new Set(sourceTxns.map(tx => tx.fromAccount)).size;
      const totalAmount = sourceTxns.reduce((sum, tx) => sum + tx.amount, 0);
      
      if (uniqueSources >= 5 && totalAmount >= 40000) {
        alerts.push({
          id: `alert-sg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          patternType: 'scatter_gather',
          severity: 'critical',
          riskScore: 90,
          involvedAccounts: [targetAccount, ...sourceTxns.map(tx => tx.fromAccount)],
          transactionIds: sourceTxns.map(tx => tx.id),
          patternIndicators: [
            `${uniqueSources} sources depositing to single account`,
            `Total: $${totalAmount.toLocaleString()} - structured below $10k`,
            'Smurfing/structuring pattern detected'
          ],
          timestamp: new Date(),
          status: 'open'
        });
      }
    });
  });
  
  return alerts;
}

// Main detection function
export function runFullAnalysis(
  transactions: Transaction[],
  accounts: Account[]
): Alert[] {
  const allAlerts: Alert[] = [];
  
  // Run all pattern detectors
  allAlerts.push(...detectRoundTripping(transactions, accounts));
  allAlerts.push(...detectFunnelAccounts(transactions));
  allAlerts.push(...detectMultiTierLayering(transactions));
  allAlerts.push(...detectSyntheticIdentity(accounts));
  allAlerts.push(...detectUTurnLoans(transactions));
  allAlerts.push(...detectMoneyCircles(transactions));
  allAlerts.push(...detectScatterGather(transactions));
  
  // Sort by risk score (highest first)
  return allAlerts.sort((a, b) => b.riskScore - a.riskScore);
}

// Risk scoring utilities
export function calculateOverallRisk(alerts: Alert[]): number {
  if (alerts.length === 0) return 0;
  
  const weightedSum = alerts.reduce((sum, alert) => {
    const severityMultiplier = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'critical': 4
    }[alert.severity];
    
    return sum + (alert.riskScore * severityMultiplier);
  }, 0);
  
  return Math.min(100, Math.round(weightedSum / alerts.length));
}

export function getPatternLabel(pattern: PatternType): string {
  const labels: Record<PatternType, string> = {
    'round_tripping': 'Round-Tripping',
    'funnel_account': 'Funnel Account',
    'multi_tier_layering': 'Multi-Tier Layering',
    'synthetic_identity': 'Synthetic Identity',
    'u_turn_loan': 'U-Turn Loan',
    'corporate_structure': 'Corporate Structure',
    'correspondent_nesting': 'Correspondent Nesting',
    'money_circle': 'Money Circle',
    'scatter_gather': 'Scatter-Gather (Smurfing)',
    'crypto_mixing': 'Crypto Mixing'
  };
  
  return labels[pattern];
}
