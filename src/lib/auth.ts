import NextAuth, { getServerSession, type AuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const adminUser = (process.env.ADMIN_USERNAME ?? process.env.ADMIN_USER ?? 'admin').trim();
const adminPassword = (process.env.ADMIN_PASSWORD ?? '').trim();

export const authOptions: AuthOptions = {
  providers: [
    Credentials({
      credentials: {
        username: {},
        password: {},
      },
      authorize: async (credentials) => {
        const username = (credentials?.username as string)?.trim?.() ?? '';
        const password = credentials?.password as string;
        if (!username || !password) return null;
        const ok = username === adminUser && adminPassword !== '' && password === adminPassword;
        if (!ok) return null;
        return { id: 'admin', email: username, name: 'Admin' };
      },
    }),
  ],
  session: { strategy: 'jwt' as const, maxAge: 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) token.email = user.email;
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) session.user.email = token.email as string;
      return session;
    },
  },
  pages: { signIn: '/login' },
};

const handler = NextAuth(authOptions);
export const handlers = { GET: handler, POST: handler };

export async function auth() {
  return getServerSession(authOptions);
}