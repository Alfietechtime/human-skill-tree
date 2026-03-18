export interface Skill {
  slug: string;
  phase: number;
  title: string;
  description: string;
  triggers: string;
  methodology: string;
  instructions: string;
  examples: string;
  references: string;
}

export interface PhaseInfo {
  id: number;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  emoji: string;
}
