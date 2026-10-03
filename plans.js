// Edit prices and features here — the Pricing page and landing teaser read from this file.
export const CURRENCY = '$';
export const PLANS = [
  { id: 'free', name: 'Free', price: 0, period: 'forever', blurb: 'Try it on a few videos.',
    features: ['3 videos/month', 'Basic subtitles', 'Limited languages'], cta: 'Start free' },
  { id: 'pro', name: 'Pro', price: 19, period: 'month', blurb: 'For creators who publish often.', highlight: true,
    features: ['50 videos/month', 'Voice dubbing', 'All languages', 'Faster processing'], cta: 'Choose Pro' },
  { id: 'business', name: 'Business', price: 79, period: 'month', blurb: 'For teams and platforms.',
    features: ['Higher limits', 'API access', 'Team collaboration', 'Priority processing'], cta: 'Choose Business' },
];
