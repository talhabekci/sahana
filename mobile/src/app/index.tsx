import { Redirect } from 'expo-router';

/** Kök rota — asıl yönlendirmeyi _layout'taki auth kapısı yapar. */
export default function Index() {
  return <Redirect href="/(tabs)/profile" />;
}
