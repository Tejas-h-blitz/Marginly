const feedbackEmail = import.meta.env.VITE_FEEDBACK_EMAIL?.trim();

export const FEEDBACK_HREF = feedbackEmail ? `mailto:${feedbackEmail}` : null;
