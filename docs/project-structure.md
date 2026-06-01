# Project Folder Structure Documentation

This document outlines the folder structure of the application, which follows standard React/Vite best practices for scalability and maintainability.

## Root Directory (`/`)
- `src/` - The main source code for the application.
- `public/` - Static assets that are served as-is (e.g., favicon, manifest).
- `node_modules/` - Third-party dependencies installed via npm/bun.
- `package.json` / `package-lock.json` - Project metadata, scripts, and dependency definitions.
- `vite.config.ts` - Configuration file for Vite (the build tool and development server).
- `tailwind.config.ts` / `postcss.config.js` - Configuration for styling.
- `tsconfig.json` - TypeScript compiler configurations.
- `.env` - Environment variables (ignored in Git).
- `.gitignore` - Specifies intentionally untracked files to ignore.

## Source Directory (`/src`)

The `src/` directory is organized by feature and technical concern:

```text
src/
├── assets/          # Static assets imported into components (images, icons, global CSS).
├── components/      # Reusable UI components.
│   ├── admin/       # Components specific to the Admin dashboard and features.
│   ├── manager/     # Components specific to the Manager dashboard and features.
│   ├── ui/          # Generic, reusable base UI components (e.g., Shadcn UI components).
│   └── ...          # Shared/common components (e.g., LanguageSelector.tsx).
├── contexts/        # React Context providers for global state management (Auth, Language).
├── hooks/           # Custom React hooks containing reusable logic.
├── integrations/    # External service configurations and clients (e.g., Supabase).
├── lib/             # Utility functions and helper classes (e.g., formatting, constants).
├── pages/           # High-level components acting as route views.
├── types/           # TypeScript interfaces and type definitions used across the app.
├── App.tsx          # Root application component handling routing and global providers.
├── App.css          # App-level styling.
├── index.css        # Global CSS entry point (typically contains Tailwind directives).
├── main.tsx         # Application entry point that mounts the React app to the DOM.
└── vite-env.d.ts    # Vite environment type definitions.
```

### Deep Dive into Specific Folders

#### `src/components/`
This folder contains the building blocks of the UI.
- **Role-based subdirectories** (`admin/`, `manager/`): encapsulate complex UI logic specific to certain user roles, keeping the root components folder clean.
- **UI Components** (`ui/`): typically contains highly reusable, stateless "dumb" components (buttons, dialogs, inputs).
- **Shared Components**: Files directly under `src/components/` are shared across multiple pages or features (e.g., navigation links, uploads).

#### `src/pages/`
Each file in this directory represents a distinct route/view in the application. They are composed by bringing together multiple components from `src/components/`. Examples include `Home.tsx`, `AdminDashboard.tsx`, and `TreatmentPlan.tsx`.

#### `src/contexts/`
Contains global state providers. For instance:
- `AuthContext.tsx` manages user authentication state across the app.
- `LanguageContext.tsx` manages internationalization/localization settings.

#### `src/hooks/`
Contains reusable logic separated from UI components, such as data fetching hooks or window resize listeners.

#### `src/lib/`
Contains utility functions. A common pattern here is `utils.ts` which provides helper functions for tailwind class merging (`cn` function), formatting dates, or other pure functions.

## Future Recommendations
- **Centralize Common Components**: As the application grows, consider grouping the standalone components in `src/components/` into a `src/components/common/` folder.
- **Feature Modules**: For very large applications, organizing by feature (e.g., `src/features/crops/`) instead of by type (`components/`, `pages/`) can improve maintainability.
