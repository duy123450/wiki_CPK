#!/bin/bash
# Backup script for MongoDB and Redis

BACKUP_DIR="/var/backups/wiki_cpk"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
MONGO_URI=${MONGO_URI:-"mongodb://localhost:27017/wiki_cpk"}
REDIS_HOST=${REDIS_HOST:-"localhost"}
REDIS_PORT=${REDIS_PORT:-"6379"}

mkdir -p "$BACKUP_DIR"

# MongoDB Backup
mongodump --uri="$MONGO_URI" --archive="$BACKUP_DIR/mongo_backup_$TIMESTAMP.archive" --gzip
echo "MongoDB backup created at $BACKUP_DIR/mongo_backup_$TIMESTAMP.archive"

# Redis Backup (assuming local dump.rdb exists)
# In a real environment, you might use BGSAVE or copy the RDB file
redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" BGSAVE
# Note: BGSAVE is asynchronous, actual file copy should wait or use different strategy
echo "Redis BGSAVE triggered."

# Cleanup old backups (keep last 7 days)
find "$BACKUP_DIR" -type f -name "*.archive" -mtime +7 -delete
echo "Old backups cleaned up."
