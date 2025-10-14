import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/db/prisma";
import { compareSync } from "bcrypt-ts-edge";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

export const config = {
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        if (credentials == null) return null;

        // find user in database
        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email as string,
          },
        });

        // if user exist and password matches
        if (user && user.password) {
          const isMatch = compareSync(credentials.password as string, user.password);

          if (isMatch) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }
        }
        // if user does not exist or password does not match
        return null;
      },
    }),
  ],
  callbacks: {
    async session({ session, user, trigger, token }: any) {
      // set the user id from the token
      session.user.id = token.sub;
      session.user.role = token.role;
      session.user.name = token.name;


      // if there is an update set the user name
      if (trigger === "update") {
        session.user.name = user.name;
      }

      return session;
    },

    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        token.role = user.role;
        // if user has no name the use the email
        if (user.name === "NO_NAME") {
          token.name = user.email!.split("@")[0];

          // update database to reflect the token name
          await prisma.user.update({
            where: {
              id: user.id,
            },
            data: {
              name: token.name,
            },
          });
        }

      }
      return token;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
