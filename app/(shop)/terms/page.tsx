import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Prose, ContentSection } from "@/components/layout/Content";

export const metadata: Metadata = { title: "Terms & Conditions | NovaCart" };

export default function TermsPage() {
  return (
    <div>
      <PageHeader title="Terms & Conditions" subtitle="The rules and guidelines for using NovaCart." />
      <div className="container-x py-10">
        <Prose>
          <ContentSection title="Acceptance of Terms">
            <p>
              By accessing or using the NovaCart website, you agree to be bound by these Terms
              &amp; Conditions. If you do not agree with any part of these terms, please do not
              use our services.
            </p>
          </ContentSection>
          <ContentSection title="Accounts">
            <p>
              You are responsible for maintaining the confidentiality of your account and
              password. You agree to provide accurate, current information and to notify us of
              any unauthorised use of your account.
            </p>
          </ContentSection>
          <ContentSection title="Orders & Pricing">
            <p>
              All prices are listed in Indian Rupees (INR) and include applicable taxes where
              stated. We reserve the right to refuse or cancel any order due to pricing errors,
              stock unavailability, or suspected fraudulent activity.
            </p>
          </ContentSection>
          <ContentSection title="Prohibited Conduct">
            <p>
              You agree not to misuse the website, attempt to gain unauthorised access, disrupt
              the service, or use automated tools to scrape content or place orders in a manner
              that abuses the platform.
            </p>
          </ContentSection>
          <ContentSection title="Limitation of Liability">
            <p>
              NovaCart is not liable for indirect or consequential damages arising from use of
              the site or delay in delivery caused by events outside our reasonable control.
            </p>
          </ContentSection>
          <ContentSection title="Governing Law">
            <p>
              These terms are governed by the laws of India. Any disputes shall be subject to
              the exclusive jurisdiction of the courts of Bengaluru, Karnataka.
            </p>
          </ContentSection>
        </Prose>
      </div>
    </div>
  );
}