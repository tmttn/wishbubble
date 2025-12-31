import { Metadata } from "next";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact Us - WishBubble",
  description: "Get in touch with the WishBubble team. We're here to help with questions, feedback, privacy requests, or any other inquiries.",
  openGraph: {
    title: "Contact Us - WishBubble",
    description: "Get in touch with the WishBubble team for questions, feedback, or privacy requests.",
  },
  alternates: {
    canonical: "https://wishlist-tmttn.vercel.app/contact",
  },
};

export default function ContactPage() {
  return <ContactForm />;
}
