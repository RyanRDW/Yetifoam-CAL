# Yetifam Calculator

A modern web application for calculating spray foam insulation requirements for metal sheds, built with React, TypeScript, and Material Design 3.

## Features

- **Precise Calculations**: Calculate spray foam area based on shed dimensions, pitch, cladding type, and member configuration
- **Fully Visual Interface**: All selections use interactive image buttons - no dropdowns
  - **Centered Dimension Images**: Click any dimension field to see centered measurement guide (Length, Width, Height)
  - **Pitch Selection**: 6 clickable pitch angle images (5°-30°) with visual feedback
  - **Cladding Selection**: Image buttons for Corrugated and Monoclad with instant preview
  - **All images are centered and properly sized** for consistent visual experience
- **Compact Configuration Section**: Cladding, Members, Spray Options, and Openings all in one organized section
- **Opening Management**: Track doors, windows, and other openings to accurately deduct from spray area
- **AI Sales Assistant**: Generate comprehensive sales talking points using OpenAI GPT-4o-mini with hardcoded API key
  - **17 Preset Topics**: Quick access to common customer concerns (Condensation, Rust, Too Expensive, Anti-con, Reflective Foil, etc.)
  - **Custom Topics**: Create your own topic buttons for frequently discussed subjects
  - **Multi-Select**: Select multiple topics simultaneously - AI addresses EACH topic comprehensively
  - **Comprehensive Responses**: AI provides 3-5 statements per topic covering benefits, competitor flaws, costs, and technical facts
  - **Yetifoam Knowledge Base**: AI trained on extensive product data, competitor comparisons (Anti-con, Foilboard, Fibreglass), and TCO analysis
  - **Clean Conversational Responses**: No sales fluff, no headings - just direct statements salespeople can say to customers
  - **1500 token responses**: Long enough to address multiple topics thoroughly
- **Compact Results Display**: Configuration summary, Total Spray Area, and Area Breakdown all in one card (3-column layout)
- **Material Design 3**: Clean, accessible UI following Material Design guidelines
- **Desktop-First Design**: Optimized for desktop workflow (minimum 1280px width)

## Tech Stack

- **React 19** + **TypeScript** - Modern component architecture
- **Vite** - Fast build tooling
- **Material-UI v5+** - Material Design component library
- **React Router** - Client-side routing
- **React Hook Form** + **Zod** - Form validation
- **React Query** - Server state management
- **Vitest** + **Testing Library** - Unit and integration tests

## Project Structure

```
src/
  app/              # Routing, layout shell, providers
  features/
    calculator/     # Calculator UI and logic (CalculatorForm, CalculatorResult)
    ai/             # AI sales assistant panel (AIPanel)
  components/       # Shared UI components
    common/         # Reusable components (ImageTile)
    inputs/         # Form input components (Dimensions, OpeningsDialog)
  lib/              # API clients, utilities, hooks
    ai.ts           # OpenAI integration with Yetifoam knowledge base
  theme/            # Material Design 3 tokens and theme
  pages/            # Route-level page components (CalculatorPage)
  state/            # Form schemas and types
  config/           # Presets and configuration data (presets.json)
public/
  images/           # Reference images for calculator (dimensions, pitch, cladding)
server/
  llm/              # Server-side LLM integration (Grok API)
  state/            # Server state management (salesLog)
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- (Optional) OpenAI API key for AI sales assistant features

### Installation

```bash
# Install dependencies
npm install
# or
pnpm install
```

### Development

```bash
# Run the development server
npm run dev

# The app will be available at http://localhost:5173
```

### Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm test -- --watch
```

### Building for Production

```bash
# Build the client application
npm run build

# Preview production build
npm run preview
```

## Usage

### Calculator Workflow

1. **Enter Dimensions**: Provide length, width, and wall height in meters
   - Centered helper images automatically update as you click each dimension field
   - All dimension images are properly centered for easy viewing
2. **Select Pitch**: Click on one of the 6 visual pitch angle buttons (5°, 10°, 15°, 22°, 25°, 30°)
   - Images show exactly what each pitch angle looks like with hover effects
3. **Configuration Section** (all in one):
   - **Cladding**: Click on Corrugated or Monoclad image button
   - **Members**: Select Roof Member and Wall Member from dropdowns
   - **Spray Options**: Check boxes for roof battens and wall purlins
   - **Openings**: Click "Manage Openings" to add doors, windows, etc.
4. **Use AI Sales Assistant** (appears before Calculate button):
   - Select one or more preset topics (Anti-con, Condensation, Too Expensive, etc.)
   - Add custom context in the text field
   - Click "Generate Sales Points" to get comprehensive responses
   - AI addresses EACH selected topic with 3-5 relevant statements
5. **Calculate**: Click Calculate to see results in compact 3-column layout:
   - Configuration summary (left)
   - Total Spray Area (center, highlighted)
   - Area Breakdown table (right)

### AI Sales Assistant

The AI Sales Assistant helps generate customized talking points for customer conversations. The OpenAI API key is hardcoded in the application - no setup required!

**How to Use**:

1. **Select Topics**: Click on preset topic chips like "Condensation", "Rust", "Too Expensive", "Anti-con", etc.
   - You can select multiple topics at once
   - Selected topics appear highlighted in blue
2. **Create Custom Topics**: Click "Add Topic" to create your own preset buttons for frequently discussed subjects
   - Custom topics can be deleted by clicking the X icon
3. **Add Context**: Type additional questions or context in the multi-line text box
4. **Generate**: Click "Generate Sales Points" to get comprehensive statements addressing ALL selected topics
5. **Use the Responses**: Copy the generated statements to use directly with customers
   - No sales fluff or headings - just clear, conversational statements
   - Responses stay visible on screen (fixed 400px height with scroll)
   - Each topic gets 3-5 relevant statements

