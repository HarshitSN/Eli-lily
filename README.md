# AI-Agent-Foundry

A clean, white-themed frontend showcase platform for StatusNeo's AI solutions, products, and agents.

## Features

- **Google-Inspired Aesthetic**: Minimal, spacious, and professional design.
- **Unified Catalog**: Vertical Solutions, Products, Super Agents, and SDLC Agents.
- **Rich Content**: MDX-based detail pages for deep dives.
- **Demo Runner**: Interactive, Video, and Guided demo modes.
- **Global Search**: Instant client-side search with Fuse.js.
- **Responsive**: Optimized for Mobile, Tablet, and Desktop.

## Tech Stack

- **Framework**: Next.js 14 (Pages Router)
- **Styling**: Tailwind CSS, Shadcn UI
- **Language**: TypeScript
- **Icons**: Lucide React
- **Search**: Fuse.js

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

3.  **Build for Production**:
    ```bash
    npm run build
    npm start
    ```

## Content Management

### Adding a New Catalog Item

1.  Add an entry to the relevant JSON file in `content/catalog/`:
    - `vertical-solutions.json`
    - `products.json`
    - `super-agents.json`
    - `sdlc-agents.json`

2.  Create a corresponding MDX file in `content/details/[pillar]/[slug].mdx`.

3.  (Optional) Add a demo configuration in `content/demos/[slug]-demo.json`.

## Project Structure

- `component/`: Reusable UI and feature components.
- `content/`: JSON metadata and MDX content files.
- `lib/`: Utility functions for content fetching and helper logic.
- `pages/`: Next.js file-based routing.
- `styles/`: Global styles and Tailwind configuration.
- `types/`: TypeScript definitions.

## Deployment

This project is a static site (with some dynamic routing) and can be deployed easily to Vercel, Netlify, or any static hosting provider.

---

© 2024 StatusNeo. All rights reserved.
