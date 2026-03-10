export type CatalogItemType = 'vertical_solution' | 'product' | 'super_agent' | 'sdlc_agent';

export type MaturityLevel = 'concept' | 'prototype' | 'beta' | 'production';

export type DemoMode = 'video' | 'interactive' | 'guided';

export interface CatalogItem {
    id: string;
    type: CatalogItemType;
    title: string;
    shortDescription: string;
    industryTags: string[];
    capabilityTags: string[];
    personaFit: string[];
    maturityLevel: MaturityLevel;
    demoModes: DemoMode[];
    videoUrl?: string; // YouTube/Vimeo ID or URL
    interactiveUrl?: string; // URL for iframe
    techStack: string[];
    owner: string;
    lastUpdated: string; // ISO date string
    isFeatured: boolean;
    slug: string;
}

export interface DemoStep {
    id: string;
    title: string;
    description: string;
    timestamp?: number; // For video sync
    selector?: string; // For interactive highlighting (future)
}

export interface DemoConfig {
    itemId: string;
    steps: DemoStep[];
}

export interface Frontmatter {
    id: string;
    title: string;
}

export interface MDXContent {
    frontmatter: Frontmatter;
    content: any; // MDXRemoteSerializeResult
}
