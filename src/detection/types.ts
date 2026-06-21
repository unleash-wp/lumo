export type DetectionSource = 'composer' | 'directory' | 'wp-cli' | 'heuristic';

export interface PluginDetection {
  slug: 'woocommerce';
  version: string | null;
  source: DetectionSource;
}
