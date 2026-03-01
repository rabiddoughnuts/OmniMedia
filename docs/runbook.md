# Runbook

Operational steps for local development and verification.

## Migrate

From the API folder:

```
npm run migrate
```

## Seed

- Basic seed:

```
npm run seed
```

- With import data:

```
export MEDIA_IMPORT_DIR="/path/to/data"
npm run seed
```

## Verify (example queries)

```
SELECT COUNT(*) FROM media.media;
SELECT media_type, COUNT(*) FROM media.media GROUP BY media_type ORDER BY media_type;

SELECT relname FROM pg_class
WHERE relname LIKE 'user_media_p%' ORDER BY relname;
```

## Rollback

- Use the migration system to roll back a step:

```
npm run migrate:down
```

## Notes

- Validate that the expected partitions exist for `interaction.user_media`.
- Re-run the seed if import files change; it is safe due to idempotency.
