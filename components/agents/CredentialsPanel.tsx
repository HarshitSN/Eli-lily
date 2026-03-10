"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Shield, Key, Eye, EyeOff, CheckCircle, Loader2, Play, SkipForward } from "lucide-react";
import { credentialsApi } from "@/lib/api";

interface CredentialField {
    key: string;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
    description?: string;
    options?: string[];
    default?: string;
    group?: string;
    has_value?: boolean;
}

interface CredentialRequirements {
    agent_id: string;
    agent_name: string;
    description: string;
    fields: CredentialField[];
    has_credentials: boolean;
}

interface CredentialsPanelProps {
    agentId: string;
    agentName: string;
    onCredentialsSaved: () => void;
    onSkip: () => void;
}

const STORAGE_PREFIX = "agent_creds_";

export function CredentialsPanel({
    agentId,
    agentName,
    onCredentialsSaved,
    onSkip,
}: CredentialsPanelProps) {
    const [requirements, setRequirements] = useState<CredentialRequirements | null>(null);
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    // Load requirements and any saved credentials
    useEffect(() => {
        loadRequirements();
    }, [agentId]);

    const loadRequirements = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = (await credentialsApi.getRequirements(agentId)) as any;
            const data = response.data as CredentialRequirements;
            setRequirements(data);

            // Pre-fill from localStorage (but don't auto-submit - always ask)
            const savedCreds = localStorage.getItem(`${STORAGE_PREFIX}${agentId}`);
            if (savedCreds) {
                try {
                    const parsed = JSON.parse(savedCreds);
                    setFormValues(parsed);
                } catch {
                    // Invalid localStorage data, ignore
                }
            }

            // Set defaults for fields that have them
            const defaults: Record<string, string> = {};
            data.fields.forEach((field) => {
                if (field.default && !formValues[field.key]) {
                    defaults[field.key] = field.default;
                }
            });
            if (Object.keys(defaults).length > 0) {
                setFormValues((prev) => ({ ...defaults, ...prev }));
            }
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to load credential requirements"
            );
        } finally {
            setIsLoading(false);
        }
    };

    const saveCredentials = async (overrideValues?: Record<string, string>) => {
        const values = overrideValues || formValues;

        // Validate required fields
        if (requirements) {
            const requiredFields = requirements.fields.filter((f) => f.required);
            const missing = requiredFields.filter((f) => !values[f.key]);
            if (missing.length > 0) {
                setError(`Please fill in: ${missing.map((f) => f.label).join(", ")}`);
                return;
            }
        }

        setIsSaving(true);
        setError(null);
        try {
            // Filter out empty values
            const filteredValues: Record<string, string> = {};
            Object.entries(values).forEach(([k, v]) => {
                if (v && v.trim()) filteredValues[k] = v.trim();
            });

            await credentialsApi.save(agentId, filteredValues);

            // Save to localStorage
            localStorage.setItem(`${STORAGE_PREFIX}${agentId}`, JSON.stringify(filteredValues));

            setSaved(true);

            // Brief delay to show success, then proceed
            setTimeout(() => {
                onCredentialsSaved();
            }, 600);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save credentials");
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (key: string, value: string) => {
        setFormValues((prev) => ({ ...prev, [key]: value }));
        setError(null);
    };

    const togglePasswordVisibility = (key: string) => {
        setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    // Group fields by their group label
    const getGroupedFields = () => {
        if (!requirements) return {};
        const groups: Record<string, CredentialField[]> = {};
        requirements.fields.forEach((field) => {
            const group = field.group || "General";
            if (!groups[group]) groups[group] = [];
            groups[group].push(field);
        });
        return groups;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-gray-300" />
                <p className="text-sm">Loading agent requirements...</p>
            </div>
        );
    }

    if (saved) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-green-600">
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-4 animate-in zoom-in duration-300">
                    <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Credentials Saved</h3>
                <p className="text-sm text-gray-500">Running {agentName}...</p>
            </div>
        );
    }

    const groupedFields = getGroupedFields();

    return (
        <div className="max-w-2xl mx-auto w-full">
            {/* Header */}
            <div className="text-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-7 h-7 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    Configure {requirements?.agent_name || agentName}
                </h2>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                    {requirements?.description || "Enter the required credentials to run this agent."}
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Form */}
            <div className="space-y-6">
                {Object.entries(groupedFields).map(([groupName, fields]) => (
                    <Card key={groupName} className="border-gray-200 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Key className="w-4 h-4 text-gray-400" />
                                {groupName}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {fields.map((field) => (
                                <div key={field.key} className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor={field.key} className="text-sm text-gray-700">
                                            {field.label}
                                        </Label>
                                        {field.required && (
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-red-500 border-red-200 bg-red-50">
                                                Required
                                            </Badge>
                                        )}
                                    </div>

                                    {field.type === "select" && field.options ? (
                                        <Select
                                            value={formValues[field.key] || field.default || ""}
                                            onValueChange={(value) => handleChange(field.key, value)}
                                        >
                                            <SelectTrigger className="bg-white">
                                                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {field.options.map((opt) => (
                                                    <SelectItem key={opt} value={opt}>
                                                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="relative">
                                            <Input
                                                id={field.key}
                                                type={
                                                    field.type === "password" && !showPasswords[field.key]
                                                        ? "password"
                                                        : "text"
                                                }
                                                value={formValues[field.key] || ""}
                                                onChange={(e) => handleChange(field.key, e.target.value)}
                                                placeholder={field.placeholder || ""}
                                                className="bg-white pr-10"
                                            />
                                            {field.type === "password" && (
                                                <button
                                                    type="button"
                                                    onClick={() => togglePasswordVisibility(field.key)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                >
                                                    {showPasswords[field.key] ? (
                                                        <EyeOff className="w-4 h-4" />
                                                    ) : (
                                                        <Eye className="w-4 h-4" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {field.description && (
                                        <p className="text-xs text-gray-400 leading-relaxed">{field.description}</p>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pb-4">
                <Button
                    onClick={() => saveCredentials()}
                    disabled={isSaving}
                    className="flex-1 bg-black text-white hover:bg-gray-800 h-11"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4 mr-2" />
                            Save & Run Agent
                        </>
                    )}
                </Button>
                <Button
                    variant="outline"
                    onClick={onSkip}
                    disabled={isSaving}
                    className="h-11 text-gray-600"
                >
                    <SkipForward className="w-4 h-4 mr-2" />
                    Skip (Demo)
                </Button>
            </div>
        </div>
    );
}
