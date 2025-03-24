#!/bin/sh

# Run database migrations
echo "Running database migrations..."
pnpm run db:migrate
echo "Creating init user.."
# Create initial user from environment variable if provided
if [ -n "$INIT_ADMIN_USER_EMAIL" ]; then
  echo "Creating initial user with email: $INIT_ADMIN_USER_EMAIL"
  pnpm run users:add-admin "$INIT_ADMIN_USER_EMAIL"
fi

echo "Starting the application..."
exec pnpm start 