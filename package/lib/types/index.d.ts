export interface FrostBackground {
  type: 'linear' | 'radial' | 'solid'
  angle: number
  colors: string[]
}

export interface FrostConfig {
  preset: string
  custom: boolean
  glass: string
  background: FrostBackground
  accent: string
  surfaceAlpha: number
  blurStrength: number
  glassAlpha: number
  enabled: boolean
}

export declare const name: 'frost-canvas'
export declare const inject: string[]
export declare const Config: import('schemastery').Schema<FrostConfig>
export declare function apply(ctx: any, config?: Partial<FrostConfig>): void