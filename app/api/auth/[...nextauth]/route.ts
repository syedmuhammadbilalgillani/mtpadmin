import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

type ServerLoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role?: string;
    profile?: { fullName?: string | null } | null;
  };
};

type AuthorizedUser = {
  id: string;
  email: string;
  name?: string | null;
  role?: string;
  accessToken: string;
  refreshToken: string;
};

function isAuthorizedUser(user: unknown): user is AuthorizedUser {
  if (!user || typeof user !== "object") return false;
  const u = user as Record<string, unknown>;
  return (
    typeof u.id === "string" &&
    typeof u.email === "string" &&
    typeof u.accessToken === "string" &&
    typeof u.refreshToken === "string"
  );
}

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

        const baseUrl = process.env.AUTH_API_URL ?? "http://localhost:3000";
        const url = `${baseUrl.replace(/\/$/, "")}/auth/login`;

        const res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email: credentials.email.trim().toLowerCase(),
            password: credentials.password,
            deviceType: "web",
          }),
        });

        if (!res.ok) {
          let message = "Invalid email or password";
          try {
            const body = (await res.json()) as { message?: string };
            if (typeof body?.message === "string" && body.message.trim()) {
              message = body.message;
            }
          } catch {
            // ignore JSON parse issues
          }
          throw new Error(message);
        }

        const data = (await res.json()) as ServerLoginResponse;
        if (!data?.accessToken || !data?.refreshToken || !data?.user?.id) {
          throw new Error("Login response was invalid");
        }

        const user: AuthorizedUser = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.profile?.fullName ?? data.user.email,
          role: data.user.role,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        };

        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (isAuthorizedUser(user)) {
        token.id = user.id;
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.accessToken = token.accessToken;
        session.refreshToken = token.refreshToken;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
