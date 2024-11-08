import { wnd, wndAh, dot, dotAh, XcmVersionedLocation, ksm, ksmAh } from '@polkadot-api/descriptors';
import { createClient } from 'polkadot-api';
import { getWsProvider } from 'polkadot-api/ws-provider/web';
import { chainSpec as westendChainSpec } from 'polkadot-api/chains/westend2';
import { chainSpec as westendAssetHubChainSpec } from 'polkadot-api/chains/westend2_asset_hub';
import { chainSpec as polkadotChainSpec } from 'polkadot-api/chains/polkadot';
import { chainSpec as polkadotAssetHubChainSpec } from 'polkadot-api/chains/polkadot_asset_hub';
import { chainSpec as kusamaChainSpec } from 'polkadot-api/chains/ksmcc3';
import { chainSpec as kusamaAssetHubChainSpec } from 'polkadot-api/chains/ksmcc3_asset_hub';

const wndClient = createClient(getWsProvider("wss://westend-rpc.polkadot.io"));
const wndAhClient = createClient(getWsProvider("wss://westend-asset-hub-rpc.polkadot.io"));
const dotClient = createClient(getWsProvider("wss://polkadot-rpc.dwellir.com"));
const dotAhClient = createClient(getWsProvider("wss://polkadot-asset-hub-rpc.polkadot.io"));
const ksmClient = createClient(getWsProvider("wss://kusama-rpc.dwellir.com"));
const ksmAhClient = createClient(getWsProvider("wss://kusama-asset-hub-rpc.polkadot.io"));

// Given a source and a destination location, returns the destination chain and a location from
// `destination` to `source`.
export const locationToChain = (source: Chain, destination: XcmVersionedLocation): [Chain, XcmVersionedLocation] | undefined => {
  const version = destination.type;
  if (source === 'westend') {
    if (
      destination.value.parents === 0 &&
        destination.value.interior.type === 'X1' &&
        destination.value.interior.value.type === 'Parachain' &&
        destination.value.interior.value.value === 1000
    ) {
      return ['westendAssetHub', { type: version, value: { parents: 1, interior: { type: 'Here', value: undefined } } }];
    }
  } else if (source === 'westendAssetHub') {
    if (
      destination.value.parents === 1 &&
        destination.value.interior.type === 'Here'
    ) {
      return ['westend', { type: version, value: { parents: 0, interior: { type: 'X1', value: { type: 'Parachain', value: 1000 } } } }];
    }
  } else if (source === 'polkadot') {
    if (
      destination.value.parents === 0 &&
        destination.value.interior.type === 'X1' &&
        destination.value.interior.value.type === 'Parachain' &&
        destination.value.interior.value.value === 1000
    ) {
      return ['polkadotAssetHub', { type: version, value: { parents: 1, interior: { type: 'Here', value: undefined } } }];
    }
  } else if (source === 'polkadotAssetHub') {
    if (
      destination.value.parents === 1 &&
        destination.value.interior.type === 'Here'
    ) {
      return ['polkadot', { type: version, value: { parents: 0, interior: { type: 'X1', value: { type: 'Parachain', value: 1000 } } } }];
    }
  } else if (source === 'kusama') {
    if (
      destination.value.parents === 0 &&
        destination.value.interior.type === 'X1' &&
        destination.value.interior.value.type === 'Parachain' &&
        destination.value.interior.value.value === 1000
    ) {
      return ['kusamaAssetHub', { type: version, value: { parents: 1, interior: { type: 'Here', value: undefined } } }];
    }
  } else if (source === 'kusamaAssetHub') {
    if (
      destination.value.parents === 1 &&
        destination.value.interior.type === 'Here'
    ) {
      return ['kusama', { type: version, value: { parents: 0, interior: { type: 'X1', value: { type: 'Parachain', value: 1000 } } } }];
    }
  }
};

export const chains = {
  westend: {
    chainSpec: westendChainSpec,
    descriptors: wnd,
    api: wndClient.getTypedApi(wnd),
  },
  westendAssetHub: {
    chainSpec: westendAssetHubChainSpec,
    descriptors: wndAh,
    api: wndAhClient.getTypedApi(wndAh),
  },
  polkadot: {
    chainSpec: polkadotChainSpec,
    descriptors: dot,
    api: dotClient.getTypedApi(dot),
  },
  polkadotAssetHub: {
    chainSpec: polkadotAssetHubChainSpec,
    descriptors: dotAh,
    api: dotAhClient.getTypedApi(dotAh),
  },
  kusama: {
    chainSpec: kusamaChainSpec,
    descriptors: ksm,
    api: ksmClient.getTypedApi(ksm),
  },
  kusamaAssetHub: {
    chainSpec: kusamaAssetHubChainSpec,
    descriptors: ksmAh,
    api: ksmAhClient.getTypedApi(ksmAh),
  },
};

export type Chain = keyof typeof chains;
