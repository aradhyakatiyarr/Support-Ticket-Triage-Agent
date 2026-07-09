// 30 hand-labeled tickets used as the evaluation set. Ground truth here is
// a human (PM) judgment call, same as a real eval set would be — this is
// what gets checked into version control so the eval is reproducible and
// arguable, not a black box.

export type EvalTicket = {
  id: string;
  text: string;
  expected: {
    category: string;
    priority: string;
    sentiment: string;
    escalate: boolean;
  };
};

export const EVAL_TICKETS: EvalTicket[] = [
  { id: "T01", text: "I've been charged twice for my subscription this month and no one has responded to my emails in 5 days. This is unacceptable, I want a refund NOW.", expected: { category: "billing", priority: "high", sentiment: "angry", escalate: false } },
  { id: "T02", text: "Your app crashes every time I try to export my project. I've lost 3 hours of work twice now. I have a client deadline in 2 hours and cannot get anything done.", expected: { category: "technical_issue", priority: "critical", sentiment: "frustrated", escalate: false } },
  { id: "T03", text: "I can't log into my account, it says my password is wrong even after I reset it 3 times. I run my business through this and I'm locked out right now.", expected: { category: "account_access", priority: "critical", sentiment: "frustrated", escalate: false } },
  { id: "T04", text: "Hi, just checking on the status of order #48213, it was supposed to arrive yesterday but tracking hasn't updated in 3 days.", expected: { category: "shipping_logistics", priority: "medium", sentiment: "neutral", escalate: false } },
  { id: "T05", text: "Just wanted to say the new dashboard redesign is really clean, much easier to navigate than before. Nice work!", expected: { category: "product_feedback", priority: "low", sentiment: "positive", escalate: false } },
  { id: "T06", text: "I'd like to cancel my subscription at the end of this billing cycle. It's a good product but it's just not something we're using enough to justify the cost.", expected: { category: "cancellation_churn", priority: "high", sentiment: "neutral", escalate: false } },
  { id: "T07", text: "Would it be possible to add dark mode to the mobile app? Would make it much easier to use at night.", expected: { category: "feature_request", priority: "low", sentiment: "neutral", escalate: false } },
  { id: "T08", text: "Do you have an office in Singapore? Trying to figure out timezone for support hours.", expected: { category: "other", priority: "low", sentiment: "neutral", escalate: false } },
  { id: "T09", text: "I upgraded to the Pro plan last week but I'm still being billed at the old rate and getting stuck with a 'plan mismatch' error when I try to use Pro features.", expected: { category: "billing", priority: "medium", sentiment: "frustrated", escalate: false } },
  { id: "T10", text: "Getting a 502 error when I try to upload files larger than 50MB. Smaller files upload fine.", expected: { category: "technical_issue", priority: "medium", sentiment: "neutral", escalate: false } },
  { id: "T11", text: "My two-factor authentication is broken, it's not sending codes to my phone anymore and I can't get into my account.", expected: { category: "account_access", priority: "high", sentiment: "frustrated", escalate: false } },
  { id: "T12", text: "My package arrived completely destroyed, the box was crushed and half the items inside are broken. I need a replacement shipped today, this was a gift for my daughter's birthday tomorrow.", expected: { category: "shipping_logistics", priority: "high", sentiment: "angry", escalate: false } },
  { id: "T13", text: "The new update made the font size too small on the settings page, it's hard to read.", expected: { category: "product_feedback", priority: "low", sentiment: "frustrated", escalate: false } },
  { id: "T14", text: "This is the third time your service has gone down during our live event. We are cancelling our enterprise contract immediately and moving to a competitor. I want to speak to someone senior today.", expected: { category: "cancellation_churn", priority: "critical", sentiment: "angry", escalate: true } },
  { id: "T15", text: "Love the product overall — one thing that would really help our team is bulk CSV import for contacts. Right now we have to add them one at a time.", expected: { category: "feature_request", priority: "medium", sentiment: "positive", escalate: false } },
  { id: "T16", text: "Can you send me an itemized invoice for last month's charges? Need it for our expense report.", expected: { category: "billing", priority: "low", sentiment: "neutral", escalate: false } },
  { id: "T17", text: "The API has been returning 500 errors intermittently for the past hour, it's affecting our production checkout flow and we're losing sales.", expected: { category: "technical_issue", priority: "high", sentiment: "frustrated", escalate: false } },
  { id: "T18", text: "How do I change the email address associated with my account?", expected: { category: "account_access", priority: "low", sentiment: "neutral", escalate: false } },
  { id: "T19", text: "What are your shipping options for international orders to Germany?", expected: { category: "shipping_logistics", priority: "low", sentiment: "neutral", escalate: false } },
  { id: "T20", text: "The search function almost never finds what I'm looking for even when I type the exact product name. It's making the app pretty frustrating to use daily.", expected: { category: "product_feedback", priority: "medium", sentiment: "frustrated", escalate: false } },
  { id: "T21", text: "What's the process for downgrading from the Team plan to the Starter plan? We don't need as many seats anymore.", expected: { category: "cancellation_churn", priority: "medium", sentiment: "neutral", escalate: false } },
  { id: "T22", text: "Any plans to support Zapier integration? Would help us automate a few workflows.", expected: { category: "feature_request", priority: "low", sentiment: "neutral", escalate: false } },
  { id: "T23", text: "Do you offer student discounts? I'm currently in university and love using the free tier.", expected: { category: "other", priority: "low", sentiment: "positive", escalate: false } },
  { id: "T24", text: "You charged my card $2,400 instead of $24 for my monthly plan. That's my rent money. I need this reversed immediately, I'm calling my bank in the next hour if I don't hear back.", expected: { category: "billing", priority: "critical", sentiment: "angry", escalate: true } },
  { id: "T25", text: "Small thing — the export button label says 'Expot' with a typo on the analytics page.", expected: { category: "technical_issue", priority: "low", sentiment: "neutral", escalate: false } },
  { id: "T26", text: "I keep getting logged out every few minutes on the desktop app, even though 'stay signed in' is checked.", expected: { category: "account_access", priority: "medium", sentiment: "frustrated", escalate: false } },
  { id: "T27", text: "Tracking says 'delivered' but I never received the package. Checked with neighbors, nothing. This is the second time this has happened.", expected: { category: "shipping_logistics", priority: "medium", sentiment: "frustrated", escalate: false } },
  { id: "T28", text: "The onboarding flow for new users is really well designed, way better than most tools we've tried.", expected: { category: "product_feedback", priority: "low", sentiment: "positive", escalate: false } },
  { id: "T29", text: "We've had three support tickets go unanswered for over a week. If this keeps up we're going to have to look elsewhere for our team.", expected: { category: "cancellation_churn", priority: "high", sentiment: "frustrated", escalate: false } },
  { id: "T30", text: "Our entire production dashboard is showing a blank white screen for all users since about 10 minutes ago. This is affecting our whole team.", expected: { category: "technical_issue", priority: "critical", sentiment: "neutral", escalate: false } },
];
