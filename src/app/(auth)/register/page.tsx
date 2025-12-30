import { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Sign Up - WishBubble",
  description: "Create your free WishBubble account. Start coordinating gift exchanges with family and friends today.",
  openGraph: {
    title: "Sign Up - WishBubble",
    description: "Create your free WishBubble account. Start coordinating gift exchanges with family and friends.",
  },
};

export default function RegisterPage() {
  return <RegisterForm />;
}
