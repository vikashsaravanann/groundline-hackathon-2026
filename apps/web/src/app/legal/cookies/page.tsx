import { LegalPage, legalMetadata } from "@/components/content/LegalPage";

export const metadata = legalMetadata("Cookies", "Groundline's application-level cookie and browser-storage behavior.");

export default function CookiesPage() {
  return <LegalPage title="Cookies" description="A clear account of cookie behavior in the current Groundline application." updated="October 27, 2026" sections={[
    { title: "Groundline application behavior", paragraphs: ["The current Groundline client code does not intentionally set analytics, advertising, or preference cookies. It does not implement account login or store Studio images and objectives in localStorage or sessionStorage."] },
    { title: "Service-provider technologies", paragraphs: ["The website is delivered through hosting and may link to third-party services. Those providers may use cookies or similar technologies for delivery, security, or their own service functions. Groundline does not control those provider technologies; review the relevant provider policy for details."] },
    { title: "Changes", paragraphs: ["If Groundline adds its own cookies, analytics, authentication, or persistent preferences, this page should be updated to explain their purpose and choices before that behavior is introduced."] },
  ]} />;
}
