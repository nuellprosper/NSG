export interface TermSection {
  id: string;
  title: string;
  content: string[];
  bullets?: string[];
}

export const TERMS_TITLE = "Terms and Conditions of Service";
export const TERMS_LAST_UPDATED = "April 9, 2026";

export const TERMS_PREAMBLE: string[] = [
  "Welcome to NSG (Note Sync & Study Guide). By accessing, registering for, or using the NSG web and mobile applications, services, and associated AI learning modules, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.",
  "These Terms govern your use of our platform, including our AI study companions (Omni & Zeal), interactive lecture processors, flashcards, automated quiz engines, and student collaboration vaults. If you do not agree to these terms, please discontinue use of the platform immediately."
];

export const TERMS_SECTIONS: TermSection[] = [
  {
    id: "account-registration",
    title: "1. Account Registration & Eligibility",
    content: [
      "To access core features of NSG, users must create a verified student account. You agree to provide accurate, current, and complete information during registration and keep your account details updated.",
      "You are solely responsible for maintaining the confidentiality of your credentials and password. Any actions performed through your account are your responsibility."
    ],
    bullets: [
      "Users must be at least 13 years of age (or the minimum legal age required in your jurisdiction) to create an account.",
      "Each student may operate only one primary academic profile unless authorized in writing.",
      "Sharing account credentials with third parties or attempting to circumvent authentication protocols is strictly prohibited."
    ]
  },
  {
    id: "acceptable-use",
    title: "2. Acceptable Use & Academic Integrity",
    content: [
      "NSG is dedicated to augmenting education, deep comprehension, and retention. We hold our community to rigorous standards of academic honesty.",
      "You agree not to use NSG for direct academic dishonesty, such as submitting AI-generated outputs as your original unassisted work where institutional rules forbid it."
    ],
    bullets: [
      "Do not upload malicious code, reverse engineer the platform, or disrupt server infrastructure.",
      "Do not upload copyrighted textbooks, unauthorized examination keys, or confidential institutional documents without explicit permission.",
      "Respect fellow students and tutors; harassment, hate speech, and abuse in collaborative notes or forums result in immediate termination."
    ]
  },
  {
    id: "ai-services",
    title: "3. AI Services & Study Tools (Omni & Zeal)",
    content: [
      "NSG integrates advanced artificial intelligence models to assist students with note summarization, lecture transcription, quiz synthesis, and podcast-style audio tutoring.",
      "While our models strive for factual grounding and precision based on your uploaded source material, AI outputs should always be independently verified against official course textbooks and syllabus guidelines."
    ],
    bullets: [
      "AI study companions are designed as educational tutors, not infallible authorities.",
      "NSG does not warrant that AI-generated flashcards or answers will predict specific examination questions with 100% accuracy.",
      "Users retain ownership of their uploaded study notes while granting NSG permission to process content for generating personalized educational insights."
    ]
  },
  {
    id: "data-privacy",
    title: "4. Data Privacy & Storage",
    content: [
      "Your privacy is paramount. We process student emails, course selections, lecture audio, and study notes in accordance with our Privacy Policy.",
      "Uploaded lecture recordings and personal notes are stored securely and accessible only by you and users you explicitly invite to collaborative study groups."
    ],
    bullets: [
      "We do not sell personal student data or academic notes to third-party data brokers.",
      "Telemetry and anonymized usage patterns may be analyzed to improve platform reliability and learning algorithms."
    ]
  },
  {
    id: "intellectual-property",
    title: "5. Intellectual Property Rights",
    content: [
      "All platform software, user interface designs, logos, graphics, algorithms, and system code are the exclusive intellectual property of NSG and its licensors.",
      "Users retain full intellectual property ownership of their own original lecture notes, research syntheses, and personal study content uploaded to the service."
    ]
  },
  {
    id: "termination",
    title: "6. Account Suspension & Termination",
    content: [
      "We reserve the right to suspend or terminate accounts that repeatedly violate these Terms, engage in security breaches, or misuse AI compute quotas.",
      "You may delete your account and request removal of your stored notes and materials at any time through your Profile Settings."
    ]
  },
  {
    id: "liability-disclaimer",
    title: "7. Limitation of Liability & Disclaimers",
    content: [
      "NSG is provided on an 'AS IS' and 'AS AVAILABLE' basis without warranties of any kind, whether express or implied. We do not guarantee uninterrupted access or zero downtime.",
      "Under no circumstances shall NSG or its creators be liable for academic penalties, missed deadlines, or indirect damages resulting from platform downtime or reliance on AI-generated summaries."
    ]
  },
  {
    id: "modifications-contact",
    title: "8. Amendments & Inquiries",
    content: [
      "We may revise these Terms and Conditions periodically. Continued use of the platform following notification of updates constitutes acceptance of the amended terms.",
      "If you have questions, feedback, or concerns regarding these Terms, please contact our support team at nuellkelechi@gmail.com or via the Contact Us modal."
    ]
  }
];
