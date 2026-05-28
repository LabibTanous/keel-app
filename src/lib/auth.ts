import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { upsertUser } from "@/lib/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.id && user.email) {
        await upsertUser({
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
        })
      }
      return true
    },
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub
      return session
    },
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id
      return token
    },
  },
  pages: { signIn: "/" },
})
