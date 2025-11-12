# TradeFlow

## Key Features

### Core Technologies
- **React 19.1.0** - Latest React with improved performance and features
- **Bootstrap 5.3.7** - Modern CSS framework with utilities
- **Redux Toolkit** - State management
- **React Router v7** - Navigation and routing
- **Sass/SCSS** - Advanced styling capabilities

### UI Components
- **30+ Ready-to-use Components** - Forms, tables, charts, modals, and more
- **Multiple Dashboard Layouts** - Analytics, CRM, Commerce, Sales, and Minimal
- **Advanced Form Elements** - Date pickers, file uploads, text editors, sliders
- **Data Visualization** - ApexCharts, Chart.js, Recharts integration
- **Interactive Maps** - Google Maps and Vector Maps support
- **Responsive Design** - Mobile-first approach with all device compatibility

## Quick Start

### Prerequisites

- **Node.js** (LTS version) - [Download here](https://nodejs.org/en/download/)
- **npm** or **yarn** package manager

### Installation

1. **Clone or Download** the repository
   ```bash
   git clone https://github.com/DashboardPack/tradeflow-react-theme-free.git
   cd tradeflow-react-theme-free
   ```

2. **Install Dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```
   
   The application will open in your browser at `http://localhost:3001`

### Build for Production

1. **Create Production Build**
   ```bash
   npm run build
   ```

2. **Serve Production Build Locally**
   ```bash
   npx serve -s build -l 4000
   ```
   
   View the production build at `http://localhost:4000`

## Project Structure

```
tradeflow-react-theme-free/
├── public/                 # Static files
├── src/
│   ├── assets/            # Styles, images, and static assets
│   ├── components/        # Reusable UI components
│   ├── Pages/         # Demo pages and examples
│   │   ├── Dashboards/    # Dashboard variations
│   │   ├── Components/    # UI component examples
│   │   ├── Forms/         # Form examples
│   │   └── Tables/        # Table examples
│   ├── Layout/            # Layout components
│   │   ├── AppHeader/     # Header components
│   │   ├── AppSidebar/    # Sidebar components
│   │   └── AppFooter/     # Footer components
│   └── reducers/          # Redux store configuration
├── config-overrides.js   # Webpack configuration
└── package.json          # Dependencies and scripts
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server (port 3001) |
| `npm run build` | Create production build |
| `npm test` | Run test suite |
| `npm run eject` | Eject from Create React App (not recommended) |

## Browser Support

TradeFlow React supports all modern browsers:

- **Chrome** (latest)
- **Firefox** (latest)
- **Safari** (latest)
- **Edge** (latest)
- **Opera** (latest)

## Customization

### Theme Colors
Customize the color scheme by modifying the Sass variables in:
- `src/assets/themes/[theme-name]/_variables.scss`

### Layout Configuration
Adjust layout settings in:
- `src/reducers/ThemeOptions.js`

### Adding New Components
Follow the existing component structure in:
- `src/Pages/Components/`

## Technical Details

### Dependencies
- **UI Framework**: Bootstrap 5.3.7, Reactstrap 9.2.3
- **Charts**: ApexCharts 4.7.0, Chart.js 4.4.7, Recharts 2.13.3
- **Icons**: FontAwesome 6.7.2, React Icons 5.4.0
- **Forms**: React Hook Form, React Select, React Datepicker
- **Animations**: Framer Motion 12.19.1, React Animations
- **State Management**: Redux Toolkit 2.8.2
- **Build Tools**: React App Rewired, Sass 1.89.2

### Performance Features
- **Code Splitting** - Automatic route-based code splitting
- **Tree Shaking** - Eliminate unused code
- **Optimized Builds** - Minified and compressed assets
- **Lazy Loading** - Components load on demand

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2023 DashboardPack

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

## Support & Community

### Get Help
- **Documentation**: Comprehensive guides and examples included
- **GitHub Issues**: Report bugs and request features
- **Community**: Join our developer community

### Stay Updated
- **GitHub**: Star the repository for updates
- **DashboardPack**: Follow for new template releases
- **Changelog**: Check [CHANGELOG.md](Changelog.md) for version history

## Credits

**Developed by**: [DashboardPack.com](https://dashboardpack.com/)  
**Design**: Professional UI/UX team  
**Maintained by**: Open source community  

---

**Made with care for the developer community**

[Website](https://dashboardpack.com/) • [Templates](https://dashboardpack.com/) • [Support](https://dashboardpack.com/contact/) • [Free Resources](https://colorlib.com/)
