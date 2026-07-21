type LogoProps = {
  size?: number
  className?: string
}

/**
 * Monograma "GA" — selo branco com as letras em dois tons de azul da marca.
 * Usado no menu lateral, na tela de login e no cabeçalho dos PDFs.
 */
export function Logo({ size = 40, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Dr. Gustavo Amaral"
      className={className}
    >
      <circle cx="24" cy="24" r="23" fill="#FFFFFF" stroke="#E3F3F8" strokeWidth="2" />
      <text
        x="16"
        y="31"
        textAnchor="middle"
        fontFamily="'Inter Variable', Inter, sans-serif"
        fontWeight="700"
        fontSize="22"
        fill="#3892AB"
      >
        G
      </text>
      <text
        x="31"
        y="31"
        textAnchor="middle"
        fontFamily="'Inter Variable', Inter, sans-serif"
        fontWeight="700"
        fontSize="22"
        fill="#5EBFD6"
      >
        A
      </text>
    </svg>
  )
}
