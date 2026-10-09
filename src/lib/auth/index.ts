import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validation/auth";
import { verifyOwnerCredentials } from "@/lib/auth/password";

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

        // Verify single-owner credentials via bcrypt hash (fails fast if hash not configured)
        const isValid = await verifyOwnerCredentials(email, password);
        if (!isValid) {
          return null;
        }

        const ownerEmail = process.env.OWNER_EMAIL || "owner@akshelf.local";

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
