import { Metadata } from "next";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password - WishBubble",
  description: "Set a new password for your WishBubble account",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
