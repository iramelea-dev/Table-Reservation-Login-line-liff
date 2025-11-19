📱 Ionic React v5 Project (Native CSS Edition)
Welcome to this Ionic React v5 project. This application is designed to demonstrate Hybrid Mobile Application development with a focus on simplicity and performance by utilizing Native CSS (Standard CSS3) for styling, eliminating the need for complex Pre-processors like Sass or SCSS.

🚀 Features
Framework: Built with React

UI Library: Utilizes Ionic Framework v5

Styling: Pure Native CSS (No Sass/SCSS build steps)

Utilizes CSS Variables for comprehensive theming.

Component-based CSS separation (Modular approach).

Platform: Supports iOS, Android, and Web (PWA).

🛠 Prerequisites
Before starting, ensure your machine has the following installed:

Node.js (LTS version recommended)

NPM or Yarn

Ionic CLI (Install via the command below)

Bash

npm install -g @ionic/cli
📦 Installation & Setup
Clone the repository:

Bash

git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
Install Dependencies:

Bash

npm install
# Or if using yarn
yarn install
Run the project (Development Mode):

Bash

ionic serve
The browser will automatically open at http://localhost:8100.

🎨 CSS Architecture
The highlight of this project is the use of Native CSS for design management. It is divided into 3 main parts for clarity and maintainability:

1. Global Variables (src/theme/variables.css)
We use Ionic's CSS Custom Properties (Variables) as the primary method to control the app's colors and theme.

Change the Primary Color in one single place.

Automatic Dark Mode support via Media Queries.

CSS

/* Example in variables.css */
:root {
  --ion-color-primary: #3880ff;
  --ion-color-secondary: #3dc2ff;
  --custom-padding: 16px; /* Custom variable example */
}
2. Global Styles (src/theme/global.css)
This file contains application-wide styles or overrides for default Ionic component values globally (Utility classes).

3. Component-Level CSS
Every Page or Component has a paired .css file for easier maintenance and style isolation (Encapsulation).

Home Page Example:

Home.tsx (Logic & View)

Home.css (Styles specific to this page)

Coding Convention: We use BEM naming conventions or descriptive class names and strictly avoid ID selectors for styling.

📂 File Structure
To provide a clear overview, the project structure is organized as follows:

Plaintext

src/
├── components/      # Reusable UI Components (Buttons, Cards, etc.)
│   ├── MyCard.tsx
│   └── MyCard.css   <-- Component-specific styles
├── pages/           # Main Application Screens
│   ├── Home.tsx
│   └── Home.css     <-- Page-specific styles
├── theme/           # Main Theme Settings
│   ├── variables.css  <-- CSS Variables (Colors, Fonts)
│   └── global.css     <-- Global Reset & Utilities
├── App.tsx          # Main Router
└── index.tsx        # Entry Point
📱 Building for Mobile
To run this project on iOS or Android using Capacitor:

Build Web Assets:

Bash

ionic build
Add Platform:

Bash

npx cap add android
npx cap add ios
Sync & Open:

Bash

npx cap sync
npx cap open android # or ios
🤝 Contributing
Fork the project

Create your Feature Branch (git checkout -b feature/AmazingFeature)

Commit your changes (git commit -m 'Add some AmazingFeature')

Push to the Branch (git push origin feature/AmazingFeature)

Open a Pull Request

📝 Note
This project is developed using Ionic v5. If you plan to upgrade to v6 or v7, please check the Ionic documentation for potential Breaking Changes.
