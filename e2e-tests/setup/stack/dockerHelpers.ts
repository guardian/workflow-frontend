import { GenericContainer } from "testcontainers";

// Build an image from a Dockerfile via Testcontainers and return the resulting
// container, ready to be configured and started. `dockerfileName` is relative to
// `context`; buildkit is enabled so the Dockerfiles' `# syntax` frontends apply.
export function buildImage(
    context: string,
    dockerfileName: string,
    tag: string,
): Promise<GenericContainer> {
    console.log(`\n[docker-build] Building ${tag} from ${dockerfileName}`);
    return GenericContainer.fromDockerfile(context, dockerfileName)
        .withBuildkit()
        .build(tag, { deleteOnExit: false });
}

export function createLogConsumer(prefix: string, streamLogs: boolean) {
    return (stream: any) => {
        if (!streamLogs) {
            // Discard container logs (default): they are only echoed to stdout
            // when the stack is run directly via `yarn test:stack-only`.
            return;
        }
        stream
            .on("data", (line: Buffer) => {
                process.stdout.write(`[${prefix}] ${line.toString()}`);
            })
            .on("err", (line: Buffer) => {
                process.stderr.write(`[${prefix}] ${line.toString()}`);
            });
    };
}
