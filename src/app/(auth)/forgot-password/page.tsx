import { Metadata } from "next";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password - WishBubble",
  description: "Reset your WishBubble password",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
