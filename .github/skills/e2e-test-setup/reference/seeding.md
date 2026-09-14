# Reference: seeding data from the host

Captured essence of the seed scripts. Seed with the stock image's CLI **after**
the container is ready; no custom image. Names/keys must match exactly what the
app requests.

## SQL (Postgres) — `seedDatabase`

Copy CSV fixtures into the DB container and load with `\copy`, **parent tables
before FK children**. Run only after the owning service's migrations have created
the schema (its healthcheck triggers them).

```ts
const DB_SEED_TABLES = [
  { table: "section", columns: "pk,section", file: "section.csv" },
  { table: "desk", columns: "pk,desk", file: "desk.csv" },
  { table: "section_desk_mapping", columns: "section_id,desk_id,pk", file: "section-desk.csv" },
  // ... FK children after their parents; a table with no FK onto seeded tables can go last
];
// copyFilesToContainer(csvs) then, per table:
// psql <url> -v ON_ERROR_STOP=1 -c
//   "\copy <table>(<cols>) from '/tmp/<file>' with (format csv, header true, null 'NULL', on_error ignore)"
```

## DynamoDB (LocalStack) — `seedDynamodb`

```ts
// copyFilesToContainer(fixture json) then:
awslocal dynamodb create-table --table-name <T> \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH --billing-mode PAY_PER_REQUEST
awslocal dynamodb batch-write-item --request-items file:///tmp/<fixture>.json
```
`awslocal` targets the local gateway and inherits the container's region.

## S3 (LocalStack) — `seedS3`

Create buckets in the app's region and `awslocal s3 cp` the objects. The two
objects the app reads on startup are the **permissions cache** and the
**pan-domain settings**; the per-run signing keys are appended to the settings
before upload (see auth.md).

```ts
awslocal s3api create-bucket --bucket permissions-cache --create-bucket-configuration LocationConstraint=eu-west-1
awslocal s3api create-bucket --bucket pan-domain-auth-settings --create-bucket-configuration LocationConstraint=eu-west-1
awslocal s3 cp /tmp/permissions.json      s3://permissions-cache/CODE/permissions.json
awslocal s3 cp /tmp/pan-domain.settings   s3://pan-domain-auth-settings/local.dev-gutools.co.uk.settings
awslocal s3 cp /tmp/pan-domain.settings.public s3://pan-domain-auth-settings/local.dev-gutools.co.uk.settings.public
```

Bucket/key names must match what the app requests exactly; bucket network aliases
sit under an `s3.` domain so virtual-hosted-style requests resolve.
