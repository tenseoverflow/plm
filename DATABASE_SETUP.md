# PLM Database Setup

To set up your D1 database for the PLM app with passkey support, run the following commands:

## 1. Apply the schema

```bash
# Apply the schema to your local D1 database (for development)
npx wrangler d1 execute PLM_DB --local --file=schema.sql

# Apply the schema to your remote D1 database (for production)
npx wrangler d1 execute PLM_DB --file=schema.sql
```

## 2. Verify the setup

```bash
# Check local database
npx wrangler d1 execute PLM_DB --local --command="SELECT name FROM sqlite_master WHERE type='table';"

# Check remote database
npx wrangler d1 execute PLM_DB --command="SELECT name FROM sqlite_master WHERE type='table';"
```

You should see three tables:

- `users` - Stores user accounts
- `user_credentials` - Stores passkey credentials
- `user_data` - Stores synchronized user data

## 3. Development vs Production

- Use `--local` flag for development/testing
- Omit `--local` flag for production deployment

The passkey system will:

- Store data locally in browser storage when not authenticated
- Sync data to D1 database when authenticated with a passkey
- Allow seamless switching between devices with the same passkey
