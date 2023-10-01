/** NEW SPEC */

import { GlobalStateVariableType } from "../utils/types";

// Implies a return value and a way to handle it, as well as a single function which will be called

// == UI == //
export interface EthersContract {
  functionString: string; // Abi Function e.g. "function getRewards() external"
  address: string; // Address of the receiving contract
}

// Details Pertaining to properties of the call not specifically imputable to ethers
export interface CallInfo {
  value?: string;
  gasLimit?: string;
  from: string;
}

// == INTERNAL == //

// @audit-info Unused in this codebase:
// export interface ExecutableContract {
//   // Byproduct of Ethers parsing the data
//   calldata: string;
//   address: string;

//   callInfo: CallInfo; // Call info
// }

// == THIS IS THE OUTCOME OF THE UI == //
export interface DDCall {
  callInfo: CallInfo; // Details wrt to how to perform the call
  contract: EthersContract; // Details wrt to the Contract and the function being called
  inputs: string[]; // Inputs are built by the tool via the processing
}

export interface DDStep {
  call: DDCall;
  outputMappings: OutputMapping[]; // Empty string means we skip
  inputMappings: InputMapping[]; // 0, 1, 2 are just variables for `EthersContract.inputs[]`
}

export type OutputMapping = string;

export interface InputMapping {
  type: "concrete" | "stateMapping";
  value: string; // Bytes for concrete | Name of Variable for stateMapping
}

export type DDSequence = DDStep[];

export type GlobalStateVariable = {
  value: string;
  type: GlobalStateVariableType;
}

export interface AdditionalSettings {
  fundsToCaller?: string; // How much ETH to give to caller
  tokensToCaller?: DDTokenToUser[]; // How much tokens to give to caller
  alwaysFundCaller?: boolean;
}

export type DDTokenToUser = {
    account: string;
    address: string;
    amount: string;
}

export type DDSequenceWithSettings = {
  sequence: DDSequence;
  settings: AdditionalSettings;
};

// Additional types:

export type AddressToInterfaceMapping = {
    [address: string]: string[]
}

// export type AddressToIndexMapping = {
//     [address: string]: number
// }

// export type IndexToContractMapping = {
//     [index: number]: DD
// }

export type AddressToContractMapping = {
    [address: string]: S2CContract
}

export type AddressToAccountMapping = {
    [address: string]: number // Can be changed into a more complex type with a future update
}

export type S2CContract = {
    interface: string[];
    index: number;
}