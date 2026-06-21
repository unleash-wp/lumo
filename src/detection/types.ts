export type DetectionSource = 'composer' | 'directory' | 'wp-cli' | 'heuristic' | 'git';

export interface PluginDetection {
  /** Matched pattern slug (== registry PatternDefinition.pattern). */
  pattern: string;
  version: string | null;
  source: DetectionSource;
}
