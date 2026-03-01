# CodePrep - Coding Interview Preparation Platform

A web-based coding practice platform for preparing for technical interviews. Solve problems by writing code, run against test cases, and get AI-powered feedback on your solutions.

## Features

- **Problem Practice**: Browse and solve coding problems with a built-in code editor
- **Concept-based Learning**: Problems organized by concepts (Two Pointers, Sliding Window, Dynamic Programming, etc.)
- **Company-specific Sets**: Practice problems tagged by companies (Google, Amazon, Meta, etc.)
- **Test Case Validation**: Run your code against visible test cases, submit to check hidden tests
- **Interview Prep Mode**: Generate randomized problem sets with configurable difficulty distribution
- **AI Analysis** (stub ready): Analyze your solution for time/space complexity (requires LLM API key)

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma 7
- **UI**: Tailwind CSS 4
- **Code Editor**: Monaco Editor

## Getting Started

### Prerequisites

- Node.js 20+
- Supabase account (free tier works)
- Python 3 (for code execution)

### Installation

1. Clone the repository and install dependencies:

```bash
cd coding-platform
npm install
```

2. Set up Supabase:
   - Create a project at [supabase.com](https://supabase.com)
   - Go to Settings → Database → Connection string → Session pooler
   - Copy the connection string

3. Configure environment:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase connection string:
```
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-[REGION].pooler.supabase.com:5432/postgres"
```

4. Generate Prisma client:

```bash
npx prisma generate
```

5. Seed the database:

```bash
npm run db:seed
```

6. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
coding-platform/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed data script
├── scripts/
│   ├── import-problems.ts  # Problem import script
│   └── sample-problems.json # Example import format
├── src/
│   ├── app/
│   │   ├── page.tsx        # Landing page
│   │   ├── dashboard/      # User dashboard
│   │   ├── problems/       # Problem listing and workspace
│   │   ├── concepts/       # Concept pages
│   │   ├── companies/      # Company pages
│   │   ├── interview/      # Interview prep mode
│   │   └── api/
│   │       ├── problems/   # Problems filter API
│   │       ├── execute/    # Code execution with test cases
│   │       ├── analyze/    # LLM analysis (stub)
│   │       └── interview/  # Interview problem generation
│   ├── components/
│   │   ├── CodeEditor.tsx
│   │   ├── ProblemClient.tsx
│   │   ├── ProblemsClient.tsx
│   │   ├── ProblemFilters.tsx
│   │   └── InterviewClient.tsx
│   └── lib/
│       ├── db.ts           # Prisma client
│       ├── queries.ts      # Database queries
│       └── types.ts        # TypeScript types
└── .env.example            # Environment template
```

## Importing Problems

You can import problems from JSON files:

```bash
# Import from JSON
npm run import:problems -- scripts/sample-problems.json

# Preview without saving (dry run)
npm run import:problems -- problems.json --dry-run

# Update existing problems
npm run import:problems -- problems.json --update
```

### JSON Format

```json
[
  {
    "title": "Two Sum",
    "slug": "two-sum",
    "difficulty": "Easy",
    "description": "Given an array...",
    "starterCodePython": "class Solution:\n    def twoSum(self, nums, target):\n        pass",
    "starterCodeJs": "var twoSum = function(nums, target) {\n};",
    "concepts": ["hashing", "arrays"],
    "companies": ["google", "amazon"],
    "testCases": [
      { "input": { "nums": [2,7,11,15], "target": 9 }, "expectedOutput": [0,1], "isHidden": false }
    ],
    "constraints": ["2 <= nums.length <= 10^4"],
    "hints": ["Try using a hash map"]
  }
]
```

## LLM Integration

The analyze endpoint is ready for LLM integration. To enable:

1. Add your LLM API key to `.env`:
```
LLM_API_KEY=your_api_key_here
```

2. Implement the actual API call in `src/app/api/analyze/route.ts`

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables:
   - `DATABASE_URL` - Your Supabase connection string
   - `LLM_API_KEY` (optional)

### Other Platforms

The app can be deployed anywhere that supports Next.js. Just ensure:
- `DATABASE_URL` environment variable is set
- Node.js 20+ runtime

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:seed` - Seed the database
- `npm run import:problems` - Import problems from file

## Database Schema

The database includes:

- **problems** - Coding problems with descriptions, starter code
- **test_cases** - Test cases for each problem (visible and hidden)
- **concepts** - Coding concepts/patterns
- **companies** - Company tags
- **problem_concepts** - Many-to-many relation
- **problem_companies** - Many-to-many relation
- **users** - User accounts (prepared for auth)
- **user_progress** - Track solved problems
- **submissions** - Code submission history

## License

MIT
