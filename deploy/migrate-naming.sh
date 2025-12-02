#!/bin/bash
# Migrate from legacy zero-agent naming to pip naming
# Run ONCE from /opt/pip on VPS: ./deploy/migrate-naming.sh
#
# This script:
# 1. Stops containers
# 2. Creates new pip-data volume
# 3. Copies database from legacy volume to pip-data
# 4. Renames database file if needed
# 5. Starts containers with new volume

set -e

echo "🔄 Migrating to Pip naming..."
echo ""

# Stop containers
echo "🛑 Stopping containers..."
docker stop pip-app pip-mcp 2>/dev/null || true
echo ""

# Create new volume if it doesn't exist
echo "📦 Creating pip-data volume..."
docker volume create pip-data 2>/dev/null || echo "  Volume already exists"

# Check if legacy volume exists
if docker volume inspect zero-agent-data >/dev/null 2>&1; then
  echo "📋 Copying data from legacy volume to pip-data..."
  docker run --rm \
    -v zero-agent-data:/source:ro \
    -v pip-data:/dest \
    alpine sh -c "cp -av /source/. /dest/"

  # Rename database file if needed
  echo "📝 Renaming database file if needed..."
  docker run --rm \
    -v pip-data:/data \
    alpine sh -c "
      if [ -f /data/zero-agent.db ]; then
        mv /data/zero-agent.db /data/pip.db
        echo '  Renamed legacy database → pip.db'
      else
        echo '  Database already named pip.db or does not exist'
      fi
    "
else
  echo "ℹ No legacy volume found (zero-agent-data)"
fi

echo ""
echo "✅ Migration complete!"
echo ""
echo "📌 Next steps:"
echo "  1. Run: ./deploy/deploy.sh"
echo ""
echo "  2. Verify everything works"
echo ""
echo "  3. (Optional) Remove old resources:"
echo "     docker volume rm zero-agent-data"
echo "     docker network rm zero-agent-network"
