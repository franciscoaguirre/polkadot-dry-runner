import { createSignal, type Component, For, createEffect, onMount } from 'solid-js';
import { useSearchParams } from '@solidjs/router';

import { Binary, SS58String, Transaction } from 'polkadot-api';

import styles from './App.module.css';
import { DispatchRawOrigin, WestendRuntimeOriginCaller, PolkadotRuntimeOriginCaller, GovernanceOrigin } from '@polkadot-api/descriptors';
import { Chain, chains, locationToChain } from './clients';
import { stringify } from './utils';

type Origin =
  'root' |
  'signed' |
  SS58String |
  'big-spender' |
  'big-tipper' |
  'fellowship-admin' |
  'general-admin' |
  'medium-spender' |
  'referendum-canceller' |
  'referendum-killer' |
  'small-spender' |
  'small-tipper' |
  'staking-admin' |
  'treasurer' |
  'whitelisted-caller';


const originToString = (complexOrigin: PolkadotRuntimeOriginCaller): Origin | undefined => {
  if (complexOrigin.type === 'system' && complexOrigin.value.type === 'Root') {
    return 'root';
  } else if (complexOrigin.type === 'system' && complexOrigin.value.type === 'Signed') {
    return `signed-${complexOrigin.value.value}`;
  } else if (complexOrigin.type === 'Origins' && complexOrigin.value.type === 'BigSpender') {
    return 'big-spender';
  } else if (complexOrigin.type === 'Origins' && complexOrigin.value.type === 'BigTipper') {
    return 'big-tipper';
  } else if (complexOrigin.type === 'Origins' && complexOrigin.value.type === 'FellowshipAdmin') {
    return 'fellowship-admin';
  } else if (complexOrigin.type === 'Origins' && complexOrigin.value.type === 'GeneralAdmin') {
    return 'general-admin';
  } else if (complexOrigin.type === 'Origins' && complexOrigin.value.type === 'MediumSpender') {
    return 'medium-spender';
  } else if (complexOrigin.type === 'Origins' && complexOrigin.value.type === 'ReferendumCanceller') {
    return 'referendum-canceller';
  } else if (complexOrigin.type === 'Origins' && complexOrigin.value.type === 'ReferendumKiller') {
    return 'referendum-killer';
  } else if (complexOrigin.type === 'Origins' && complexOrigin.value.type === 'SmallSpender') {
    return 'small-spender';
  } else if (complexOrigin.type === 'Origins' && complexOrigin.value.type === 'SmallTipper') {
    return 'small-tipper';
  } else if (complexOrigin.type === 'Origins' && complexOrigin.value.type === 'StakingAdmin') {
    return 'staking-admin';
  } else if (complexOrigin.type === 'Origins' && complexOrigin.value.type === 'Treasurer') {
    return 'treasurer';
  } else if (complexOrigin.type === 'Origins' && complexOrigin.value.type === 'WhitelistedCaller') {
    return 'whitelisted-caller';
  }
}

