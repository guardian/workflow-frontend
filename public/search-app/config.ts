type Config = {
    user?: {
        avatarUrl?: string,
        email: string,
        firstName?: string,
        lastName?: string,
    };
    statuses: string[];
}

type WindowWithConfig = (typeof window & { _wfConfig: Config });

export {Config, WindowWithConfig}