# AWS Deployment Plan

This document outlines the AWS deployment approach, phases, and scaling triggers.

## Phase 0 (single region)

- Region: us-east-1
- Compute: ECS Fargate
- Load balancing: ALB
- Database: RDS PostgreSQL (single writer)
- Storage: S3 for covers and exports
- Edge: Cloudflare for CDN and WAF

## Phase 1 (multi-region compute)

- Add us-west-2 compute
- Cloudflare health checks and failover routing
- Database remains single-region

## Phase 2-3 (latency reduction)

- EU compute region (recommended: eu-west-1)
- APAC compute region (recommended: ap-southeast-1)
- Cloudflare geo routing for read-heavy traffic

## Database scaling hardening

- Increase `interaction.user_media` partitions as row counts grow
- Add JSONB expression indexes for frequent attributes
- Add read replica and test restore runbook

## Deployment steps (high level)

1. Build and push API and web images
2. Provision RDS and S3
3. Configure ECS services and tasks
4. Configure ALB listeners and health checks
5. Set Cloudflare DNS and caching
6. Run migrations and seed data

## Observability

- Structured logs from API
- Error reporting (Sentry or equivalent)
- CloudWatch metrics for ECS and RDS

## Security

- Store secrets in AWS Secrets Manager or Parameter Store
- Use IAM roles for task permissions
- Restrict database access to private subnets
