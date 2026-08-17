import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Prose, ContentSection } from "@/components/layout/Content";

export const metadata: Metadata = { title: "About Us | NovaCart" };

export default function AboutPage() {
  return (
    <div>
      <PageHeader title="About NovaCart" subtitle="Your one-stop destination for a smarter, happier shopping experience." />
      <div className="container-x py-10">
        <Prose>
          <ContentSection title="Who We Are">
            <p>
              NovaCart is an e-commerce platform built to make online shopping simple, fast and
              delightful. From everyday essentials to premium electronics, we bring together
              thousands of products from trusted brands — all at honest prices.
            </p>
            <p>
              Founded with a simple mission — great products, fair prices and a shopping
              experience you can trust — NovaCart has grown into a destination for millions of
              happy customers.
            </p>
          </ContentSection>
          <ContentSection title="Why Shop With Us">
            <p>✔️ Genuine products with secure payment options</p>
            <p>✔️ Fast, reliable delivery across India</p>
            <p>✔️ Easy returns and responsive 24x7 support</p>
            <p>✔️ Exclusive deals, coupons and member rewards</p>
          </ContentSection>
          <ContentSection title="Our Promise">
            <p>
              Every order at NovaCart is packed with care, tracked end-to-end, and backed by a
              simple no-hassle return policy. Your trust is our most valuable asset — and we
              work every day to keep it.
            </p>
          </ContentSection>
        </Prose>
      </div>
    </div>
  );
}