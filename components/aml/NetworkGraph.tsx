import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { X, ZoomIn, ZoomOut, RotateCcw, Filter, MousePointer2, Wallet, ArrowRightLeft, AlertTriangle, Bot, Send, MessageCircle } from 'lucide-react';
import { Transaction, Account, Alert as AMLAlert, chatWithAssistant } from '../../lib/aml/api';

interface NetworkGraphProps {
  transactions: Transaction[];
  accounts: Account[];
  alertAccountIds?: string[];
  alerts?: AMLAlert[];
  selectedAlert?: AMLAlert | null;
  onClose: () => void;
  onAskAgent?: (nodeData: { node: Node; account: Account | undefined; transactions: Transaction[]; alert: AMLAlert | undefined }) => void;
}

interface Node {
  id: string;
  label: string;
  type: 'account' | 'pattern';
  risk?: 'low' | 'medium' | 'high' | 'critical';
  x: number;
  y: number;
  vx?: number;
  vy?: number;
}

interface Link {
  source: string;
  target: string;
  amount: number;
  type: string;
}

const COLORS = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#ca8a04',
  low: '#16a34a',
  default: '#64748b'
};

const NODE_RADIUS = 30;

export function NetworkGraph({ transactions, accounts, alertAccountIds = [], alerts = [], selectedAlert = null, onClose, onAskAgent }: NetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [nodeDragOffset, setNodeDragOffset] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(true);
  const [llmAnalysis, setLlmAnalysis] = useState<string>('');
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [displayedAnalysis, setDisplayedAnalysis] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const typingRef = useRef<NodeJS.Timeout | null>(null);

  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Build graph data
  useEffect(() => {
    const accountNodes: Node[] = accounts.map(acc => {
      const isAlert = alertAccountIds.includes(acc.id);
      return {
        id: acc.id,
        label: acc.ownerName || acc.id,
        type: 'account' as const,
        risk: isAlert ? 'high' : (acc.riskProfile as Node['risk']) || 'low',
        x: Math.random() * 600 + 100,
        y: Math.random() * 400 + 100
      };
    });

    const linkMap = new Map<string, Link>();
    transactions.forEach(tx => {
      const key = `${tx.fromAccount}-${tx.toAccount}`;
      if (!linkMap.has(key)) {
        linkMap.set(key, {
          source: tx.fromAccount,
          target: tx.toAccount,
          amount: 0,
          type: tx.type,
        });
      }
      const link = linkMap.get(key)!;
      link.amount += tx.amount;
    });

    setNodes(accountNodes);
    setLinks(Array.from(linkMap.values()));
    setSelectedNode(null);
  }, [transactions, accounts, alertAccountIds]);

  // Force simulation
  useEffect(() => {
    if (!isAnimating) return;

    const simulate = () => {
      setNodes(prevNodes => {
        const nodeMap = new Map<string, Node>();
        prevNodes.forEach(n => nodeMap.set(n.id, { ...n, vx: 0, vy: 0 }));

        // Forces
        prevNodes.forEach(node1 => {
          prevNodes.forEach(node2 => {
            if (node1.id === node2.id) return;
            const dx = node1.x - node2.x;
            const dy = node1.y - node2.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 8000 / (dist * dist);
            const n1 = nodeMap.get(node1.id)!;
            n1.vx! += (dx / dist) * force;
            n1.vy! += (dy / dist) * force;
          });
        });

        // Link attraction
        links.forEach(link => {
          const source = nodeMap.get(link.source);
          const target = nodeMap.get(link.target);
          if (source && target) {
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = (dist - 150) * 0.01;
            source.vx! += (dx / dist) * force;
            source.vy! += (dy / dist) * force;
            target.vx! -= (dx / dist) * force;
            target.vy! -= (dy / dist) * force;
          }
        });

        // Center gravity
        const centerX = 500;
        const centerY = 350;
        nodeMap.forEach(node => {
          node.vx! += (centerX - node.x) * 0.001;
          node.vy! += (centerY - node.y) * 0.001;
        });

        // Apply velocities
        const newNodes = prevNodes.map(node => {
          const n = nodeMap.get(node.id)!;
          return {
            ...node,
            x: Math.max(50, Math.min(950, node.x + n.vx!)),
            y: Math.max(50, Math.min(650, node.y + n.vy!))
          };
        });

        return newNodes;
      });

      animationRef.current = requestAnimationFrame(simulate);
    };

    animationRef.current = requestAnimationFrame(simulate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, links]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.save();
    ctx.translate(rect.width / 2 + offset.x, rect.height / 2 + offset.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-rect.width / 2, -rect.height / 2);

    // Draw links
    links.forEach(link => {
      const source = nodes.find(n => n.id === link.source);
      const target = nodes.find(n => n.id === link.target);
      if (!source || !target) return;

      const isHighlighted = selectedNode && (link.source === selectedNode.id || link.target === selectedNode.id);
      
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = isHighlighted ? '#3b82f6' : 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = isHighlighted ? 3 : Math.min(2, Math.log(link.amount + 1) * 0.3);
      ctx.stroke();

      // Draw amount on link
      if (link.amount > 10000) {
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillRect(midX - 25, midY - 8, 50, 16);
        ctx.fillStyle = '#64748b';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`$${(link.amount/1000).toFixed(0)}K`, midX, midY + 4);
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;
      const isAlert = alertAccountIds.includes(node.id);
      const color = COLORS[node.risk || 'default'];

      // Glow effect for selected/alert nodes
      if (isSelected || isAlert) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_RADIUS + 8, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(node.x, node.y, NODE_RADIUS, node.x, node.y, NODE_RADIUS + 15);
        gradient.addColorStop(0, color + '40');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, isHovered ? NODE_RADIUS + 3 : NODE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? color : '#fff';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // Node icon
      ctx.fillStyle = isSelected ? '#fff' : color;
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👤', node.x, node.y);

      // Label
      ctx.fillStyle = '#1e293b';
      ctx.font = isSelected ? 'bold 12px sans-serif' : '11px sans-serif';
      ctx.fillText(node.label.substring(0, 12), node.x, node.y + NODE_RADIUS + 14);

      // Risk badge
      if (isAlert) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('⚠️', node.x + NODE_RADIUS - 5, node.y - NODE_RADIUS + 5);
      }
    });

    ctx.restore();
  }, [nodes, links, selectedNode, hoveredNode, zoom, offset, alertAccountIds]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Transform to graph coordinates
    const graphX = (clickX - rect.width / 2 - offset.x) / zoom + rect.width / 2;
    const graphY = (clickY - rect.height / 2 - offset.y) / zoom + rect.height / 2;

    // Find clicked node
    const clickedNode = nodes.find(node => {
      const dx = node.x - graphX;
      const dy = node.y - graphY;
      return Math.sqrt(dx * dx + dy * dy) < NODE_RADIUS + 5;
    });

    setSelectedNode(clickedNode || null);
  }, [nodes, zoom, offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const graphX = (mouseX - rect.width / 2 - offset.x) / zoom + rect.width / 2;
    const graphY = (mouseY - rect.height / 2 - offset.y) / zoom + rect.height / 2;

    const hovered = nodes.find(node => {
      const dx = node.x - graphX;
      const dy = node.y - graphY;
      return Math.sqrt(dx * dx + dy * dy) < NODE_RADIUS + 5;
    });

    setHoveredNode(hovered || null);
    canvas.style.cursor = hovered ? 'pointer' : 'grab';
  }, [nodes, zoom, offset]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Transform to graph coordinates
    const graphX = (clickX - rect.width / 2 - offset.x) / zoom + rect.width / 2;
    const graphY = (clickY - rect.height / 2 - offset.y) / zoom + rect.height / 2;

    // Check if clicking on a node
    const clickedNode = nodes.find(node => {
      const dx = node.x - graphX;
      const dy = node.y - graphY;
      return Math.sqrt(dx * dx + dy * dy) < NODE_RADIUS + 5;
    });

    if (clickedNode) {
      // Start dragging the node
      setDraggedNode(clickedNode.id);
      setNodeDragOffset({ x: clickedNode.x - graphX, y: clickedNode.y - graphY });
    } else {
      // Start panning the canvas
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMoveDrag = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedNode) {
      // Dragging a node
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const graphX = (mouseX - rect.width / 2 - offset.x) / zoom + rect.width / 2;
      const graphY = (mouseY - rect.height / 2 - offset.y) / zoom + rect.height / 2;

      // Update the dragged node's position
      setNodes(prevNodes => prevNodes.map(node => {
        if (node.id === draggedNode) {
          return {
            ...node,
            x: graphX - nodeDragOffset.x,
            y: graphY - nodeDragOffset.y
          };
        }
        return node;
      }));
    } else if (isDragging) {
      // Panning the canvas
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNode(null);
  };

  const handleZoomIn = () => setZoom(z => Math.min(z * 1.3, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.3, 0.3));
  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setIsAnimating(true);
  };
  const stopAnimation = () => setIsAnimating(false);

  const selectedLink = selectedNode ? links.filter(l => 
    l.source === selectedNode.id || l.target === selectedNode.id
  ) : [];

  // Get account details for selected node
  const accountDetails = selectedNode ? accounts.find(a => a.id === selectedNode.id) : null;
  
  // Get transactions for selected node
  const nodeTransactions = selectedNode ? transactions.filter(
    tx => tx.fromAccount === selectedNode.id || tx.toAccount === selectedNode.id
  ) : [];

  // Get alert for selected node - prioritize the selectedAlert from dashboard
  const nodeAlert = selectedNode ? (() => {
    // First priority: if selectedAlert from dashboard is provided, use it
    // (we're analyzing within the context of the selected alert from dashboard)
    if (selectedAlert) {
      return selectedAlert;
    }
    
    // Fallback: find alerts that include this node
    const matchingAlerts = alerts.filter(alert => 
      alert.involvedAccounts.includes(selectedNode.id)
    );
    
    if (matchingAlerts.length === 0) return null;
    
    // Return the first matching alert
    return matchingAlerts[0];
  })() : null;

  // Fetch LLM analysis when node is selected
  useEffect(() => {
    if (!selectedNode) {
      setLlmAnalysis('');
      return;
    }

    const fetchAnalysis = async () => {
      setIsLoadingAnalysis(true);
      try {
        const nodeTxns = transactions.filter(
          tx => tx.fromAccount === selectedNode.id || tx.toAccount === selectedNode.id
        );
        
        const question = nodeAlert 
          ? `Analyze this AML alert for account ${selectedNode.label} (${selectedNode.id}):\n` +
            `- Pattern: ${nodeAlert.patternType}\n` +
            `- Risk Score: ${nodeAlert.riskScore}\n` +
            `- Severity: ${nodeAlert.severity}\n` +
            `- Involved Accounts: ${nodeAlert.involvedAccounts.join(', ')}\n` +
            `- Pattern Indicators: ${nodeAlert.patternIndicators.join('; ')}\n` +
            `- Transaction Count: ${nodeTxns.length}\n` +
            `- Total Amount: ${nodeTxns.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()}\n\n` +
            `Provide a detailed analysis explaining why this pattern is suspicious and what investigative steps should be taken.`
          : `Analyze this account ${selectedNode.label} (${selectedNode.id}) in the transaction network.\n` +
            `- Transaction Count: ${nodeTxns.length}\n` +
            `- Total Amount: ${nodeTxns.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()}\n\n` +
            `Is this account involved in any suspicious activity? Provide your analysis.`;

        // Filter to only include relevant data for this specific node/account
        const relevantAlert = nodeAlert ? [nodeAlert] : [];
        
        console.log('[fetchAnalysis] nodeAlert:', nodeAlert ? { patternType: nodeAlert.patternType, riskScore: nodeAlert.riskScore, involvedAccounts: nodeAlert.involvedAccounts } : null);
        console.log('[fetchAnalysis] selectedAlert prop:', selectedAlert ? { patternType: selectedAlert.patternType, involvedAccounts: selectedAlert.involvedAccounts } : null);
        
        const response = await chatWithAssistant(question, {
          alerts: relevantAlert,
          selectedAlert: nodeAlert || null,
          transactions: nodeTxns,
          statistics: null
        });
        
        setLlmAnalysis(response);
      } catch (error) {
        console.error('Failed to get LLM analysis:', error);
        setLlmAnalysis('');
      } finally {
        setIsLoadingAnalysis(false);
      }
    };

    fetchAnalysis();
  }, [selectedNode, transactions, alerts, nodeAlert]);

  // Typewriter effect for LLM analysis
  useEffect(() => {
    if (!llmAnalysis) {
      setDisplayedAnalysis('');
      setIsTyping(false);
      return;
    }
    
    // Clear any existing typing animation
    if (typingRef.current) {
      clearTimeout(typingRef.current);
    }
    
    setDisplayedAnalysis('');
    setIsTyping(true);
    
    let currentIndex = 0;
    const text = llmAnalysis;
    const typingSpeed = 15; // ms per character
    
    const typeNextChar = () => {
      if (currentIndex < text.length) {
        setDisplayedAnalysis(text.substring(0, currentIndex + 1));
        currentIndex++;
        typingRef.current = setTimeout(typeNextChar, typingSpeed);
      } else {
        setIsTyping(false);
      }
    };
    
    typingRef.current = setTimeout(typeNextChar, 500); // Initial delay before starting
    
    return () => {
      if (typingRef.current) {
        clearTimeout(typingRef.current);
      }
    };
  }, [llmAnalysis]);

  // Generate agent explanation for the selected node
  const getAgentExplanation = () => {
    if (!selectedNode) return '';
    
    if (nodeAlert) {
      // Get transactions specifically for this node from the alert
      const nodeAlertTxIds = nodeAlert.transactionIds || [];
      const suspiciousTxns = transactions.filter(
        tx => (tx.fromAccount === selectedNode.id || tx.toAccount === selectedNode.id) && 
              nodeAlertTxIds.some((id: string | number) => String(id) === String(tx.id))
      );
      const totalAmount = suspiciousTxns.reduce((sum, tx) => sum + tx.amount, 0);
      
      return `## 🚨 Alert Analysis for ${selectedNode.label}\n\n` +
        `**Risk Score:** ${nodeAlert.riskScore}/100\n` +
        `**Pattern:** ${nodeAlert.patternType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}\n` +
        `**Severity:** ${nodeAlert.severity.toUpperCase()}\n\n` +
        `**Why this account is flagged:**\n` +
        nodeAlert.patternIndicators.map(i => `• ${i}`).join('\n') + `\n\n` +
        `This account is involved in ${suspiciousTxns.length} suspicious transactions ` +
        `totaling ${totalAmount.toLocaleString()}.`;
    }
    
    // Check if account has high-risk characteristics
    if (accountDetails?.isShellCompany) {
      return `## ℹ️ Account Analysis for ${selectedNode.label}\n\n` +
        `This account has been flagged as a **Shell Company**.\n\n` +
        `Shell companies are often used in money laundering schemes because they:` +
        `\n• Lack physical business presence\n` +
        `• Have no independent employees\n` +
        `• Are primarily used to move funds rather than conduct legitimate business\n\n` +
        `Recommend conducting enhanced due diligence (EDD) on this entity.`;
    }
    
    return `## ✅ Account Analysis for ${selectedNode.label}\n\n` +
      `This account appears to be **low risk** based on the current analysis.\n\n` +
      `**Summary:**\n` +
      `• ${nodeTransactions.length} transactions analyzed\n` +
      `• Total flow: ${nodeTransactions.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()}\n` +
      `• No suspicious patterns detected\n\n` +
      `No immediate investigative action required, but continue monitoring for any unusual activity.`;
  };

  // Chat handlers
  const handleSendChat = async () => {
    if (!chatInput.trim() || !selectedNode) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatLoading(true);

    try {
      // Build context with chat history
      const chatHistory = chatMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
      
      // Filter to only transactions for this specific node
      const nodeTxns = transactions.filter(
        tx => tx.fromAccount === selectedNode.id || tx.toAccount === selectedNode.id
      );
      
      // Filter to only the relevant alert for this node
      const relevantAlert = nodeAlert ? [nodeAlert] : [];
      
      // Build the full question with context
      const fullQuestion = nodeAlert
        ? `You are analyzing account ${selectedNode.label} (${selectedNode.id}) for AML investigation.\n` +
          `Alert: ${nodeAlert.patternType} - Risk Score: ${nodeAlert.riskScore}/100\n` +
          `Transactions: ${nodeTxns.length} transactions totaling ${nodeTxns.reduce((s, t) => s + t.amount, 0).toLocaleString()}\n\n` +
          `Chat History:\n${chatHistory}\n\n` +
          `User's new question: ${userMessage}\n\n` +
          `Provide a helpful response based on the context above.`
        : `You are analyzing account ${selectedNode.label} (${selectedNode.id}) in the transaction network.\n` +
          `Transactions: ${nodeTxns.length} transactions totaling ${nodeTxns.reduce((s, t) => s + t.amount, 0).toLocaleString()}\n\n` +
          `Chat History:\n${chatHistory}\n\n` +
          `User's new question: ${userMessage}\n\n` +
          `Provide a helpful response based on the context above.`;

      const response = await chatWithAssistant(fullQuestion, {
        alerts: relevantAlert,
        selectedAlert: nodeAlert || null,
        transactions: nodeTxns,
        statistics: null
      });

      setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <Card className="fixed inset-4 z-50 flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 shadow-2xl rounded-xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between py-4 px-6 bg-white border-b shadow-sm">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <ArrowRightLeft className="h-5 w-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Transaction Network Analysis
          </span>
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant={isAnimating ? "default" : "outline"} 
            size="sm" 
            onClick={() => setIsAnimating(!isAnimating)}
            className="gap-1"
          >
            {isAnimating ? "⏸ Pause" : "▶ Animate"}
          </Button>
          <div className="h-6 w-px bg-gray-200 mx-1" />
          <Button variant="outline" size="sm" onClick={handleZoomIn} className="w-8 h-8 p-0">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomOut} className="w-8 h-8 p-0">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset} className="w-8 h-8 p-0">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-gray-200 mx-1" />
          <Button variant="ghost" size="sm" onClick={onClose} className="w-8 h-8 p-0 hover:bg-red-100 hover:text-red-600">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas Area */}
        <div 
          ref={containerRef} 
          className="flex-1 relative bg-gradient-to-br from-slate-100 to-slate-200"
          style={{ cursor: draggedNode ? 'move' : (isDragging ? 'grabbing' : 'grab') }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={(e) => { handleMouseMove(e); handleMouseMoveDrag(e); }}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          
          {/* Stats overlay */}
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Network Stats</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-2xl font-bold text-blue-600">{nodes.length}</div>
                <div className="text-gray-500">Accounts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-600">{links.length}</div>
                <div className="text-gray-500">Connections</div>
              </div>
            </div>
          </div>
          
          {/* Instructions */}
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow border text-sm text-gray-600 flex items-center gap-2">
            <MousePointer2 className="h-4 w-4" />
            <span>Drag nodes to move • Drag canvas to pan • Click to select</span>
          </div>
          
          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border">
            <div className="text-xs font-semibold mb-2 text-gray-500">Risk Level</div>
            <div className="flex flex-col gap-1.5">
              {Object.entries(COLORS).filter(([k]) => k !== 'default').map(([level, color]) => (
                <div key={level} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs capitalize text-gray-700">{level}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Details Sidebar */}
        <div className="w-96 border-l bg-white shadow-xl overflow-y-auto">
          {selectedNode ? (
            <div className="p-5 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{selectedNode.label}</h3>
                  <Badge variant="outline" className="mt-1 font-mono text-xs">{selectedNode.id}</Badge>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Wallet className="h-5 w-5 text-gray-600" />
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-xl border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Risk Assessment</span>
                  <Badge className={
                    selectedNode.risk === 'critical' ? 'bg-red-100 text-red-800' :
                    selectedNode.risk === 'high' ? 'bg-orange-100 text-orange-800' :
                    selectedNode.risk === 'medium' ? 'bg-red-100 text-red-800' :
                    'bg-green-100 text-green-800'
                  }>
                    {selectedNode.risk?.toUpperCase() || 'UNKNOWN'}
                  </Badge>
                </div>
                {accountDetails && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type:</span>
                      <span className="capitalize">{accountDetails.ownerType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Jurisdiction:</span>
                      <span>{accountDetails.jurisdiction}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Shell Company:</span>
                      <span>{accountDetails.isShellCompany ? '⚠️ Yes' : 'No'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Agent Analysis - Full Chat Mode */}
              {showChat ? (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 h-[400px] flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2 text-blue-800">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">AI</span>
                      </div>
                      <MessageCircle className="h-4 w-4" />
                      Chat Session
                    </h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => { setShowChat(false); setChatMessages([]); }}
                      className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Close
                    </Button>
                  </div>
                  
                  {/* Chat Messages - Scrollable */}
                  <div className="flex-1 bg-white rounded-lg border overflow-y-auto p-3 space-y-3 mb-3">
                    {chatMessages.length === 0 ? (
                      <div className="text-sm text-gray-500 text-center py-8">
                        <Bot className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                        Ask me anything about this account...
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => (
                        <div key={idx} className={`${msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}>
                          <div className={`max-w-[85%] ${
                            msg.role === 'user' 
                              ? 'bg-blue-600 text-white rounded-2xl rounded-br-md' 
                              : 'bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md'
                          } px-3 py-2`}>
                            <div className="text-sm prose prose-xs max-w-none">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    {isChatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-2xl rounded-bl-md px-3 py-2">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  
                  {/* Chat Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask follow-up questions about this analysis..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                      disabled={isChatLoading}
                      className="flex-1 h-10"
                    />
                    <Button 
                      onClick={handleSendChat}
                      disabled={isChatLoading || !chatInput.trim()}
                      className="h-10 px-4 bg-gradient-to-r from-blue-600 to-indigo-600"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                /* Original Agent Analysis View */
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-blue-800">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">AI</span>
                    </div>
                    Agent Analysis
                  </h4>
                  {isLoadingAnalysis ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        Analyzing with AI...
                      </div>
                    </div>
                  ) : displayedAnalysis ? (
                    <div className="prose prose-xs max-w-none text-sm text-gray-700">
                      <ReactMarkdown>{displayedAnalysis}</ReactMarkdown>
                      {isTyping && (
                        <span className="inline-block w-0.5 h-4 bg-blue-600 animate-pulse ml-0.5"></span>
                      )}
                    </div>
                  ) : (
                    <div className="prose prose-xs max-w-none text-sm text-gray-700">
                      <ReactMarkdown>{getAgentExplanation()}</ReactMarkdown>
                    </div>
                  )}
                  
                  {selectedNode && (
                    <Button 
                      className="w-full mt-3 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      size="sm"
                      onClick={() => {
                        // Initialize chat with the current analysis
                        const initialMessage = displayedAnalysis || llmAnalysis || getAgentExplanation();
                        if (initialMessage) {
                          setChatMessages([{ 
                            role: 'assistant', 
                            content: initialMessage 
                          }]);
                        }
                        setShowChat(true);
                      }}
                    >
                      <Bot className="h-4 w-4" />
                      Ask Agent
                    </Button>
                  )}
                </div>
              )}

              {/* Transaction Summary */}
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4" />
                  Transactions ({nodeTransactions.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {nodeTransactions.slice(0, 10).map((tx, idx) => {
                    const isOutgoing = tx.fromAccount === selectedNode.id;
                    return (
                      <div key={idx} className="p-2 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <span className={isOutgoing ? 'text-red-600' : 'text-green-600'}>
                              {isOutgoing ? '→' : '←'}
                            </span>
                            <span className="font-mono text-xs">{isOutgoing ? tx.toAccount : tx.fromAccount}</span>
                          </div>
                          <span className="font-semibold text-sm">${tx.amount.toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex justify-between">
                          <span>{tx.type}</span>
                          <span>{new Date(tx.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Connected Accounts */}
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <MousePointer2 className="h-4 w-4" />
                  Connected Accounts ({selectedLink.length})
                </h4>
                <div className="space-y-2">
                  {selectedLink.map((link, idx) => {
                    const isSource = link.source === selectedNode.id;
                    const connectedId = isSource ? link.target : link.source;
                    const connectedNode = nodes.find(n => n.id === connectedId);
                    return (
                      <div key={idx} className="p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
                           onClick={() => setSelectedNode(connectedNode || null)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={isSource ? 'text-red-500' : 'text-green-500'}>
                              {isSource ? '→' : '←'}
                            </span>
                            <div>
                              <div className="font-mono text-sm font-medium">{connectedId}</div>
                              <div className="text-xs text-gray-500">{connectedNode?.label}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">${link.amount.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">{link.type}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button className="flex-1 gap-1" size="sm">
                  <AlertTriangle className="h-3 w-3" />
                  Investigate
                </Button>
                <Button variant="outline" className="flex-1 gap-1" size="sm" onClick={() => setSelectedNode(null)}>
                  Clear Selection
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                <MousePointer2 className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">Select a Node</h3>
              <p className="text-gray-500 mb-4">Click on any account node in the network to view detailed information about that account and its connections.</p>
              <div className="text-sm text-gray-400">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>High Risk / Alert</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Normal Account</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default NetworkGraph;
