# PLM - Personal Life Management

A personal productivity and life management app with passkey authentication, built with React, Express, and PostgreSQL.

## 🏗️ Architecture

This is a **Bun monorepo** with the following structure:

```
plm/
├── packages/
│   ├── client/          # React + Vite frontend
│   └── server/          # Express.js API backend
├── package.json         # Root workspace config
├── compose.yml          # Docker Compose for deployment
└── orval.config.ts      # API client generator config
```

## 🚀 Tech Stack

### Frontend (`packages/client`)

- **Runtime**: Bun
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State**: Zustand
- **API Client**: Auto-generated from OpenAPI (Orval)

### Backend (`packages/server`)

- **Runtime**: Bun
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL 18
- **Authentication**: WebAuthn (Passkeys)
- **API Docs**: Scalar + Swagger UI

### Infrastructure

- **Monorepo**: Bun Workspaces
- **Containers**: Docker with multi-stage builds
- **Database**: PostgreSQL 18-alpine
- **Reverse Proxy**: Nginx (frontend)

## 📦 Development

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- Docker or Podman (for deployment)
- PostgreSQL (for local dev, or use Docker)

### Setup

1. **Install dependencies**:

```bash
bun install
```

2. **Configure environment**:

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL
```

3. **Set up PostgreSQL database**:

```bash
# Create database and user
sudo -u postgres psql
# In psql:
CREATE DATABASE plm;
CREATE USER plmuser WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE plm TO plmuser;
\q
```

4. **Run database migrations**:

```bash
bun db:migrate
```

5. **Start development servers**:

```bash
bun dev
```

This starts:

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`
- API Docs (Scalar): `http://localhost:3000/api/docs`
- API Docs (Swagger): `http://localhost:3000/api/docs/swagger`

### API Client Generation

The API client is auto-generated from the backend's OpenAPI specification:

1. **Start the dev server** (if not running):

```bash
bun --filter @plm/server dev
```

2. **Generate client**:

```bash
bun generate:api
```

This fetches the OpenAPI spec from `http://localhost:3000/api/docs/openapi.json` and generates TypeScript types and API functions in `packages/client/src/generated/`.

## 🏭 Production Deployment

### Using Docker Compose

```bash
# Build and start all services
docker compose up -d

# Or with Podman
podman compose up -d
```

Services:

- **frontend**: Nginx serving React SPA on port 3000
- **backend**: Express API on internal network
- **db**: PostgreSQL database with persistent volume

### Environment Variables

Required for production:

```env
DATABASE_URL=postgresql://plmuser:password@db:5432/plm
DB_PASSWORD=your_secure_password
NODE_ENV=production
PORT=3000
```

## 📚 API Documentation

### Auto-Generated OpenAPI Spec

The backend uses **JSDoc comments** to auto-generate the OpenAPI specification:

```typescript
/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 */
router.get("/health", async (req, res) => { ... });
```

### Viewing Docs

- **Scalar UI** (modern): `http://localhost:3000/api/docs`
- **Swagger UI** (classic): `http://localhost:3000/api/docs/swagger`
- **Raw JSON**: `http://localhost:3000/api/docs/openapi.json`

## 🔐 Authentication

Uses **WebAuthn passkeys** for secure, passwordless authentication:

1. **Registration**: Creates user account with device passkey
2. **Login**: Authenticates using device biometrics/PIN
3. **Data Sync**: Encrypted data storage tied to user account

### Security Features

- No passwords stored
- Device-bound credentials
- Biometric authentication
- Automatic data sync when authenticated
- Local-only mode for guest users

## 🛠️ Scripts

### Root Commands

```bash
bun dev              # Start dev servers (client + server)
bun build            # Build for production
bun start            # Run production server
bun generate:api     # Generate API client
bun lint             # Run ESLint
bun format           # Format code with Prettier
bun db:migrate       # Run database migrations
```

### Package-Specific

```bash
# Server
bun --filter @plm/server dev      # Dev server with watch
bun --filter @plm/server build    # Build server
bun --filter @plm/server start    # Run built server

# Client
bun --filter @plm/client dev      # Vite dev server
bun --filter @plm/client build    # Build for production
bun --filter @plm/client preview  # Preview production build
```

## 📂 Project Structure

```
packages/
├── client/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── lib/             # Utilities and helpers
│   │   ├── store/           # Zustand state management
│   │   ├── generated/       # Auto-generated API client (gitignored)
│   │   └── main.tsx         # Entry point
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── Dockerfile
└── server/
    ├── src/
    │   ├── routes/          # API route handlers
    │   ├── db/              # Database schemas and migrations
    │   ├── utils/           # Shared utilities
    │   ├── swagger.ts       # OpenAPI config
    │   └── index.ts         # Server entry point
    ├── tsconfig.json
    └── Dockerfile
```

## 🧪 Features

- ✅ **Passkey Authentication** - Secure, passwordless login
- ✅ **Auto Sync** - Automatic data sync when authenticated
- ✅ **Offline First** - Works locally without account
- ✅ **Mood Tracking** - Daily mood logging
- ✅ **Task Management** - Daily tasks + backlog
- ✅ **Habit Tracking** - Custom schedules (daily, weekdays, custom)
- ✅ **Focus Timer** - Pomodoro and custom focus sessions
- ✅ **Weekly Review** - Reflection and planning
- ✅ **Quarterly Planning** - Long-term goal setting
- ✅ **Journal** - Daily journaling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run linting and formatting: `bun lint && bun format`
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

GPL-3.0-only

## 👤 Author

**tenseoverflow** - [contact@hen.ee](mailto:contact@hen.ee)

## 🔗 Links

- Homepage: https://plm.hen.ee
- Repository: https://github.com/tenseoverflow/plm
- Issues: https://github.com/tenseoverflow/plm/issues

---

**Built with ❤️ using Bun, React, and PostgreSQL** 5. Set up nginx as reverse proxy 6. Configure SSL with Let's Encrypt

See [`MIGRATION.md`](./MIGRATION.md) for more deployment details.

### Option 5: Podman (Containerized Deployment)

For deployment using Podman:

1. Ensure Podman and podman-compose are installed on your server
2. Clone the repository and navigate to the project directory
3. Copy `.env.example` to `.env` and configure your environment variables
4. Build and run the containers:

```bash
# Build and start all services
podman-compose up --build -d

# Or for production, use the compose file
podman-compose -f compose.yml up --build -d
```

5. The application will be available at http://localhost:3000 (or configured port)

For production with reverse proxy:

- Use nginx or another reverse proxy to proxy to the frontend container
- Ensure database volumes are persisted
- Set `NODE_ENV=production` in environment

See [`QUICKSTART.md`](./QUICKSTART.md) for quick setup.

## Migration from Cloudflare

If you're migrating from the previous Cloudflare-based stack, see [`MIGRATION.md`](./MIGRATION.md) for a complete guide.

## Security

- Passkeys are stored securely using WebAuthn standards
- All API routes should be protected (authentication to be enhanced)
- Environment variables for sensitive configuration
- CORS configured for frontend origin
- SQL injection protection via parameterized queries

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

GPL-3.0-only - See [LICENSE](./LICENSE) file for details

## Support

For issues and questions, please use the [GitHub Issues](https://github.com/tenseoverflow/plm/issues) page.
