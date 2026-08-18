export interface FrostConfig {
  preset: string
  custom: boolean
  glass: string
  background: { type: string; angle: number; colors: string[] }
  accent: string
  surfaceAlpha: number
  blurStrength: number
  glassAlpha: number
  enabled: boolean
}

export declare const inject: string[]
export declare function apply(ctx: any): void