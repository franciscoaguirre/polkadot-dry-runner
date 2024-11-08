import { createSignal, type Component, For } from 'solid-js';

import { Binary, SS58String, Transaction } from 'polkadot-api';

import styles from './App.module.css';
import { DispatchRawOrigin, WestendRuntimeOriginCaller, PolkadotRuntimeOriginCaller } from '@polkadot-api/descriptors';
import { Chain, chains, locationToChain } from './clients';
import { stringify } from './utils';

type Origin = "root" | "signed" | SS58String;

const App: Component = () => {
  const [origin, setOrigin] = createSignal<WestendRuntimeOriginCaller | PolkadotRuntimeOriginCaller>(WestendRuntimeOriginCaller.system(DispatchRawOrigin.Root()));
  const [transaction, setTransaction] = createSignal<Transaction<any, any, any, any>>();
  const [errorMessage, setErrorMessage] = createSignal("");
  const [hops, setHops] = createSignal([]);
  const [showingAccountInput, setShowingAccountInput] = createSignal(false);
  const [chain, setChain] = createSignal<Chain>('westend');
  const [loading, setLoading] = createSignal(false);

  const handleOriginChange = (value: Origin) => {
    if (value === "root") {
      setOrigin(WestendRuntimeOriginCaller.system(DispatchRawOrigin.Root()));
      setShowingAccountInput(false);
    } else if (value === "signed") {
      setOrigin(WestendRuntimeOriginCaller.system(DispatchRawOrigin.None()));
      setShowingAccountInput(true);
    } else {
      setOrigin(WestendRuntimeOriginCaller.system(DispatchRawOrigin.Signed(value)))
    }
  };

  const handleEncodedCallChange = async (value: string) => {
    try {
      console.log('Chain:', chain());
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
      console.dir({ forwarded_xcms: result.value.forwarded_xcms });
      const [destinationLocation, remoteMessages] = result.value.forwarded_xcms.find(([destination, _]) => (
        destination.type === 'V4' &&
          destination.value.parents === 0 &&
          destination.value.interior.type === 'X1' &&
          destination.value.interior.value.type === 'Parachain' &&
          destination.value.interior.value.value === 1000
      ));
      console.dir({ destinationLocation, remoteMessages });
      if (remoteMessages.length > 0) {
        const [destinationChain, origin] = locationToChain(chain(), destinationLocation)!;
        const remoteDryRunResult = await chains[destinationChain].api.apis.DryRunApi.dry_run_xcm(origin, remoteMessages[0]);
        console.dir({ result: remoteDryRunResult });
        setHops((previousHops) => [...previousHops, [destinationChain, remoteDryRunResult]]);
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
            <select onChange={(event) => handleChainChange(event.currentTarget.value as Chain)}>
              <option value="westend">Westend</option>
              <option value="westendAssetHub">Westend Asset Hub</option>
              <option value="polkadot">Polkadot</option>
              <option value="polkadotAssetHub">Polkadot Asset Hub</option>
              <option value="kusama">Kusama</option>
              <option value="kusamaAssetHub">Kusama Asset Hub</option>
            </select>
          </label>
          <label>
            Origin:
            <select onChange={(event) => handleOriginChange(event.currentTarget.value as Origin)}>
              <option value="root">Root</option>
              <option value="signed">Signed</option>
            </select>
            {showingAccountInput() && <input onChange={(event) => handleOriginChange(event.currentTarget.value as Origin)} type="text"></input>}
          </label>
          <label>
            Call data:
            <input onChange={(event) => handleEncodedCallChange(event.currentTarget.value)} type="text"></input>
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
