import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { upsertUser } from "@/lib/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      id: "demo",
      name: "Demo",
      credentials: {},
      async authorize() {
        return {
          id: "demo-user-001",
          email: "demo@keel.app",
          name: "Demo User",
          image: null,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const id = account.providerAccountId
        const email = user.email
        if (id && email) {
          try {
            await upsertUser({
              id,
              email,
              name: user.name ?? null,
              image: user.image ?? null,
            })
          } catch (err) {
            console.error("[auth] upsertUser failed:", err)
          }
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub
      return session
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "demo") token.sub = "demo-user-001"
      else if (account?.providerAccountId) token.sub = account.providerAccountId
      else if (user?.id) token.sub = user.id
      return token
    },
  },
  pages: { signIn: "/" },
})
