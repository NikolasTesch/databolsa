import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'changeme');
const JWT_REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? 'changeme'
);

export async function signAccessToken(payload: { sub: string; email: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(JWT_SECRET);
}

export async function signRefreshToken(payload: { sub: string; email: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<{ sub: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { sub: string; email: string };
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<{ sub: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET);
    return payload as { sub: string; email: string };
  } catch {
    return null;
  }
}
