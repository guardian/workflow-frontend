import path from "path";

// Test data loaded into the Datastore's Postgres tables once the schema exists.
// Parent tables (section, desk) are seeded before the tables that reference
// them (section_desk_mapping, section_to_tag) to satisfy foreign keys. `stub`
// has no foreign key onto the seeded tables, so its order is not significant.
// Each CSV's column order matches the `columns` list below.
const DB_SEED_TABLES: { table: string; columns: string; file: string }[] = [
    { table: "section", columns: "pk,section", file: "section.csv" },
    { table: "desk", columns: "pk,desk", file: "desk.csv" },
    {
        table: "section_desk_mapping",
        columns: "section_id,desk_id,pk",
        file: "section-desk.csv",
    },
    {
        table: "section_to_tag",
        columns: "section_id,tag_id,pk",
        file: "section-tag.csv",
    },
    {
        table: "stub",
        columns:
            "pk,working_title,section,due,assign_to,composer_id,content_type,priority,needs_legal,note,prod_office,created_at,assign_to_email,wf_last_modified,trashed,commissioning_desks,path,last_modified,status,published,time_published,revision,storybundleid,activeinincopy,takendown,time_takendown,wordcount,embargoed_until,embargoed_indefinitely,scheduled_launch_date,optimised_for_web,optimised_for_web_changed,sensitive,legally_sensitive,headline,has_main_media,commentable,editor_id,commissioned_length,print_wordcount,last_modified_by,planned_publication_id,actual_publication_id,planned_book_id,actual_book_id,planned_book_section_id,actual_book_section_id,planned_newspaper_page_number,actual_newspaper_page_number,planned_newspaper_publication_date,actual_newspaper_publication_date,last_modified_in_print_by,status_in_print,needs_picture_desk,rights_syndication_aggregate,rights_developer_community,rights_subscription_databases,rights_reviewed,byline,missing_commissioned_length_reason,display_hint,intended_audience,tracking_tags",
        file: "stub.csv",
    },
];

const DB_SEED_FIXTURES_DIR = "fixtures/db";
const DB_CONNECTION_URL =
    "postgresql://workflow:workflow@localhost:5432/workflow";

/**
 * Seed the Datastore's Postgres tables with section/desk test data.
 *
 * Must be called after the Datastore container has started, because that is
 * when Play evolutions create the schema. The CSV fixtures are copied into the
 * database container and loaded with `\copy`, parent tables first so that the
 * foreign keys in `section_desk_mapping` resolve.
 */
export async function seedDatabase(
    dbContainer: any,
    projectRoot: string,
): Promise<void> {
    await dbContainer.copyFilesToContainer(
        DB_SEED_TABLES.map(({ file }) => ({
            source: path.join(projectRoot, DB_SEED_FIXTURES_DIR, file),
            target: `/tmp/${file}`,
        })),
    );

    for (const { table, columns, file } of DB_SEED_TABLES) {
        const copyCommand = `\\copy ${table}(${columns}) from '/tmp/${file}' with (format csv, header true, null 'NULL', on_error ignore)`;
        const result = await dbContainer.exec([
            "psql",
            DB_CONNECTION_URL,
            "-v",
            "ON_ERROR_STOP=1",
            "-c",
            copyCommand,
        ]);

        if (result.exitCode !== 0) {
            throw new Error(
                `Failed to seed table "${table}" from ${file} (exit code ${result.exitCode}):\n${result.output}`,
            );
        }
    }
}
