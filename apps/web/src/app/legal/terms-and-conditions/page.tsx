import { LegalPage, legalMetadata } from "@/components/content/LegalPage";

export const metadata = legalMetadata("Terms and Conditions", "Terms for using the Groundline demonstration website and Studio.");

export default function TermsPage() {
  return <LegalPage title="Terms and Conditions" description="A plain-language guide to using the Groundline hackathon demonstration." updated="October 27, 2026" sections={[
    { title: "About this project", paragraphs: ["Groundline is an independent Indie Developer entry for the Meta Global AI Developer Hackathon 2026. It is created by Vikash Saravanan and associated with Logic Intelligence Technologies; this entry is not a company submission. The project is not affiliated with, endorsed by, or sponsored by Meta Platforms or Cerebral Valley.", "The site provides a demonstration of user-directed image capture or upload, typed objectives, and reviewable image-analysis output. Some capabilities shown in the product direction are marked Planned."] },
    { title: "Using the site", paragraphs: ["Use Groundline lawfully and only with images and text you are authorized to provide. You choose when to grant camera access and when to submit an image and objective.", "Do not use the demonstration to submit secrets, payment credentials, highly sensitive personal information, or material you do not have the right to share."] },
    { title: "AI output and review", paragraphs: ["Image-analysis output can be incomplete or incorrect. Check any result against the source image before relying on it. A MOCK result is a fixture and is not a model-generated finding.", "Groundline does not currently make purchases, submit external forms, or carry out actions on a user's behalf. Do not treat an output as professional, legal, medical, financial, or safety advice."] },
    { title: "Availability and changes", paragraphs: ["The project is an evolving hackathon demonstration and may change, become unavailable, or contain defects. No uninterrupted availability or particular result is promised.", "The site may link to third-party services such as GitHub or model and hosting providers. Their services are governed by their own terms and privacy practices."] },
    { title: "Project materials", paragraphs: ["Groundline source is published in the project repository under its stated license. Names and marks of third parties remain the property of their respective owners. Use of this site does not grant rights to third-party marks or services."] },
  ]} />;
}
