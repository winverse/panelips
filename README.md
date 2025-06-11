# Panelips

A platform for YouTube panelists to share their expertise and build their personal brand.

## Overview

Panelips helps experts who appear on YouTube channels to organize their content, build their personal brand, and connect with their audience. The platform collects and organizes what panelists say across different YouTube videos, making it easier for fans to follow specific experts.

## Features

- Collect and organize content from YouTube panelists across different videos
- Allow panelists to build their personal brand and connect with their audience
- Provide summarized content and additional premium content through memberships
- Integration with AI tools like NOTEBOOK LM for enhanced content consumption

## Tech Stack

- **Bun**: JavaScript runtime and package manager
- **Turborepo**: Monorepo management
- **Apps**:
  - **Admin**: NextJS admin dashboard
  - **Client**: NextJS frontend for users
  - **Server**: NestJS backend API
  - **Scraper**: NestJS service for scraping YouTube data
  - **Worker**: NestJS background processing service
- **Packages**:
  - **Prisma**: Database ORM and client

## Getting Started

### Prerequisites

- Bun 1.0.0 or higher
- Node.js 18.0.0 or higher
- PostgreSQL

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```
3. Set up the database:
   ```bash
   cd packages/prisma
   bun db:push
   ```
4. Start the development server:
   ```bash
   bun dev
   ```

## Development

### Project Structure

```
panelips/
├── apps/
│   ├── admin/       # NextJS admin dashboard
│   ├── client/      # NextJS frontend for users
│   ├── server/      # NestJS backend API
│   ├── scraper/     # NestJS service for scraping YouTube data
│   └── worker/      # NestJS background processing service
├── packages/
│   └── prisma/      # Database schema and client
└── turbo.json       # Turborepo configuration
```

### Commands

- `bun dev`: Start all applications in development mode
- `bun build`: Build all applications
- `bun lint`: Run linting on all applications using Biome
- `bun format`: Format code using Biome
- `bun check`: Check code for errors using Biome
- `bun check:apply`: Check code for errors and apply automatic fixes using Biome

## License

This project is private and not licensed for public use.
