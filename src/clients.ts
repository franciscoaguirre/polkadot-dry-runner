import { wnd, wndAh, roc, rocAh, XcmVersionedLocation } from '@polkadot-api/descriptors';
import { TypedApi, createClient } from 'polkadot-api';
import { getWsProvider } from 'polkadot-api/ws-provider/web';
import { getSmProvider } from 'polkadot-api/sm-provider';
import { startFromWorker } from 'polkadot-api/smoldot/from-worker';
import { chainSpec as westendChainSpec } from 'polkadot-api/chains/westend2';
import { chainSpec as westendAssetHubChainSpec } from 'polkadot-api/chains/westend2_asset_hub';
import { chainSpec as rococoChainSpec } from 'polkadot-api/chains/rococo_v2_2';
import { chainSpec as rococoAssetHubChainSpec } from 'polkadot-api/chains/westend2_asset_hub';
import SmWorker from 'polkadot-api/smoldot/worker?worker';
import { Accessor, Setter, createEffect, createSignal, onCleanup } from 'solid-js';

const wndClient = createClient(getWsProvider("wss://westend-rpc.polkadot.io"));
const wndAhClient = createClient(getWsProvider("wss://westend-asset-hub-rpc.polkadot.io"));
const rocClient = createClient(getWsProvider("wss://rococo-rpc.polkadot.io"));
const rocAhClient = createClient(getWsProvider("wss://rococo-asset-hub-rpc.polkadot.io"));

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
  } else if (source === 'rococo') {
    if (
      destination.value.parents === 0 &&
        destination.value.interior.type === 'X1' &&
        destination.value.interior.value.type === 'Parachain' &&
        destination.value.interior.value.value === 1000
    ) {
      return ['rococoAssetHub', { type: version, value: { parents: 1, interior: { type: 'Here', value: undefined } } }];
    }
  } else if (source === 'rococoAssetHub') {
    if (
      destination.value.parents === 1 &&
        destination.value.interior.type === 'Here'
    ) {
      return ['rococo', { type: version, value: { parents: 0, interior: { type: 'X1', value: { type: 'Parachain', value: 1000 } } } }];
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
  rococo: {
    chainSpec: rococoChainSpec,
    descriptors: roc,
    api: rocClient.getTypedApi(roc),
  },
  rococoAssetHub: {
    chainSpec: rococoAssetHubChainSpec,
    descriptors: rocAh,
    api: rocAhClient.getTypedApi(rocAh),
  },
};

export type Chain = keyof typeof chains;
// type Api = TypedApi<typeof wnd> | TypedApi<typeof wndAh>;

// export const createApi = (defaultValue: Chain): [Accessor<TypedApi<typeof wnd> | TypedApi<typeof wndAh> | undefined>, Setter<Chain>] => {
//   const [chain, setChain] = createSignal<Chain>(defaultValue);
//   const [api, setApi] = createSignal<Api | undefined>();

//   const worker = new SmWorker();
//   let smoldot;

//   createEffect(() => {
//     smoldot = startFromWorker(worker);
//     const smoldotChain = smoldot.addChain({ chainSpec: chains[chain()].chainSpec });
//     const client = createClient(getSmProvider(smoldotChain));
//     setApi(client.getTypedApi(chains[chain()].descriptors));
//     console.dir({ chain: chain() });
//     console.dir({ api: api() });

//     onCleanup(() => {
//       smoldot!.terminate();
//       client.destroy();
//     });
//   });

//   return [api, setChain];
// };
