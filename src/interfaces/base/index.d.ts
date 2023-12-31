import { GlobalStateVariableType } from "../../utils/types";

export interface GlobalState {
  [variableName: string]: GlobalStateVariable; // Prob a base type for now | Has to be interpreted at assignment || Is passed back from and to Ethers
}

interface IIndentationLevelManager {
  get(): string;
  increase(): void;
  decrease(): void;
  Indent<T>(iterations?: number): Function;
}

interface IIndentationLevelHandler {
  getIndentation(): string;
  increaseIndentationLevel(): void;
  decreaseIndentationLevel(): void;
  concatenateFragments(fragments: string[]): string;
}

interface IDynamicContractInterfacesTypeHandler {
  getContractInterfacesTypeFromContractInterfaces(): string;
}

export interface IGlobalStateManager {
  private state: IGlobalState;
  setVariable(name: string, value: string, type: GlobalStateVariableType): void;
  getVariable(name: string): GlobalStateVariable;
  getVariableNameByValue(value: string): GlobalStateVariableWithName | null;
}

export interface GlobalStateVariable {
  value: string;
  type: GlobalStateVariableType;
}

export type GlobalStateVariableWithName = {
  name: string;
  value: GlobalStateVariable;
}

export type FunctionExecutionOptions = {
  value?: string;
  gasLimit?: string;
  gasPrice?: string;
}