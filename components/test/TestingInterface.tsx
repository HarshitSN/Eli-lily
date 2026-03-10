"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, ChevronUp, Monitor } from "lucide-react";
import { X } from "lucide-react";

interface TestingInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAgent?: string;
}

interface Agent {
  id: string;
  name: string;
  type: "vertical" | "super";
  category?: string;
}

export function TestingInterface({ isOpen, onClose, selectedAgent }: TestingInterfaceProps) {
  const [message, setMessage] = useState(selectedAgent ? `@${selectedAgent} ` : "");
  const [showAgentSuggestions, setShowAgentSuggestions] = useState(false);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mock agent data - in real app, this would come from your data sources
  const allAgents: Agent[] = [
    // Vertical Solution Agents
    { id: "aml-transaction-monitoring", name: "AML & Transaction Monitoring Agent", type: "vertical", category: "BFSI" },
    { id: "kyc-onboarding", name: "KYC & Onboarding Agent", type: "vertical", category: "BFSI" },
    { id: "credit-underwriting", name: "Credit Underwriting Assistant", type: "vertical", category: "BFSI" },
    { id: "fraud-claims", name: "Fraud Claims Triage Agent", type: "vertical", category: "BFSI" },
    { id: "collections-recovery", name: "Collections & Recovery Agent", type: "vertical", category: "BFSI" },
    { id: "customer-service-banking", name: "Customer Service Banking Copilot", type: "vertical", category: "BFSI" },
    { id: "regulatory-compliance", name: "Regulatory Compliance Navigator", type: "vertical", category: "BFSI" },
    { id: "clinical-note", name: "Clinical Note Summarization Agent", type: "vertical", category: "Healthcare" },
    { id: "prior-authorization", name: "Prior Authorization Copilot", type: "vertical", category: "Healthcare" },
    { id: "medical-coding", name: "Medical Coding Assistant", type: "vertical", category: "Healthcare" },
    { id: "care-coordination", name: "Care Coordination Agent", type: "vertical", category: "Healthcare" },
    { id: "patient-support", name: "Patient Support & Scheduling Agent", type: "vertical", category: "Healthcare" },
    { id: "pharmacovigilance", name: "Pharmacovigilance Agent", type: "vertical", category: "Healthcare" },
    { id: "clinical-trial", name: "Clinical Trial Document Agent", type: "vertical", category: "Healthcare" },
    { id: "disruption-management", name: "Disruption Management Agent", type: "vertical", category: "Travel" },
    { id: "crew-rostering", name: "Crew & Rostering Assistant", type: "vertical", category: "Travel" },
    { id: "maintenance-log", name: "Maintenance Log Analyst", type: "vertical", category: "Travel" },
    { id: "airport-ops", name: "Airport Ops Turnaround Agent", type: "vertical", category: "Travel" },
    { id: "passenger-service", name: "Passenger Service Copilot", type: "vertical", category: "Travel" },
    { id: "travel-policy", name: "Travel Policy & Expense Agent", type: "vertical", category: "Travel" },
    { id: "demand-forecast", name: "Demand Forecast Insights Agent", type: "vertical", category: "CPG" },
    { id: "trade-promotion", name: "Trade Promotion Effectiveness Agent", type: "vertical", category: "CPG" },
    { id: "retail-execution", name: "Retail Execution Agent", type: "vertical", category: "CPG" },
    { id: "supply-chain", name: "Supply Chain Exception Agent", type: "vertical", category: "CPG" },
    { id: "product-label", name: "Product Label & Compliance Agent", type: "vertical", category: "CPG" },
    { id: "consumer-feedback", name: "Consumer Feedback Intelligence Agent", type: "vertical", category: "CPG" },
    { id: "support-triage", name: "Support Triage & Resolution Agent", type: "vertical", category: "High-Tech" },
    { id: "incident-commander", name: "Incident Commander Copilot", type: "vertical", category: "High-Tech" },
    { id: "release-notes", name: "Release Notes Generator", type: "vertical", category: "High-Tech" },
    { id: "security-vulnerability", name: "Security & Vulnerability Triage Agent", type: "vertical", category: "High-Tech" },
    { id: "developer-productivity", name: "Developer Productivity Copilot", type: "vertical", category: "High-Tech" },
    { id: "cost-finops", name: "Cost & FinOps Advisor", type: "vertical", category: "High-Tech" },
    
    // Super Agents
    { id: "python-expert", name: "Super Agent: Python Expert", type: "super", category: "Engineering" },
    { id: "backend-systems", name: "Super Agent: Backend Systems Expert", type: "super", category: "Engineering" },
    { id: "software-architect", name: "Super Agent: Software Architect", type: "super", category: "Engineering" },
    { id: "devops-platform", name: "Super Agent: DevOps & Platform Engineer", type: "super", category: "Engineering" },
    { id: "sre-incident", name: "Super Agent: SRE / Incident Response Leader", type: "super", category: "Engineering" },
    { id: "cloud-security", name: "Super Agent: Cloud Security Expert", type: "super", category: "Engineering" },
    { id: "data-engineer", name: "Super Agent: Data Engineer", type: "super", category: "Engineering" },
    { id: "genai-implementation", name: "Super Agent: GenAI Implementation Expert", type: "super", category: "Engineering" },
    { id: "release-train", name: "Super Agent: Release Train / Program Manager", type: "super", category: "Delivery" },
    { id: "qa-strategy", name: "Super Agent: QA Strategy Expert", type: "super", category: "Delivery" },
    { id: "agile-delivery", name: "Super Agent: Agile Delivery Coach", type: "super", category: "Delivery" },
    { id: "product-manager", name: "Super Agent: Product Manager", type: "super", category: "Product" },
    { id: "product-expansion", name: "Super Agent: Product Expansion Expert", type: "super", category: "Product" },
    { id: "gtm-positioning", name: "Super Agent: GTM & Positioning Expert", type: "super", category: "Product" },
    { id: "solutions-architect", name: "Super Agent: Solutions Architect (Pre-sales)", type: "super", category: "Product" },
  ];

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedAgent) {
      setMessage(`@${selectedAgent} `);
    }
  }, [selectedAgent]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    setMessage(value);
    setCursorPosition(position);

    // Check if user is typing an @ mention
    const beforeCursor = value.substring(0, position);
    const atIndex = beforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1) {
      const mentionText = beforeCursor.substring(atIndex + 1);
      const spaceIndex = mentionText.indexOf(' ');
      
      if (spaceIndex === -1) {
        // User is actively typing a mention
        const searchQuery = mentionText.toLowerCase();
        const filtered = allAgents.filter(agent => 
          agent.name.toLowerCase().includes(searchQuery)
        );
        setFilteredAgents(filtered);
        setShowAgentSuggestions(true);
      } else {
        setShowAgentSuggestions(false);
      }
    } else {
      setShowAgentSuggestions(false);
    }
  };

  const handleAgentSelect = (agent: Agent) => {
    const beforeCursor = message.substring(0, cursorPosition);
    const atIndex = beforeCursor.lastIndexOf('@');
    const afterCursor = message.substring(cursorPosition);
    
    const newMessage = 
      message.substring(0, atIndex) + 
      `@${agent.name}` + 
      ' ' + 
      afterCursor;
    
    setMessage(newMessage);
    setShowAgentSuggestions(false);
    
    // Focus back to textarea and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPosition = atIndex + agent.name.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  };

  const handleExampleClick = (example: string) => {
    setMessage(`@${selectedAgent || "agent"} ${example}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-semibold">
              What would you like to test today?
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground mt-2">
            Describe your test scenario or select an example below.
          </p>
        </DialogHeader>

        <div className="p-6 pt-4">
          {/* Example buttons */}
          <div className="flex gap-3 mb-6">
            <Button
              variant="outline"
              onClick={() => handleExampleClick("Test login flow")}
              className="text-sm"
            >
              Test login flow
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExampleClick("Test checkout process")}
              className="text-sm"
            >
              Test checkout process
            </Button>
          </div>

          {/* Text input area */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              placeholder="How can I help you test today?"
              className="w-full min-h-[200px] p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
            />

            {/* Toolbar */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-4 w-4" />
              </Button>
              <select className="h-8 px-2 text-sm border rounded bg-background">
                <option>PC Web Browser</option>
                <option>Mobile</option>
                <option>Tablet</option>
              </select>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>

            {/* Agent suggestions dropdown */}
            {showAgentSuggestions && filteredAgents.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                <div className="p-2">
                  <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                    Available Agents
                  </div>
                  {filteredAgents.map((agent) => (
                    <div
                      key={agent.id}
                      onClick={() => handleAgentSelect(agent)}
                      className="flex items-center justify-between p-2 hover:bg-gray-100 rounded cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{agent.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant={agent.type === 'super' ? 'default' : 'secondary'} className="text-xs">
                          {agent.type}
                        </Badge>
                        {agent.category && (
                          <Badge variant="outline" className="text-xs">
                            {agent.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
