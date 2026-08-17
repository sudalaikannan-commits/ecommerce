import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Prose, ContentSection } from "@/components/layout/Content";

export const metadata: Metadata = { title: "Return Policy | NovaCart" };

export default function ReturnsPage() {
  return (
    <div>
      <PageHeader title="Return & Refund Policy" subtitle="Easy, no-hassle returns within 7 days." />
      <div className="container-x py-10">
        <Prose>
          <ContentSection title="Return Window">
            <p>
              Most products can be returned within 7 days of delivery if they are unused,
              unwashed and in their original packaging with all tags attached.
            </p>
          </ContentSection>
          <ContentSection title="Non-Returnable Items">
            <p>
              For hygiene and safety reasons, the following categories are non-returnable:
              personal care, innerwear, consumables and products clearly marked as
              non-returnable on the product page.
            </p>
          </ContentSection>
          <ContentSection title="How to Start a Return">
            <p>
              Contact our support team at hello@ationicagency.com with your order number and reason
              for return. Once approved, you&apos;ll receive instructions to ship the item back, and
              the refund will be processed within 5-7 business days of us receiving the
              product.
            </p>
          </ContentSection>
          <ContentSection title="Refunds">
            <p>
              Refunds are issued to your original payment method. For Cash on Delivery orders,
              refunds are issued as store credit or transferred to your bank account after
              verification.
            </p>
          </ContentSection>
        </Prose>
      </div>
    </div>
  );
}