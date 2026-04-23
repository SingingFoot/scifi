# Gemini Instructional Context: Ukrainian Sci-Fi

This directory contains the source code and content for the "Ukrainian Sci-Fi" documentation project, which explores the history, authors, and works of Ukrainian science fiction literature.

## Project Overview

*   **Purpose:** A comprehensive documentation site and blog dedicated to the past, present, and future of Ukrainian science fiction.
*   **Technologies:**
    *   **MkDocs:** Static site generator for project documentation.
    *   **Material for MkDocs:** A powerful theme for MkDocs, heavily customized here.
    *   **Python:** Core logic for MkDocs, extensions, and custom hooks.
    *   **Node.js/TypeScript/Sass:** Used for building and customizing the Material theme components.
*   **Architecture:**
    *   `docs/`: Contains the Markdown source files for the site content.
    *   `mkdocs.yml`: The primary configuration file for MkDocs.
    *   `material/`: Contains theme overrides and built assets.
    *   `src/`: Source files for custom theme development (TS, SCSS).
    *   `tools/`: Node.js build scripts for the theme.
    *   `site/`: The output directory for the generated static site.

## Building and Running

### Prerequisites

*   Python 3.8+
*   Node.js 18+
*   `pip` and `npm`

### Setup

1.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
2.  **Install Node.js dependencies:**
    ```bash
    npm install
    ```

### Development Workflow

*   **Build the Theme:**
    Builds the TypeScript and Sass assets into the `material/` directory.
    ```bash
    npm run build
    ```
*   **Start Theme Development:**
    Starts a watcher for theme assets.
    ```bash
    npm start
    ```
*   **Preview the Site:**
    Starts the MkDocs development server with live reloading for content.
    ```bash
    mkdocs serve
    ```

### Production Build

1.  **Build the assets:**
    ```bash
    npm run build
    ```
2.  **Generate the static site:**
    ```bash
    mkdocs build
    ```

## Development Conventions

*   **Content:** All articles and blog posts should be written in Markdown and placed in the `docs/` directory.
*   **Navigation:** The site structure is defined in the `nav` section of `mkdocs.yml`.
*   **Custom Logic:** Custom Python logic (shortcodes, translations) is located in `material/overrides/hooks/`.
*   **Styling:** Custom CSS/Sass should be integrated into the `src/` directory and built using the Node.js toolchain.
*   **Commit Style:** Follow existing conventions; do not stage or commit changes unless explicitly requested.

## Key Files and Directories

*   `docs/phd/`: Contains PhD-related research and specialized articles (e.g., `kasyanyuk-techno-communism.md`, `ukrainian-sf-part-1.md`).
*   `docs/articles/`: General articles and analysis of sci-fi works (e.g., `metamodern-oscillation-ostrykov.md`, `manifesto.md`).
*   `docs/authors/`: Biographies and profiles of notable Ukrainian sci-fi authors (e.g., `sandro-kasyanyuk.md`, `vasyl-berezhnyi.md`).
*   `mkdocs.yml`: Configuration for theme features, plugins, and navigation.
*   `requirements.txt`: Python package requirements.
*   `package.json`: Node.js build scripts and dependencies for theme customization.
