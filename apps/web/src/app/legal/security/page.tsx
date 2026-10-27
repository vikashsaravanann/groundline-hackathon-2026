import { LegalPage, legalMetadata } from "@/components/content/LegalPage";

export const metadata = legalMetadata("Security", "Security practices and current limitations for the Groundline demonstration.");

export default function SecurityPage() {
  return <LegalPage title="Security" description="How the current demonstration handles credentials, input validation, and model-result provenance." updated="October 27, 2026" sections={[
    { title: "Credential handling", paragraphs: ["Model-provider credentials are intended to remain in protected backend configuration. They are not part of the browser-facing application configuration. The browser calls the Groundline API rather than sending provider credentials directly."] },
    { title: "Request validation and tracing", paragraphs: ["The API checks supported image formats, actual decoded image data, image size, and objective length before analysis. Request traces use correlation identifiers and operational metadata; raw image bytes, objective text, authorization headers, and provider keys are not intended to be logged.", "A correlation ID helps locate a request in service logs. It is not an authentication credential."] },
    { title: "Current public-mode protection", paragraphs: ["The public Render service is forced to MOCK mode. Public use therefore does not invoke paid Meta or Baseten inference through the configured image-analysis path. Provider presence or a configured key alone does not enable LIVE mode.", "The API does not currently have durable user authentication and shared rate-limit enforcement sufficient to expose unrestricted paid inference safely. LIVE mode must remain restricted until those controls are implemented and verified."] },
    { title: "Using analysis safely", paragraphs: ["Model-generated and fixture output can be inaccurate. Verify fields against the source image. Groundline does not perform transactions, external form submissions, or autonomous actions."] },
    { title: "Reporting a security concern", paragraphs: ["No dedicated security-reporting address is configured on this site. Please do not publish credentials, personal data, or exploit details in a public issue. Use a private, owner-approved project contact channel to report a concern."] },
  ]} />;
}
