import { z } from 'zod';

// Formdaki metin alanlarını sayıya çevirir; virgüllü ondalığı da kabul eder ("72,5").
const num = (min: number, max: number, key: string) =>
  z
    .string()
    .trim()
    .transform((v) => Number(v.replace(',', '.')))
    .pipe(z.number({ error: key }).min(min, { error: key }).max(max, { error: key }));

export const bodySchema = z.object({
  weightKg: num(30, 300, 'weight'),
  heightCm: num(100, 250, 'height'),
  age: num(13, 100, 'age').pipe(z.number().int({ error: 'age' })),
  targetWeightKg: z.union([z.literal('').transform(() => null), num(30, 300, 'targetWeight')]),
});

export type BodyInput = z.input<typeof bodySchema>;

/** Hata varsa i18n anahtarı (`onboarding.invalid.<key>`) döner. */
export function validateBody(input: BodyInput) {
  const result = bodySchema.safeParse(input);
  if (result.success) return { ok: true as const, data: result.data };
  const key = result.error.issues[0]?.message ?? 'weight';
  return { ok: false as const, errorKey: `onboarding.invalid.${key}` };
}
