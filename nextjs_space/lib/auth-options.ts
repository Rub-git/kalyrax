import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './db';
import bcrypt from 'bcryptjs';

const AUTH_DB_RETRIES = 1;
const AUTH_DB_RETRY_DELAY_MS = 300;

async function findUserByEmailWithRetry(normalizedEmail: string) {
  let attempt = 0;

  while (true) {
    try {
      return await prisma.user.findFirst({
        where: {
          email: {
            equals: normalizedEmail,
            mode: 'insensitive',
          },
        },
      });
    } catch (error) {
      if (attempt >= AUTH_DB_RETRIES) {
        throw error;
      }

      attempt += 1;
      await new Promise((resolve) => setTimeout(resolve, AUTH_DB_RETRY_DELAY_MS));
    }
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const normalizedEmail = credentials.email.trim().toLowerCase();

        try {
          const user = await findUserByEmailWithRetry(normalizedEmail);

          if (!user) {
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error('Credentials authorize failed:', error);
          throw new Error('AuthServiceUnavailable');
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