const stringToOrigin = (simpleOrigin: Origin): PolkadotRuntimeOriginCaller => {
  if (simpleOrigin === 'root') {
    return PolkadotRuntimeOriginCaller.system(DispatchRawOrigin.Root());
  } else if (simpleOrigin === 'big-spender') {
    return PolkadotRuntimeOriginCaller.Origins(GovernanceOrigin.BigSpender());
  } else if (simpleOrigin === 'big-tipper') {
    return PolkadotRuntimeOriginCaller.Origins(GovernanceOrigin.BigTipper());
  } else if (simpleOrigin === 'fellowship-admin') {
    return PolkadotRuntimeOriginCaller.Origins(GovernanceOrigin.FellowshipAdmin());
  } else if (simpleOrigin === 'general-admin') {
    return PolkadotRuntimeOriginCaller.Origins(GovernanceOrigin.GeneralAdmin());
  } else if (simpleOrigin === 'medium-spender') {
    return PolkadotRuntimeOriginCaller.Origins(GovernanceOrigin.MediumSpender());
  } else if (simpleOrigin === 'referendum-canceller') {
    return PolkadotRuntimeOriginCaller.Origins(GovernanceOrigin.ReferendumCanceller());
  } else if (simpleOrigin === 'referendum-killer') {
    return PolkadotRuntimeOriginCaller.Origins(GovernanceOrigin.ReferendumKiller());
  } else if (simpleOrigin === 'small-spender') {
    return PolkadotRuntimeOriginCaller.Origins(GovernanceOrigin.SmallSpender());
  } else if (simpleOrigin === 'small-tipper') {
    return PolkadotRuntimeOriginCaller.Origins(GovernanceOrigin.SmallTipper());
  } else if (simpleOrigin === 'staking-admin') {
    return PolkadotRuntimeOriginCaller.Origins(GovernanceOrigin.StakingAdmin());
  } else if (simpleOrigin === 'treasurer') {
    return PolkadotRuntimeOriginCaller.Origins(GovernanceOrigin.Treasurer());
  } else if (simpleOrigin === 'whitelisted-caller') {
    return PolkadotRuntimeOriginCaller.Origins(GovernanceOrigin.WhitelistedCaller());
  } else if (simpleOrigin.includes('signed')) {
    const [_, ss58] = simpleOrigin.split('-');
    return PolkadotRuntimeOriginCaller.system(DispatchRawOrigin.Signed(ss58))
  } else {
    return PolkadotRuntimeOriginCaller.system(DispatchRawOrigin.None());
  }
}

