export const withAuth = <T extends (...args: unknown[]) => unknown>(
	handler: T
) => handler;

export const getSignInUrl = async () => "";
export const getSignUpUrl = async () => "";
export const handleAuth = async () => ({ ok: true });
export const saveSession = async () => ({ ok: true });

export const authkit = {} as const;
export const authkitMiddleware = () => (req: Request) => req;
