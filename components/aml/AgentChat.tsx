import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Bot, 
  User, 
  Send, 
  AlertTriangle, 
  TrendingUp,
  Shield,
  DollarSign,
  Activity,
  ArrowRight,
  Sparkles,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { Alert as AMLAlert, Transaction, Account, getPatternLabel, chatWithAssistant } from '../../lib/aml/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AgentChatProps {
  alerts: AMLAlert[];
  transactions: Transaction[];
  accounts: Account[];
  onAlertClick?: (alert: AMLAlert) => void;
  initialContext?: { type: 'node' | 'alert'; data: any } | null;
  onClearContext?: () => void;
}

interface QuickReply {
  label: string;
  prompt: string;
}

const quickReplies: QuickReply[] = [
  { label: '🔍 Why was this flagged?', prompt: 'Explain why this alert was triggered' },
  { label: '📊 Risk Summary', prompt: 'Give me a risk summary of the analysis' },
  { label: '💰 Transaction Details', prompt: 'Show me the transaction details' },
  { label: '🎯 Next Steps', prompt: 'What should I do next?' },
];

const patternKnowledge: Record<string, string> = {
  'round_tripping': `**Round-Tripping** is a money laundering technique where funds leave an entity and eventually return to it disguised as legitimate revenue.

**How it works:**
1. Funds leave the origin account (e.g., through a "purchase")
2. Money moves through shell companies in different jurisdictions
3. Funds return as "investment returns" or "loan repayments"

**Red Flags:**
- Circular fund flows returning to origin
- Shell company involvement
- Funds returning with small "interest" or "returns"
- Multiple jurisdictions to obscure origin

**Regulatory Context:**
- Violates AML regulations requiring source of funds documentation
- Typically involves falsifying business records
- Used to legitimize proceeds from corruption, tax evasion, or fraud`,

  'funnel_account': `**Funnel Account** (also called Fan-In/Fan-Out) is a money laundering technique used to place cash into the banking system.

**How it works:**
1. **Fan-In**: Multiple people ("smurfs") deposit small amounts of cash below the $10,000 CTR threshold
2. Money accumulates in a central hub account
3. **Fan-Out**: Funds are quickly transferred out in bulk to other accounts or "suppliers"

**Red Flags:**
- Many small deposits just below $10,000
- Rapid outflow after accumulation
- Geographic distribution of deposit sources
- Front business as cover

**Regulatory Context:**
- Structuring/smurfing is a crime (Bank Secrecy Act)
- CTR (Currency Transaction Report) threshold is $10,000
- Multiple smaller deposits to avoid reporting is suspicious`,

  'multi_tier_layering': `**Multi-Tier Layering** involves moving money through multiple layers of entities to obscure its origin.

**How it works:**
1. Money enters the system (from predicate crime)
2. Transferred through multiple shell companies
3. Each transfer uses different justifications (invoices, loans, dividends)
4. Cross-border movements between jurisdictions
5. Final integration into "clean" assets

**Red Flags:**
- 3+ hops in transfer chain
- Cross-border movements to high-risk jurisdictions
- Varying justifications for transfers
- Shell companies with no real operations

**Regulatory Context:**
- Designed to make tracing extremely difficult
- Often involves offshore financial centers
- Each layer adds "distance" from original crime`,

  'synthetic_identity': `**Synthetic Identity** fraud creates fake identities using real and fabricated information.

**How it works:**
1. Fraudsters combine real SSN fragments with fake names/addresses
2. Multiple "accounts" are created sharing attributes
3. "Seasoning": Small transactions build credit history
4. Larger transactions or credit lines are then exploited

**Red Flags:**
- Multiple accounts sharing phone/email/address
- Accounts with no real customer activity
- Rapid escalation in transaction amounts
- Common beneficial owner behind multiple accounts

**Regulatory Context:**
- Harder to detect than traditional identity theft
- Often used for credit card fraud
- KYC procedures should flag shared attributes`,

  'money_circle': `**Tight-Knit Money Circle** is a closed network of accounts that only transact among themselves.

**How it works:**
1. A group of accounts forms a strongly connected component
2. Money circulates within the group
3. Very little flows to external legitimate accounts
4. Creates appearance of genuine business activity

**Red Flags:**
- High percentage of internal transactions
- Circular payment patterns
- Same small group of counterparties
- Minimal external economic activity

**Regulatory Context:**
- Common in carousel VAT fraud
- Used in insurance fraud rings
- Legitimate businesses have diverse counterparty networks`,

  'scatter_gather': `**Scatter-Gather** (also called Smurfing/Structuring) breaks large amounts into smaller transactions.

**How it works:**
1. **Scatter**: Large sum is split into many small deposits
2. Each deposit is below reporting thresholds
3. **Gather**: Funds converge at a target account
4. Appears as if from multiple unrelated sources

**Red Flags:**
- Multiple deposits just under $10,000
- Same target account from many sources
- Temporal clustering (same day/week)
- Geographic distribution of sources

**Regulatory Context:**
- Structuring is illegal (Bank Secrecy Act)
- CTR must be filed for cash transactions >$10,000
- Banks must report suspicious activity`
};

