# Architecture

## Overview

My Personal Assistant is designed as a scalable lifestyle assistant platform.

The backend follows a modular architecture focused on:

- Security
- Maintainability
- Future AI integration
- Independent feature development


# Backend Architecture

## Core Stack

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Argon2 Password Hashing


# Module Structure

Current modules:


- auth
- users

---

# Authentication Flow

## Current Implementation

The authentication system currently supports:

- User registration
- User login
- Password hashing with Argon2
- JWT access token generation
- JWT protected routes
- Current user endpoint (/auth/me)


## Security Decisions

- Passwords are never stored in plain text
- Argon2 is used for password hashing
- JWT secrets are managed through environment variables
- Protected routes use Passport JWT strategy


# Database Architecture

Current main entities:

## User

Responsible for:

- Identity
- Email
- Password hash
- Basic profile information


## AuthAccount

Prepared for:

- OAuth providers
- Google login
- Apple login
- Future social authentication


## Session

Prepared for:

- Refresh tokens
- Active sessions
- Token rotation
- Logout and session revocation


## UserSettings

Responsible for:

- Language preferences
- Timezone
- Future user customization


# Future Expansion

The architecture is prepared for future modules:

- Nutrition
- Calories and macros
- Recipes
- Pantry management
- Workout tracking
- Supplements
- Habits
- Calendar
- Notifications
- AI Assistant


# Development Rules

Before adding new features:

1. Database design must be reviewed
2. Module boundaries must be respected
3. Security implications must be checked
4. Tests must be added
5. Documentation must be updated
