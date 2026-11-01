import { z } from 'zod'
import { IsoDate } from '@/contracts/common'

// não há schema de cupom em contracts/: o cliente só envia o código
const Coupon = z.object({
  code: z.string().min(1),
  percentOff: z.number().int().min(1).max(100),
  expiresAt: IsoDate,
})

type CouponFixture = { code: string; percentOff: number; expiresAt: string }

const coupons: CouponFixture[] = [
  { code: 'KURIO10', percentOff: 10, expiresAt: '2030-12-31T23:59:59Z' },
  { code: 'EXPIRADO20', percentOff: 20, expiresAt: '2025-12-31T23:59:59Z' },
]

// validação só em desenvolvimento: fora do caminho crítico da produção
export const couponFixtures: CouponFixture[] = import.meta.env.DEV ? Coupon.array().parse(coupons) : coupons
