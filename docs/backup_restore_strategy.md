# Backup and Restore Strategy

## Backups
- **Database:** MongoDB Atlas provides automated daily snapshots. For local/self-hosted instances, use the provided `server/scripts/backup.sh` script, which runs `mongodump`.
- **Redis:** Redis RDB snapshots are periodically saved. `backup.sh` triggers `BGSAVE`.
- **Retention:** Local backups are retained for 7 days via the cleanup command in `backup.sh`.

## Restore Procedure
### MongoDB
To restore a local MongoDB backup:
```bash
mongorestore --uri="mongodb://localhost:27017/wiki_cpk" --archive="/path/to/backup.archive" --gzip
```

### Redis
To restore Redis, replace the `dump.rdb` file in the Redis working directory and restart the Redis server.

## Disaster Recovery
In case of catastrophic failure:
1. Re-provision servers (Render for BE, Vercel for FE).
2. Restore latest MongoDB snapshot (via Atlas UI or mongorestore).
3. Redis data (session blacklists) is ephemeral, but restoring RDB minimizes forced logouts.
4. Verify environment variables are correct.