export function AgentChat({ alerts, transactions, accounts, onAlertClick, initialContext, onClearContext }: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your AML Analysis Assistant. I can help you understand the alerts detected in your transaction data.

I can explain:
- **Why specific transactions were flagged**
- **Risk details of each pattern**
- **Regulatory context** for each detection
- **Recommended next steps** for investigation

What would you like to know?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle initial context (from network graph or alert detail)
  useEffect(() => {
    if (initialContext) {
      let contextMessage = '';
      
      if (initialContext.type === 'node' && initialContext.data) {
        const { node, account, transactions, alert } = initialContext.data;
        const totalAmount = transactions?.reduce((sum: number, tx: any) => sum + tx.amount, 0) || 0;
        
        if (alert) {
          contextMessage = `## Analyzing Account: ${node.label} (${node.id})\n\n` +
            `**Risk Level:** ${alert.severity?.toUpperCase() || 'HIGH'}\n` +
            `**Risk Score:** ${alert.riskScore}/100\n` +
            `**Pattern:** ${alert.patternType?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Unknown'}\n\n` +
            `**Account Details:**\n` +
            `• Total Transactions: ${transactions?.length || 0}\n` +
            `• Total Amount: ${totalAmount.toLocaleString()}\n` +
            `• Type: ${account?.ownerType || 'Unknown'}\n` +
            `• Shell Company: ${account?.isShellCompany ? 'Yes ⚠️' : 'No'}\n\n` +
            `**Pattern Indicators:**\n` +
            (alert.patternIndicators || []).map((i: string) => `• ${i}`).join('\n');
        } else {
          contextMessage = `## Account Analysis: ${node.label} (${node.id})\n\n` +
            `**Account Details:**\n` +
            `• Total Transactions: ${transactions?.length || 0}\n` +
            `• Total Amount: ${totalAmount.toLocaleString()}\n` +
            `• Type: ${account?.ownerType || 'Unknown'}\n` +
            `• Shell Company: ${account?.isShellCompany ? 'Yes ⚠️' : 'No'}\n\n` +
            `This account has not been flagged for any specific pattern. Would you like me to analyze it further?`;
        }
      } else if (initialContext.type === 'alert' && initialContext.data) {
        const alert = initialContext.data;
        contextMessage = `## Alert Analysis: ${alert.patternType?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Unknown Pattern'}\n\n` +
          `**Risk Score:** ${alert.riskScore}/100\n` +
          `**Severity:** ${alert.severity?.toUpperCase() || 'UNKNOWN'}\n` +
          `**Involved Accounts:** ${alert.involvedAccounts?.join(', ') || 'None'}\n\n` +
          `**Pattern Indicators:**\n` +
          (alert.patternIndicators || []).map((i: string) => `• ${i}`).join('\n');
      }
      
      if (contextMessage) {
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: contextMessage,
          timestamp: new Date()
        };
        setMessages(prev => [assistantMessage]);
        onClearContext?.();
      }
    }
  }, [initialContext]);

  const generateResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();
    
    // Check for specific alert context
    if (alerts.length > 0) {
      const topAlert = alerts[0];
      
      // Explain specific alert
      if (lowerInput.includes('why') || lowerInput.includes('explain') || lowerInput.includes('reason')) {
        const patternInfo = patternKnowledge[topAlert.patternType];
        return `## Analysis of Alert: ${getPatternLabel(topAlert.patternType)}

**Risk Score:** ${topAlert.riskScore}/100
**Severity:** ${topAlert.severity.toUpperCase()}

${patternInfo || 'No detailed information available.'}

**Involved Accounts:** ${topAlert.involvedAccounts.join(', ')}

**Key Pattern Indicators:**
${topAlert.patternIndicators.map((i: string) => `- ${i}`).join('\n')}

Would you like me to explain more about this pattern or look at another alert?`;
      }
    }
    
    // Risk summary
    if (lowerInput.includes('summary') || lowerInput.includes('risk overview') || lowerInput.includes('statistics')) {
      const critical = alerts.filter(a => a.severity === 'critical').length;
      const high = alerts.filter(a => a.severity === 'high').length;
      const medium = alerts.filter(a => a.severity === 'medium').length;
      const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
      
      return `## Risk Analysis Summary

**Overall Risk Level:** ${critical > 0 ? '🔴 CRITICAL' : high > 0 ? '🟠 HIGH' : '🟡 MEDIUM'}

**Alert Distribution:**
- 🔴 Critical: ${critical}
- 🟠 High: ${high}
- 🟡 Medium: ${medium}

**Transaction Analysis:**
- Total Transactions: ${transactions.length}
- Total Amount: $${totalAmount.toLocaleString()}
- Accounts Analyzed: ${accounts.length}

**Patterns Detected:**
${alerts.map(a => `- **${getPatternLabel(a.patternType)}** (${a.severity}) - ${a.involvedAccounts.length} accounts involved`).join('\n')}

Would you like me to dive deeper into any specific alert?`;
    }
    
    // Transaction details
    if (lowerInput.includes('transaction') || lowerInput.includes('amount') || lowerInput.includes('transfer')) {
      const suspiciousTxns = transactions.filter(tx => 
        tx.amount > 10000 || 
        tx.type === 'cash' ||
        tx.sourceCountry !== tx.destinationCountry
      );
      
      return `## Transaction Details

**Total Transactions:** ${transactions.length}

**High-Risk Transactions (${suspiciousTxns.length}):**
${suspiciousTxns.slice(0, 5).map(tx => `
- **${tx.id}**: $${tx.amount.toLocaleString()} (${tx.type})
  From: ${tx.fromAccount} → To: ${tx.toAccount}
  Purpose: ${tx.purpose}
  Route: ${tx.sourceCountry} → ${tx.destinationCountry}
`).join('')}

**Transaction Types:**
- Wire: ${transactions.filter(t => t.type === 'wire').length}
- ACH: ${transactions.filter(t => t.type === 'ach').length}
- Cash: ${transactions.filter(t => t.type === 'cash').length}

Would you like more details on any specific transaction?`;
    }
    
    // Next steps / recommendations
    if (lowerInput.includes('next') || lowerInput.includes('action') || lowerInput.includes('recommend') || lowerInput.includes('what to do')) {
      const criticalAlerts = alerts.filter(a => a.severity === 'critical');
      const highAlerts = alerts.filter(a => a.severity === 'high');
      
      return `## Recommended Next Steps

${criticalAlerts.length > 0 ? `**Immediate Actions Required (${criticalAlerts.length} Critical):**
${criticalAlerts.map(a => `1. Investigate ${getPatternLabel(a.patternType)} - Score: ${a.riskScore}
   - Review accounts: ${a.involvedAccounts.slice(0, 3).join(', ')}
   - ${a.patternIndicators[0] || ''}`).join('\n\n')}` : ''}

${highAlerts.length > 0 ? `**Enhanced Due Diligence (${highAlerts.length} High Risk):**
${highAlerts.map(a => `- ${getPatternLabel(a.patternType)}`).join('\n')}` : ''}

**Standard Process:**
1. ✅ Review alert details
2. ✅ Check customer due diligence (CDD) files
3. ✅ Document investigation findings
4. ✅ File SAR if warranted (Suspicious Activity Report)
5. ✅ Update customer risk rating

Would you like me to show you the network graph or explain any specific pattern?`;
    }
    
    // Help
    if (lowerInput.includes('help') || lowerInput.includes('what can you')) {
      return `I can help you with:

📊 **Analysis Overview**
- Risk summary and statistics
- Transaction patterns detected

🔍 **Alert Investigation**
- Why transactions were flagged
- Pattern explanations
- Regulatory context

💰 **Transaction Details**
- Specific transaction amounts
- Transfer paths
- Geographic information

🎯 **Recommendations**
- Next steps for investigation
- Compliance requirements
- Filing guidance

Just ask me a question!`;
    }
    
    // Default response
    return `I understand you're asking about: "${userInput}"

Based on the analysis data, I can provide insights on:

- **Alert explanations** - Why transactions were flagged
- **Risk summary** - Overall statistics and metrics
- **Transaction details** - Specific transfer information
- **Next steps** - Recommended investigation actions

Try asking me something like:
- "Why was this flagged?"
- "Give me a risk summary"
- "Show transaction details"
- "What should I do next?"`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);
    
    try {
      // Call the backend API for AI response
      const response = await chatWithAssistant(currentInput, {
        alerts: alerts,
        selectedAlert: null,
        transactions: transactions,
        statistics: null
      });
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      // Fallback to local response if API fails
      const fallbackResponse = generateResponse(currentInput);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fallbackResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickReply = (prompt: string) => {
    setInput(prompt);
    setTimeout(handleSend, 100);
  };

  if (isMinimized) {
    return (
      <Button 
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600"
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="h-full flex flex-col shadow-xl border-l-4 border-blue-600">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-base">AML Analysis Assistant</CardTitle>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-red-500" />
              AI-Powered Analysis
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setIsMinimized(true)}>
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Quick Replies */}
        <div className="p-3 border-b bg-gray-50">
          <p className="text-xs text-gray-500 mb-2">Quick Questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((reply, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => handleQuickReply(reply.prompt)}
                className="text-xs h-7"
              >
                {reply.label}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' ? 'bg-blue-100' : 'bg-indigo-100'
                }`}>
                  {message.role === 'user' ? (
                    <User className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Bot className="h-4 w-4 text-indigo-600" />
                  )}
                </div>
                <div className={`flex-1 p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-indigo-50 text-gray-800 border border-indigo-100 rounded-bl-none'
                }`}>
                  {message.role === 'assistant' ? (
                    <div className="prose prose-xs max-w-none text-sm">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </div>
                  )}
                  <p className={`text-xs mt-1 opacity-70 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-indigo-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="bg-gray-100 rounded-lg px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Input */}
        <div className="p-3 border-t bg-white">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the analysis..."
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );
}

export default AgentChat;
