import fs from 'fs';
import path from 'path';
import { CatalogItem } from '../types';

const contentDirectory = path.join(process.cwd(), 'content');

export function getAllCatalogItems(): CatalogItem[] {
    const pillars = ['vertical-solutions', 'products', 'super-agents', 'sdlc-agents'];
    let allItems: CatalogItem[] = [];

    pillars.forEach((pillar) => {
        const filePath = path.join(contentDirectory, 'catalog', `${pillar}.json`);
        try {
            const fileContents = fs.readFileSync(filePath, 'utf8');
            const items: CatalogItem[] = JSON.parse(fileContents);
            allItems = allItems.concat(items);
        } catch (error) {
            console.warn(`Could not load catalog for ${pillar}:`, error);
        }
    });

    return allItems;
}

export function getCatalogItemsByPillar(pillar: string): CatalogItem[] {
    const filePath = path.join(contentDirectory, 'catalog', `${pillar}.json`);
    try {
        const fileContents = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileContents);
    } catch (error) {
        console.warn(`Could not load catalog for ${pillar}:`, error);
        return [];
    }
}

export function getCatalogItem(slug: string): CatalogItem | undefined {
    const allItems = getAllCatalogItems();
    return allItems.find((item) => item.slug === slug);
}

export async function getMdxContent(id: string, type: string) {
    // type should be one of the pillars e.g. 'vertical-solutions'
    // id - e.g. 'aviation-ops-assistant'
    const fullPath = path.join(contentDirectory, 'details', type, `${id}.mdx`);
    try {
        if (!fs.existsSync(fullPath)) {
            console.warn(`MDX file not found: ${fullPath}`);
            return null;
        }
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        return fileContents;
    } catch (error) {
        console.error("Error reading MDX file:", error);
        return null;
    }
}
