# Vinoothna Kisan Sethu
Vinuthna Agrochemicals Raithu Sethu  is a comprehensive agricultural management platform designed to empower farmers and agricultural professionals. It serves as a bridge between modern agricultural knowledge and practical application, providing detailed crop management strategies, problem identification, and treatment recommendations.

## 🚀 Project Overview

The application is built to assist in the complete lifecycle of crop management. It offers a multi-lingual interface to cater to a diverse user base, ensuring accessibility for farmers across different regions.

### Key Features

*   **Multi-Language Support**: Seamlessly switch between English, Telugu, and Hindi to ensure broad accessibility.
*   **Role-Based Access Control**:
    *   **Farmers/Users**: Access crop information, identify problems by growth stage, and view treatment plans without login.
    *   **Managers**: specialized dashboard for field management and oversight.
    *   **Admins**: Comprehensive control to manage crops, stages, problems, and product recommendations.
*   **Crop & Stage Selection**: Intuitive interface for selecting crops and their specific growth stages (including an "All Stages" view).
*   **Problem Identification**: Visual-aided checking system to identify pests, diseases, or deficiency issues.
*   **Smart Recommendations**: tailored product recommendations and detailed treatment plans based on the identified problem.
*   **Admin Dashboard**: Robust backend management for adding/editing crops, mapping problems to stages, and managing inventory/products.

## 🛠️ Tech Stack

This project uses a modern, high-performance technology stack:

*   **Frontend**: [React](https://react.dev/) with [Vite](https://vitejs.dev/) for fast development and optimized builds.
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) for a utility-first design system, combined with [shadcn/ui](https://ui.shadcn.com/) for accessible, reusable components.
*   **State Management**: [TanStack Query](https://tanstack.com/query/latest) for efficient server state management.
*   **Backend/Database**: [Supabase](https://supabase.com/) for authentication, real-time database, and storage.
*   **Routing**: [React Router](https://reactrouter.com/) for client-side routing.
*   **Deployment**: [Vercel](https://vercel.com/) for seamless global deployment.

## 🔄 Workflow

### User Journey (Farmer/General User)
1.  **Language Selection**: Upon opening the app, choose your preferred language.
2.  **Home Screen**: Navigate to the "Get Started" or "Crops" section.
3.  **Crop Selection**: Choose a crop from the available list.
4.  **Stage Selection**: Select the current growth stage of the crop (e.g., Seedling, Vegetative, Flowering, or All Stages).
5.  **Problem Identification**: Browse through potential problems associated with the selected crop and stage.
6.  **Solutions**: View recommended products and a detailed treatment plan to address the issue.

### Admin Workflow
1.  **Login**: Access the specific Admin Login route.
2.  **Dashboard**: Land on the centralized Admin Dashboard.
3.  **Management**:
    *   **Crops**: Add new crops or update existing ones.
    *   **Stages**: Define growth stages for each crop.
    *   **Problems**: Log specific pests or diseases.
    *   **Products**: Manage inputs/fertilizers/pesticides database.
    *   **Mappings**: Link problems to specific stages and recommend products for those problems.

## 💻 Getting Started (Local Development)

Follow these steps to run the project locally on your machine.

### Prerequisites
*   [Node.js](https://nodejs.org/) (Latest LTS version recommended)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <YOUR_GIT_URL>
    cd vinoothna-kisansethu
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Ensure you have your `.env` file configured with Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:8080` (or similar port).

## 🚀 Deployment

This project is optimized for deployment on Vercel.

### Production Build & Deploy
To deploy the production version to Vercel:

1.  **Build the project:**
    ```bash
    npm run build
    ```

2.  **Deploy to Vercel (Production):**
    ```bash
    vercel --prod
    ```

## 📂 Project Structure

```
src/
├── components/        # Reusable UI components (Buttons, Cards, etc.)
│   ├── admin/         # Admin-specific components
│   └── ui/            # Shadcn UI primitives
├── contexts/          # React Contexts (Auth, Language)
├── hooks/             # Custom React Hooks
├── integrations/      # Third-party integrations (Supabase client)
├── pages/             # Main Application Pages (Routes)
│   ├── AdminDashboard.tsx
│   ├── CropSelection.tsx
│   ├── Login.tsx
│   └── ...
├── types/             # TypeScript type definitions
├── App.tsx            # Main App component & Routing setup
└── main.tsx           # Entry point
```


