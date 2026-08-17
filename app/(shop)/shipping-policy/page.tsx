import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Prose, ContentSection } from "@/components/layout/Content";

export const metadata: Metadata = { title: "Shipping Policy | NovaCart" };

export default function ShippingPage() {
  return (
    <div>
      <PageHeader title="Shipping Policy" subtitle="Everything you need to know about delivery." />
      <div className="container-x py-10">
        <Prose>
          <ContentSection title="Delivery Time">
            <p>
              Orders are processed within 1-2 business days. Standard delivery takes 3-7
              business days across India. Premium/express options may be available at checkout
              depending on your pincode.
            </p>
          </ContentSection>
          <ContentSection title="Shipping Charges">
            <p>
              Shipping charges are calculated at checkout based on the shipping method and your
              delivery location. Many orders qualify for free standard shipping — look for the
              free shipping indicator on product pages and in the cart.
            </p>
          </ContentSection>
          <ContentSection title="Order Tracking">
            <p>
              Once your order ships, you will receive an email with tracking details. You can
              also view the latest status anytime under My Orders in your account.
            </p>
          </ContentSection>
          <ContentSection title="Delivery Issues">
            <p>
              If a package is lost, damaged in transit, or you receive the wrong item, contact
              our support team within 48 hours of delivery and we&apos;ll make it right.
            </p>
          </ContentSection>
        </Prose>
      </div>
    </div>
  );
}