const camelToKebab = (camel: string): string => {
  return camel.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

const kebabToCamel = (kebab: string): string => {
  return kebab.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

const App: Component = () => {
  const [searchParams, setSearchParams] = useSearchParams<{ chain: Chain, origin: string, call: string }>();
  const [origin, setOrigin] = createSignal<PolkadotRuntimeOriginCaller>(searchParams.origin !== undefined ? stringToOrigin(searchParams.origin) : PolkadotRuntimeOriginCaller.system(DispatchRawOrigin.Root()));
  const [callData, setCallData] = createSignal(searchParams.call ?? "");
  const [transaction, setTransaction] = createSignal<Transaction<any, any, any, any>>();
  const [errorMessage, setErrorMessage] = createSignal("");
  const [hops, setHops] = createSignal([]);
  const [showingAccountInput, setShowingAccountInput] = createSignal(false);
  const [chain, setChain] = createSignal<Chain>(searchParams.chain ? kebabToCamel(searchParams.chain) : 'polkadot');
  const [loading, setLoading] = createSignal(false);

  onMount(async () => {
    if (callData() !== "") {
      try {
        setLoading(true);
        const tx = await chains[chain()].api.txFromCallData(Binary.fromHex(callData()))
        setTransaction(tx);
      } catch {
        setErrorMessage("Invalid call data");
      } finally {
        setLoading(false);
      }
    }
  });

  createEffect(() => {
    setSearchParams({
      chain: camelToKebab(chain()),
      origin: originToString(origin()),
      call: callData(),
    });
  });

  const handleOriginChange = (value: Origin) => {
    if (value.includes('signed')) {
      const [_, ss58] = value.split('-');
      console.log(ss58);
      setOrigin(PolkadotRuntimeOriginCaller.system(DispatchRawOrigin.Signed(ss58)));
      setShowingAccountInput(true);
    } else {
      setOrigin(stringToOrigin(value));
      setShowingAccountInput(false);
    }
  };

  const handleEncodedCallChange = async (value: string) => {
    try {
      console.log('Chain:', chain());
      setCallData(value);
      const tx = await chains[chain()].api.txFromCallData(Binary.fromHex(value))
      setTransaction(tx);
      setErrorMessage("");
    } catch {
      setErrorMessage("Invalid call data");
    }
  };

  const handleDryRun = async () => {
    // Reset hops, new dry-run happening.
    setHops([]);
    setLoading(true);
    const result = await chains[chain()].api.apis.DryRunApi.dry_run_call(origin()!, transaction()!.decodedCall);
    setHops((previousHops) => [...previousHops, [chain(), result]]);
    if (result.success && result.value.forwarded_xcms.length > 0) {
      console.dir({ events: result.value.emitted_events });
      const maybeSentDestination = result.value.emitted_events.find((event) => (
        (event.type === 'XcmPallet' || event.type === 'PolkadotXcm') &&
          event.value.type === 'Sent'
      ))
      if (maybeSentDestination !== undefined) {
        const sentDestination = maybeSentDestination.value.value.destination;
        const [destinationLocation, remoteMessages] = result.value.forwarded_xcms.find(([destination, _]) => (
          destination.type === 'V4' &&
            destination.value.parents === sentDestination.parents &&
            destination.value.interior.type === sentDestination.interior.type &&
            destination.value.interior.value.type === sentDestination.interior.value.type &&
            destination.value.interior.value.value === sentDestination.interior.value.value
        ));
        console.dir({ destinationLocation, remoteMessages });
        if (remoteMessages.length > 0) {
          const [destinationChain, origin] = locationToChain(chain(), destinationLocation)!;
          const remoteDryRunResult = await chains[destinationChain].api.apis.DryRunApi.dry_run_xcm(origin, remoteMessages[0]);
          console.dir({ result: remoteDryRunResult });
          setHops((previousHops) => [...previousHops, [destinationChain, remoteDryRunResult]]);
        }
      }
    }
    setLoading(false);
  };

  const handleChainChange = (newChain: Chain) => {
    setChain(newChain);
  };

  return (
    <div class={styles.App}>
      <div class={styles.inputs}>
        <div class={styles.innerInputs}>
          <label>
            Chain:
            <select onChange={(event) => handleChainChange(event.currentTarget.value as Chain)} value={chain()}>
              <option value="polkadot">Polkadot</option>
              <option value="polkadotAssetHub">Polkadot Asset Hub</option>
              <option value="polkadotCollectives">Polkadot Collectives</option>
              <option value="polkadotPeople">Polkadot People</option>
              <option value="westend">Westend</option>
              <option value="westendAssetHub">Westend Asset Hub</option>
            </select>
          </label>
          <label>
            Origin:
            <select onChange={(event) => handleOriginChange(event.currentTarget.value as Origin)} value={originToString(origin())?.includes('signed') ? 'signed' : originToString(origin())}>
              <option value="root">Root</option>
              <option value="signed">Signed</option>
              <option value="general-admin">General Admin</option>
              <option value="fellowship-admin">Fellowship Admin</option>
              <option value="staking-admin">Staking Admin</option>
              <option value="big-spender">Big Spender</option>
              <option value="big-tipper">Big Tipper</option>
              <option value="medium-spender">Medium Spender</option>
              <option value="medium-tipper">Medium Tipper</option>
              <option value="small-spender">Small Spender</option>
              <option value="small-tipper">Small Tipper</option>
              <option value="referendum-canceller">Referendum Canceller</option>
              <option value="referendum-killer">Referendum Killer</option>
              <option value="treasurer">Treasurer</option>
              <option value="whitelisted-caller">Whitelisted Caller</option>
            </select>
            {showingAccountInput() && <input onChange={(event) => handleOriginChange(`signed-${event.currentTarget.value}`)} type="text"></input>}
          </label>
          <label>
            Call data:
            <input onChange={(event) => handleEncodedCallChange(event.currentTarget.value)} type="text" value={callData()}></input>
          </label>
          <small style="color: red">{errorMessage()}</small>
          <button onClick={handleDryRun}>Dry-run</button>
          {loading() && <p>Loading...</p>}
        </div>
      </div>
      {hops() !== undefined && (
        <ul>
          <For each={hops()}>{(hop, index) => (
            <div>
              <h2>Chain {index() + 1}: {hop[0]}</h2>
              <div class={styles.results}>
                <h3>Result:</h3>
                <pre>{stringify(hop[1].value.execution_result)}</pre>
                <br />
                <h3>Events:</h3>
                <ul style="list-style-type: none">
                  <For each={hop[1].value.emitted_events}>{(event) => (
                    <li>{event.type}: {event.value.type} <pre>{stringify(event.value.value)}</pre></li>
                  )}</For>
                </ul>
              </div>
            </div>
          )}</For>
        </ul>
      )}
    </div>
  );
};

export default App;
