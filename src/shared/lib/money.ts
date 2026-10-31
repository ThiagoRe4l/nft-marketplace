import Big from 'big.js'

// "1.190" -> "1.19 ETH"; "2" -> "2.00 ETH"; "0.016" -> "0.016 ETH" (mínimo de 2 casas, sem zeros à direita além disso)
export function formatEth(value: string): string {
  const amount = new Big(value)
  const decimals = amount.toFixed().split('.')[1]?.length ?? 0
  return `${amount.toFixed(Math.max(decimals, 2))} ETH`
}
