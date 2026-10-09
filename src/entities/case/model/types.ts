export type CaseMetric = { value: string; label: string };

export type PortfolioCase = {
  id: string;
  brand: string;
  logo: string;
  image: { src: string; alt: string };
  title: string;
  description: string;
  details: string;
  metrics: readonly [CaseMetric, CaseMetric];
};
