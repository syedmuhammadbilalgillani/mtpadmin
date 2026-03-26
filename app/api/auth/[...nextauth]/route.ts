import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password");
        }

        // const user = await prisma.user.findUnique({
        //   where: { email: credentials.email },
        // });

        // if (!user) {
        //   throw new Error("Invalid email or password");
        // }

        // const isPasswordValid = await bcrypt.compare(
        //   credentials.password,
        //   user.password
        // );

        // if (!isPasswordValid) {
        //   throw new Error("Invalid email or password");
        // }

        return {
          id: "1",
          email: "test@test.com",
          name: "Test User",
          image: "https://via.placeholder.com/150",
          role: "admin",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = "admin";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = "1";
        session.user.role = "admin";
      }
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
