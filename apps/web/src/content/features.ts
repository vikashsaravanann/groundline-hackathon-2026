export type FeatureDetail = {
  slug: string;
  title: string;
  summary: string;
  status: "Available" | "Available · MOCK demo" | "Planned";
  whatItDoes: string;
  howItWorks: string[];
  limits: string[];
  nextStep: { label: string; href: string };
};

export const features: FeatureDetail[] = [
  {
    slug: "camera-capture", title: "Camera capture", summary: "Choose when to open the camera and capture a still for Groundline Studio.", status: "Available",
    whatItDoes: "Camera capture lets you photograph a physical label from the Studio. Groundline waits for your action before requesting access; opening the page does not start the camera.",
    howItWorks: ["Press Start camera and respond to the browser permission prompt.", "Frame the item in the preview and capture one still image.", "Review the captured image, retake it, or remove it before analysis."],
    limits: ["Camera access depends on browser permission and a secure browser context.", "A still capture is submitted only when you choose Analyze. The camera is not a continuous stream to the AI service."], nextStep: { label: "Open Studio", href: "/studio" },
  },
  {
    slug: "image-upload", title: "Image upload", summary: "Use an existing PNG, JPEG, or WebP image when a camera is unavailable or inconvenient.", status: "Available",
    whatItDoes: "Upload is the alternative input path for a chosen image. The client prepares the image and the API independently checks the submitted bytes and constraints.",
    howItWorks: ["Choose an image from your device.", "Groundline checks supported image types and size limits, then prepares a bounded image for submission.", "Preview the selected image and remove or replace it before you submit."],
    limits: ["Use images you have the right to share and avoid including unrelated sensitive information.", "The current application does not provide a database-backed image library."], nextStep: { label: "Open Studio", href: "/studio" },
  },
  {
    slug: "typed-objectives", title: "Your typed objective", summary: "Tell Groundline what you want to learn from the selected image.", status: "Available",
    whatItDoes: "The objective gives image analysis a clear task, such as asking for a model number or identifying which visible field is missing.",
    howItWorks: ["Enter a short, specific goal in the Studio composer.", "Groundline sends the objective with the selected image when you submit.", "The returned information is presented for your review."],
    limits: ["The current objective is bounded in length and is not a command to perform external actions.", "Do not enter passwords, payment details, or other secrets."], nextStep: { label: "Open Studio", href: "/studio" },
  },
  {
    slug: "visible-fact-extraction", title: "Visible fact extraction", summary: "Turn information visible in an image into structured fields that are easier to inspect.", status: "Available · MOCK demo",
    whatItDoes: "Groundline's image analysis contract returns normalized facts for review. Public production currently forces MOCK mode, so a public result is a fixture rather than a live model response.",
    howItWorks: ["The API validates the image and objective.", "The image fact-extraction capability produces a structured response.", "The interface identifies whether the result is MOCK or LIVE."],
    limits: ["The public Render service is configured to force MOCK mode while paid-inference safeguards are incomplete.", "A model or fixture can omit or misread text; verify every field against the image."], nextStep: { label: "Read how it works", href: "/how-it-works" },
  },
  {
    slug: "human-review", title: "Human review and correction", summary: "Inspect extracted fields and keep yourself responsible for deciding what to use.", status: "Available",
    whatItDoes: "The Studio presents analysis as information to check. Review controls let you correct or confirm individual extracted fields before you rely on them elsewhere.",
    howItWorks: ["Compare each returned field with the original image.", "Edit or confirm the field in the Studio.", "Use the corrected information only for a purpose you approve."],
    limits: ["Groundline does not currently submit forms, make purchases, or carry out other external transactions.", "A complete approval timeline is a planned capability."], nextStep: { label: "Open Studio", href: "/studio" },
  },
  {
    slug: "source-labeling", title: "Source and mode labels", summary: "See whether an analysis is a sample fixture or an actual model result.", status: "Available",
    whatItDoes: "Source labels communicate the provenance of a response so a fixture is not mistaken for an actual model call.",
    howItWorks: ["The backend carries its source mode in the normalized response.", "The Studio renders the corresponding MOCK or LIVE indicator.", "The homepage example is marked SAMPLE · MOCK and makes no model request."],
    limits: ["A LIVE label means that a provider returned the specific result; it is not a guarantee that the result is correct.", "The public service currently operates in forced MOCK mode."], nextStep: { label: "Review the safety approach", href: "/#safety" },
  },
  {
    slug: "credential-safety", title: "Backend-only provider credentials", summary: "Keep model-provider credentials on the API server rather than in browser code.", status: "Available",
    whatItDoes: "Provider adapters run in the FastAPI service. Provider credentials are read by the backend and are not intended for `NEXT_PUBLIC_` variables or browser bundles.",
    howItWorks: ["The browser calls the Groundline API, not a provider using a browser-held key.", "The server selects a provider capability and attaches credentials in its server-side request.", "The API returns normalized result metadata without returning credentials."],
    limits: ["Credential isolation does not by itself protect a paid endpoint from abuse.", "Public LIVE inference remains disabled until server-side access, quota, and spending controls are in place."], nextStep: { label: "Read the security page", href: "/legal/security" },
  },
  {
    slug: "visual-grounding", title: "Visual region grounding", summary: "A planned capability to connect extracted facts to the image area that supports them.", status: "Planned",
    whatItDoes: "Grounding is intended to help a person inspect where a proposed fact appears in an image.",
    howItWorks: ["A future system may associate a field with a region or mask.", "The interface could show that region alongside the proposed value.", "A person would still verify the match."],
    limits: ["Visual grounding and SAM segmentation are not implemented in the current workflow.", "There are no working controls for this planned stage."], nextStep: { label: "See the full workflow", href: "/how-it-works" },
  },
];
