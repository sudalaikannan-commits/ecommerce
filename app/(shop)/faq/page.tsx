import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Prose, ContentSection } from "@/components/layout/Content";

export const metadata: Metadata = { title: "Frequently Asked Questions | NovaCart" };

const faqs = [
  {
    q: "How do I place an order?",
    a: "Browse the shop, add items to your cart, then proceed to checkout. Enter or select your delivery address, choose a shipping method and payment option, then confirm your order. You'll receive an order confirmation with a tracking reference.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept Cash on Delivery (COD), cards, UPI, netbanking and popular wallets through our secure payment gateways. Your payment details are encrypted and never stored on our servers.",
  },
  {
    q: "How long does delivery take?",
    a: "Standard delivery typically takes 3-7 business days depending on your location. Faster options are shown at checkout when available. You'll receive updates by email as your order moves.",
  },
  {
    q: "Can I cancel or modify my order?",
    a: "Orders can be cancelled as long as they haven't been shipped. Contact our support team at hello@ationicagency.com and we'll help you cancel or modify pending orders.",
  },
  {
    q: "What is the return policy?",
    a: "Most items can be returned within 7 days of delivery if they're unused and in original packaging. Some categories like personal care items are non-returnable for hygiene reasons. See our Return Policy page for details.",
  },
  {
    q: "How do I apply a coupon?",
    a: "Add products to your cart, then enter your coupon code in the coupon box at checkout. The discount will be applied automatically to your order total.",
  },
  {
    q: "Is my personal information safe?",
    a: "Absolutely. We use industry-standard encryption, never share your data with third parties, and only use your information to process orders and improve your experience.",
  },
  {
    q: "How can I contact support?",
    a: "Reach us via the Contact page, email hello@ationicagency.com, or call +91 86800 60912 (Mon–Sat, 10am–7pm IST). We typically respond within 24 hours.",
  },
];

export default function FaqPage() {
  return (
    <div>
      <PageHeader title="Frequently Asked Questions" subtitle="Quick answers to the questions we hear most often." />
      <div className="container-x py-10">
        <Prose>
          {faqs.map((faq, i) => (
            <ContentSection key={i} title={faq.q}>
              <p>{faq.a}</p>
            </ContentSection>
          ))}
        </Prose>
      </div>
    </div>
  );
}