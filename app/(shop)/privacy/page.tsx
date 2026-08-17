import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Prose, ContentSection } from "@/components/layout/Content";

export const metadata: Metadata = { title: "Privacy Policy | NovaCart" };

export default function PrivacyPage() {
  return (
    <div>
      <PageHeader title="Privacy Policy" subtitle="How NovaCart collects, uses and protects your information." />
      <div className="container-x py-10">
        <Prose>
          <ContentSection title="Information We Collect">
            <p>
              We collect the information you provide when creating an account (name, email,
              phone), placing an order (delivery address), and contacting support. We also
              collect basic technical data such as device and browser type to improve our
              services.
            </p>
          </ContentSection>
          <ContentSection title="How We Use Your Information">
            <p>
              Your information is used to process orders, deliver products, provide customer
              support, send order updates, and personalise your shopping experience. We never
              sell your personal data to third parties.
            </p>
          </ContentSection>
          <ContentSection title="Payment Security">
            <p>
              Payments are processed through PCI-DSS compliant payment gateways. Your full card
              details are never stored on our servers.
            </p>
          </ContentSection>
          <ContentSection title="Cookies">
            <p>
              We use cookies to keep you logged in and remember items in your cart. You can
              control cookie preferences through your browser settings.
            </p>
          </ContentSection>
          <ContentSection title="Data Retention">
            <p>
              We retain account and order data only as long as needed for business, legal and
              accounting purposes. You may request deletion of your account and data at any
              time by contacting support.
            </p>
          </ContentSection>
          <ContentSection title="Contact">
            <p>
              For any privacy-related queries, email us at support@novacart.in. This policy may
              be updated from time to time, and the latest version will always be available on
              this page.
            </p>
          </ContentSection>
        </Prose>
      </div>
    </div>
  );
}