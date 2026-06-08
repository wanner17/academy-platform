import { prisma } from '../src/lib/db/prisma'

function normalizeScore(score: string): string {
  // 숫자 없는 텍스트(fail, 미통과 등) → 0/0
  if (!/\d/.test(score)) return '0/0'
  const numbers = score.match(/\d+(?:\.\d+)?/g)
  if (!numbers || numbers.length === 0) return '0/0'
  if (numbers.length === 1) return numbers[0]
  return `${numbers[0]}/${numbers[1]}`
}

async function main() {
  const results = await prisma.testResult.findMany({ select: { id: true, score: true } })
  let updated = 0
  for (const result of results) {
    const normalized = normalizeScore(result.score)
    if (normalized !== result.score) {
      await prisma.testResult.update({ where: { id: result.id }, data: { score: normalized } })
      console.log(`  "${result.score}" → "${normalized}"`)
      updated++
    }
  }
  console.log(`\n✓ ${updated}개 점수 정규화 완료 (전체 ${results.length}개)`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
