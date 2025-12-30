import { Metadata } from "next";
import { VerifyEmailResult } from "./verify-email-result";

export const metadata: Metadata = {
  title: "Verify Email - WishBubble",
  description: "Verify your WishBubble email address",
};

export default function VerifyEmailPage() {
  return <VerifyEmailResult />;
}