**Knowledge Base Includes**:
- **Yetifoam Benefits**: Structural strength (300% wind uplift, 124-200% racking), condensation elimination (100%), thermal bridging elimination, air leakage reduction (83%), zero degradation (25+ years), Class 1 vapour barrier, pest prevention
- **Competitor Product Flaws**:
  - **Anti-con/Reflective Foil/Aircell**: Requires roof removal (voids warranty), degrades in 5 years (dust), 0-13% winter benefit, NOT a vapour barrier, still allows condensation
  - **Fibreglass Batt Walls**: $47k vs Yetifoam $16k, loses 150-200mm space, 40-60% R-value loss from compression, degrades to 31-38% by year 5, NOT a vapour barrier
  - **Foilboard**: Requires demolition, $18k (13% more), degrades in 5 years, gaps allow condensation
- **Total Cost of Ownership**: 10-year TCO Yetifoam $25,750 vs Fibreglass $60,350
- **Customer Education**: What customers don't know about insulation products

**How the AI Works**:

The AI uses **GPT-4o-mini** from OpenAI with a comprehensive knowledge base about Yetifoam products and competitors. When you select topics:

1. **Topic Formatting**: Topics are sent as bullet points (`• Condensation`, `• Anti-con`) to ensure the AI treats each as distinct
2. **Comprehensive Coverage**: The AI is instructed to provide 3-5 statements PER topic covering:
   - Yetifoam benefits relevant to that topic
   - Competitor product flaws (when applicable)
   - Cost comparisons
   - Technical facts and data points
3. **Response Length**: 1500 token limit allows thorough coverage of multiple topics simultaneously
4. **Conversational Style**: Responses are formatted as direct statements a salesperson can say verbatim to customers

**Example**: Selecting "Anti-con" generates statements about:
- Warranty voiding from roof removal
- 5-year degradation due to dust accumulation (Kingspan admits this)
- 0-13% winter benefit (sometimes makes sheds colder)
- NOT a vapour barrier (condensation still forms)
- Not designed for retrofitting (requires demolition)

**API Key Configuration**: The OpenAI API key is stored in `.env` as `VITE_OPENAI_API_KEY` and is injected at build time. The key is hardcoded into the application bundle, so no runtime configuration is needed.

**Feedback**: Use the red "Report Calculation Issue + Update Sales Responses" button to submit feedback about calculation accuracy or AI response quality.

## Architecture Decisions

### Material Design 3

The application uses Material Design 3 tokens and components for consistency, accessibility, and maintainability:

- **Design Tokens**: Centralized spacing, colors, typography, and elevation values
- **Theme System**: MUI theme configured with MD3 specifications
- **Components**: All UI components use MUI components or follow MD3 patterns

### Calculation Logic

Pure calculation functions are isolated in `src/features/calculator/logic.ts`:

- **No side effects**: All calculations are pure functions
- **Testable**: Easy to unit test without UI dependencies
- **Reusable**: Logic can be used in other contexts (CLI, API, etc.)

### Form Management

React Hook Form with Zod schema validation provides:

- **Type Safety**: Full TypeScript support with inferred types
- **Performance**: Minimal re-renders with uncontrolled inputs
- **Validation**: Declarative validation with clear error messages

### No Export Features

This version removes all PDF and quote template download features. Users can:

- View calculation results on screen
- Copy values manually if needed
- Use the AI assistant to generate sales language

## Testing

The project includes comprehensive tests:

- **Unit Tests**: Calculator logic functions (`src/features/calculator/__tests__/logic.test.ts`)
- **Integration Tests**: Server LLM endpoints (`test/llm.test.ts`, `test/sales.test.ts`)
- **Coverage**: Core calculation logic, edge cases, and API contracts

Run tests with:

```bash
npm test
```

## Accessibility

The application follows WCAG 2.2 AA guidelines:

- **Semantic HTML**: Proper use of headings, labels, and ARIA roles
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Focus Management**: Visible focus indicators on all interactive elements
- **Touch Targets**: Minimum 44×44px touch targets for mobile
- **Color Contrast**: Text meets minimum contrast ratios

## Configuration

### Calculation Presets

Calculation factors and presets are defined in `src/config/presets.json`:

- Pitch factors (1.004 to 1.155)
- Cladding factors (corrugated: 1.2, monoclad: 1.0)
- Member spacing presets
- Opening area specifications

### Environment Variables

Create a `.env` file for configuration:

```env
VITE_OPENAI_API_KEY=your_openai_key_here  # Required for AI Sales Assistant
OPENAI_API_KEY=your_openai_key_here       # Required for server-side features
GROK_API_KEY=your_grok_key_here           # Optional, for Grok API integration
PORT=8788                                  # Server port (default: 8788)
```

> **Note**: `VITE_OPENAI_API_KEY` is injected at build time and enables client-side AI features. The application makes direct OpenAI API calls from the browser for the Sales Assistant.

## Deployment

The application can be deployed as a static site:

```bash
# Build for production
npm run build

# Deploy the `dist` folder to any static hosting provider:
# - Vercel
# - Netlify
# - AWS S3 + CloudFront
# - GitHub Pages
```

For Vercel deployment:

```bash
npm run deploy        # Preview deployment
npm run deploy:prod   # Production deployment
```

## Contributing

When making changes:

1. Follow the existing code style (ESLint + Prettier)
2. Add tests for new features
3. Update this README if adding new functionality
4. Ensure all tests pass: `npm test`
5. Build successfully: `npm run build`

## License

Proprietary - YetiFoam TAS

---

**Questions?** Contact the development team or refer to the [full specification](./yetifoam-calculator-spec.md).
