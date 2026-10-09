import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validation/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Owner Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        const ownerEmail = process.env.OWNER_EMAIL || "owner@akshelf.local";
        const ownerPassword = process.env.OWNER_PASSWORD || "password123";

        // Strict single-owner credential verification
        if (email.toLowerCase() !== ownerEmail.toLowerCase() || password !== ownerPassword) {
          return null;
        }

        // Get or create the owner in PostgreSQL database
        const user = await prisma.user.upsert({
          where: { email: ownerEmail },
          update: {},
          create: {
            email: ownerEmail,
            name: "AkShelf Owner",
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token?.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
