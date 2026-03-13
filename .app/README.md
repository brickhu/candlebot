# Candlebot WebApp

A modern web application for AI-powered chart analysis, built with SolidJS and Tailwind CSS 4.0.

## Features

- 🔐 **User Authentication** - Email/password and OAuth (Google, GitHub) login
- 📊 **Dashboard** - View analysis history and statistics
- 🎨 **Modern UI** - Built with Tailwind CSS 4.0 and custom design system
- ⚡ **Fast Performance** - SolidJS for optimal reactivity
- 🔄 **Real-time Updates** - WebSocket integration for live data
- 📱 **Responsive Design** - Works on all device sizes

## Tech Stack

- **Frontend Framework**: [SolidJS](https://www.solidjs.com/)
- **Styling**: [Tailwind CSS 4.0](https://tailwindcss.com/)
- **Routing**: [@solidjs/router](https://github.com/solidjs/solid-router)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **TypeScript**: For type safety
- **API Client**: Custom fetch-based client with error handling

## Project Structure

```
/app
├── src/
│   ├── components/     # Reusable UI components
│   ├── layouts/       # Layout components
│   ├── pages/         # Page components
│   ├── lib/           # Utilities and API client
│   ├── hooks/         # Custom React hooks
│   ├── types/         # TypeScript type definitions
│   └── index.tsx      # Application entry point
├── public/            # Static assets
├── index.html         # HTML template
└── vite.config.ts     # Vite configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd candlebot/app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Update `.env.local` with your configuration:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

### Development

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Building for Production

Build the application for production:

```bash
npm run build
# or
yarn build
# or
pnpm build
```

The built files will be in the `dist` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run serve
# or
yarn serve
# or
pnpm serve
```

## API Integration

The WebApp integrates with the Candlebot FastAPI backend. Make sure the backend is running and accessible at the URL specified in `VITE_API_URL`.

### Authentication Flow

1. **Email/Password**: Traditional login/registration
2. **OAuth**: Google and GitHub authentication
3. **JWT Tokens**: Secure token-based authentication

### API Endpoints

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/me` - Get current user
- `GET /analysis` - Get user's analysis history
- `POST /analysis` - Create new analysis

## Styling

The project uses Tailwind CSS 4.0 with a custom design system:

### Theme Colors

- `primary` (`#7EC8A4`) - Main brand color
- `primary-dark` (`#5AA67D`) - Darker primary variant
- `secondary` (`#D4A86A`) - Secondary accent color
- `bg` (`#0B1F17`) - Background color
- `surface` (`#142F22`) - Surface/container color
- `border` (`#2A5240`) - Border color
- `text` (`#F5F0E8`) - Primary text color
- `muted` (`#7A9E8A`) - Muted/secondary text color

### Fonts

- **Display**: Inter (bold, headings)
- **Body**: Inter (regular, body text)
- **Mono**: JetBrains Mono (code, technical text)

## Development Guidelines

### Component Structure

1. Use functional components with SolidJS primitives
2. Keep components focused and reusable
3. Use TypeScript for props and state
4. Follow the established design system

### State Management

- Use SolidJS signals for local state
- Use context for global state (authentication)
- Keep state as close to where it's used as possible

### Code Quality

- Use TypeScript strict mode
- Follow ESLint rules
- Write meaningful component and variable names
- Add comments for complex logic

## Deployment

The application can be deployed to various platforms:

### Vercel

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm install -g netlify-cli
netlify deploy
```

### Railway

```bash
npm install -g railway
railway up
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.