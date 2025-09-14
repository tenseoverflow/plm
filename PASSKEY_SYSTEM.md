# PLM Passkey Authentication System

This document describes the new passkey authentication system that replaces the old passkey lock feature.

## Overview

The PLM app now supports passkey-based authentication with cloud data synchronization:

- **Without Authentication**: Data is stored locally in browser storage
- **With Passkey**: Data is synced to Cloudflare D1 database and accessible across devices

## Features

### 🔐 Passkey Registration

- Register with just your name (no email required)
- Uses WebAuthn standard for secure authentication
- Automatically syncs existing local data to the cloud

### 🔄 Data Synchronization

- Seamless sync between local storage and cloud database
- Real-time data updates when authenticated
- Manual sync option available in settings

### 📱 Cross-Device Access

- Use the same passkey across multiple devices
- Data stays in sync automatically
- Secure authentication without passwords

## How It Works

### Local-Only Mode (Default)

1. User opens the app
2. All data is stored in browser localStorage
3. Data is isolated to the current browser/device

### Passkey Mode

1. User registers a passkey with their name
2. Local data is automatically uploaded to the cloud
3. Future changes are synced automatically
4. User can sign in on other devices with the same passkey

## API Endpoints

### Registration

- `POST /api/passkey/register` - Start passkey registration
- `PUT /api/passkey/register` - Complete passkey registration

### Authentication

- `POST /api/passkey/login` - Start passkey login
- `PUT /api/passkey/login` - Complete passkey login

### Data Sync

- `GET /api/sync` - Load user data from server
- `POST /api/sync` - Save user data to server

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

### User Credentials Table

```sql
CREATE TABLE user_credentials (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

### User Data Table

```sql
CREATE TABLE user_data (
  user_id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

## Security Features

### WebAuthn Compliance

- Uses WebAuthn standard for passkey authentication
- Platform authenticator preferred (Touch ID, Face ID, Windows Hello)
- Resident keys for usernameless authentication

### Data Protection

- User data is stored encrypted in D1 database
- No personal information required beyond name
- Passkeys are bound to the specific domain

### Session Management

- Temporary challenges stored in Cloudflare KV
- 5-minute expiration for all authentication flows
- Secure session cleanup after completion

## User Experience

### Registration Flow

1. User enters their name in Settings
2. Clicks "Register with Passkey"
3. Browser prompts for biometric/PIN authentication
4. Local data is automatically synced to cloud
5. Success message confirms registration

### Login Flow

1. User clicks "Sign in with Passkey"
2. Browser shows available passkeys
3. User authenticates with biometric/PIN
4. Cloud data is loaded and replaces local data
5. App reloads with synced data

### Data Management

- Authenticated users see sync status in Settings
- Manual "Sync Now" button for immediate sync
- Sign out returns to local-only mode
- Local data is preserved when signing out

## Benefits

### For Users

- No passwords to remember or manage
- Secure biometric authentication
- Data accessible across all their devices
- Privacy-focused (minimal personal data required)

### For Developers

- Simpler than traditional auth systems
- No email verification flows
- Reduced server complexity
- Better security than passwords

## Migration from Old System

The old passkey lock system has been completely removed:

- No more local-only passkey verification
- Removed `passkeyEnabled` and `passkeyCredentialId` from UI preferences
- Removed lock/unlock state management
- New system is opt-in rather than a privacy lock

## Browser Support

Passkeys are supported on:

- ✅ Safari 16+ (iOS 16+, macOS 13+)
- ✅ Chrome 108+ (Android, Windows, macOS, Linux)
- ✅ Edge 108+ (Windows, macOS)
- ✅ Firefox 122+ (with security.webauth.webauthn_enable_softtoken enabled)

## Troubleshooting

### Common Issues

1. **"No passkeys found"** - User needs to register first
2. **"Registration failed"** - Browser may not support passkeys
3. **"Sync failed"** - Check internet connection and try again
4. **"Session expired"** - Restart the authentication flow

### Development

- Use `--local` flag with Wrangler for local D1 database
- Check browser DevTools for WebAuthn debugging
- Monitor Cloudflare dashboard for API errors
