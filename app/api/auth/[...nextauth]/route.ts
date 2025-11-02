import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const [rows] = await db.query("SELECT * FROM `user` WHERE email = ?", [credentials.email]);
        // @ts-ignore
        const user = Array.isArray(rows) ? rows[0] : undefined;
        if (!user) return null;
        const match = await bcrypt.compare(credentials.password, user.password);
        if (!match) return null;
        return {
          id: user.id,
          name: user.nama,
          email: user.email,
          role: user.role
        };
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // @ts-ignore
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // @ts-ignore
      session.user.role = token.role;
      return session;
    },
    async redirect({ url, baseUrl, user, session }) {
      // Redirect based on role after signin is handled in client-side; keep default
      return baseUrl;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
});

export { handler as GET, handler as POST };