// Web: uygulama içi satın alma yok (mağaza dışı). Arayüz "available: false" görür.
export interface PlanOption {
  id: string;
  kind: 'monthly' | 'annual' | 'other';
  priceString: string;
  title: string;
  pkg: unknown;
}

export async function initPurchases(): Promise<void> {}
export async function identifyPurchaser(_userId: string): Promise<void> {}
export async function getPlans(): Promise<PlanOption[]> {
  return [];
}
export async function purchase(_plan: PlanOption): Promise<boolean> {
  return false;
}
export async function restore(): Promise<boolean> {
  return false;
}
