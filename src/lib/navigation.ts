import { router } from 'expo-router';

/** Modal akışını kapatıp ana ekrana döner; geçmiş yoksa (derin bağlantı, web yenileme) ana ekrana gider. */
export function closeFlow() {
  if (router.canDismiss()) router.dismissAll();
  else router.replace('/');
}
