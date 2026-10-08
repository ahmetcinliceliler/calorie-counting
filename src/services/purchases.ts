import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

import { PREMIUM_ENTITLEMENT, usePremiumStore } from '@/features/premium/store';

const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});

let configured = false;

function applyCustomerInfo(info: CustomerInfo) {
  usePremiumStore.getState().setPremium(Boolean(info.entitlements.active[PREMIUM_ENTITLEMENT]));
}

/** Uygulama açılışında bir kez. Anahtar yoksa satın alma kapalı kalır. */
export async function initPurchases(): Promise<void> {
  if (configured || !API_KEY) return;
  if (__DEV__) await Purchases.setLogLevel(LOG_LEVEL.WARN);
  Purchases.configure({ apiKey: API_KEY });
  configured = true;
  usePremiumStore.getState().setAvailable(true);
  Purchases.addCustomerInfoUpdateListener(applyCustomerInfo);
  try {
    applyCustomerInfo(await Purchases.getCustomerInfo());
  } catch (err) {
    console.warn('RevenueCat customer info failed', err);
  }
}

/**
 * Supabase kullanıcı kimliğiyle eşleştirir; webhook bu kimlikle entitlements tablosunu günceller.
 * Supabase bağlanınca oturum açıldığında çağrılacak.
 */
export async function identifyPurchaser(userId: string): Promise<void> {
  if (!configured) return;
  applyCustomerInfo((await Purchases.logIn(userId)).customerInfo);
}

export interface PlanOption {
  id: string;
  kind: 'monthly' | 'annual' | 'other';
  priceString: string;
  title: string;
  pkg: PurchasesPackage;
}

export async function getPlans(): Promise<PlanOption[]> {
  if (!configured) return [];
  const offerings = await Purchases.getOfferings();
  return (offerings.current?.availablePackages ?? []).map((pkg) => ({
    id: pkg.identifier,
    kind: pkg.packageType === 'MONTHLY' ? 'monthly' : pkg.packageType === 'ANNUAL' ? 'annual' : 'other',
    priceString: pkg.product.priceString,
    title: pkg.product.title,
    pkg,
  }));
}

/** true: satın alındı; false: kullanıcı vazgeçti. Diğer hatalar fırlatılır. */
export async function purchase(plan: PlanOption): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(plan.pkg);
    applyCustomerInfo(customerInfo);
    return Boolean(customerInfo.entitlements.active[PREMIUM_ENTITLEMENT]);
  } catch (err) {
    if ((err as { userCancelled?: boolean }).userCancelled) return false;
    throw err;
  }
}

export async function restore(): Promise<boolean> {
  if (!configured) return false;
  const info = await Purchases.restorePurchases();
  applyCustomerInfo(info);
  return Boolean(info.entitlements.active[PREMIUM_ENTITLEMENT]);
}
