import type { ConfigContext, ExpoConfig } from 'expo/config';
export default ({ config }: ConfigContext): ExpoConfig => {
  const localHttp = process.env.DIRABL_ALLOW_LOCAL_HTTP === '1';
  return {
    ...config,
    name: 'dirabl',
    slug: 'dirabl',
    ios: {
      ...config.ios,
      infoPlist: {
        ...config.ios?.infoPlist,
        NSLocalNetworkUsageDescription:
          'Connect to your local dirabl development server for optional synthesis.',
        ...(localHttp ? { NSAppTransportSecurity: { NSAllowsArbitraryLoads: true } } : {}),
      },
    },
    plugins: [
      ...(config.plugins ?? []),
      ['expo-build-properties', { android: { usesCleartextTraffic: localHttp } }],
    ],
  };
};
