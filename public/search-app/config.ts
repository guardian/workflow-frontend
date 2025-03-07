type Config = {
    user?: {
        avatarUrl?: string,
        email: string
        firstName?: string,
        lastName?: string,
    }
}

type WindowWithConfig = (typeof global & { _wfConfig: Config });

export {Config, WindowWithConfig}