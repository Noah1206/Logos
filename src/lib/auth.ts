import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Kakao from "next-auth/providers/kakao";
import Naver from "next-auth/providers/naver";
import { prisma } from "./prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
    Naver({
      clientId: process.env.NAVER_CLIENT_ID!,
      clientSecret: process.env.NAVER_CLIENT_SECRET!,
    }),
  ],
  events: {
    // 신규 가입 시 무료체험 시작
    async createUser({ user }) {
      await prisma.user.update({
        where: { id: user.id! },
        data: { freeTrialStartedAt: new Date() },
      });
    },
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { credits: true },
        });
        session.user.credits = dbUser?.credits ?? 0;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});
