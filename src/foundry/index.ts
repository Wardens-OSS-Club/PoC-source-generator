import { GlobalStateManager } from "./utils";
import { GlobalStateVariableType, GlobalStateVariableTypeArray } from "../utils/types";
import {
    DDSequence,
    AdditionalSettings,
    DDCall,
    AddressToContractMapping,
    AddressToAccountMapping,
    DDSequenceWithSettings,
    S2CContract,
    InputMapping
} from "../interfaces";

/**
 * @description
 * Generates the test contract from the sequence object and settings.
 * @remarks
 * After initializing the class with the needed params call the {@link Step2Code.createTestFromSequence } function to generate the test contract.
 * 
*/
export default class Step2Code extends GlobalStateManager {    

    sequence: DDSequence = [];
    settings: AdditionalSettings = {};
    calls: DDCall[] = [];
    addressToContract: AddressToContractMapping = {};
    addressToAccount: AddressToAccountMapping = {};

    constructor(_: DDSequenceWithSettings) {
        const { sequence: _sequence, settings: _settings } = _;

        // This is just so that the TS compiler doesn't yell at us
        super();

        // extracting the calls from the sequence object
        this.sequence = _sequence;
        this.settings = _settings;

        this.calls = _sequence.map((_step) => _step.call);
        this.setContractMappings();
    }

    // Contract-mappings functions:

    /**
     * @description
     * Sets the contract mappings for the test contract. Uses the sequence and settings to extract the needed information.
     */
    setContractMappings() {
        // defining and not directly mutating to keep the code style uniform
        const _addressToContract: AddressToContractMapping = {}
        const _addressToAccount: AddressToAccountMapping = {}

        for (let index = 0; index < this.calls.length; index++) {
            const { from } = this.calls[index].callInfo;
            const { address, functionString } = this.calls[index].contract;
            
            const contractMappingExists = !!_addressToContract[address]
            const accountMappingExists = !!_addressToAccount[from]

            if (!accountMappingExists || !_addressToAccount[from])
                _addressToAccount[from] = Object.keys(_addressToAccount).length + 1;

            if (contractMappingExists && _addressToContract[address].interface.includes(functionString)) continue;

            contractMappingExists ?
                _addressToContract[address].interface.push(functionString) :
                _addressToContract[address] = { index: Object.keys(_addressToContract).length + 1, interface: [functionString] };
        }
        this.addressToContract = _addressToContract;
        this.addressToAccount = _addressToAccount;
    }

    // Fragment-extraction functions:

    /**
     * @description
     * Extracts the function fragment from a function string and does basic verification on it.
     * 
     * @param functionString The function string to extract the function fragment from
     * @returns The function fragment
     */
    extractFunctionFragment(functionString: string): string[] { 
        const fragment: string[] = functionString.split(" ");
        if (fragment.length < 2) throw new Error("Invalid function string.");

        const nameAndArgsIndex: 1 | 0 = (fragment[0] === "function" ? 1 : 0);
        const nameAndArgs = fragment[nameAndArgsIndex].split("(");
        if (nameAndArgs.length < 2) throw new Error("Invalid function string.");
        return fragment;
    }

    /**
     * @description
     * Extracts the modifiers from a function fragment. Currently only supports the payable modifier.
     * 
     * @param functionFragment The function fragment to extract the modifiers from
     * @returns The modifiers of the function
     */
    getFunctionModifiers(functionFragment: string[]): { isPayable: boolean } { 
        const isPayable = functionFragment.includes("payable");
        return { isPayable };
    }

    /**
     * @description
     * Extracts the output types from a function fragment.
     * 
     * @param functionFragment The function fragment to extract the output types from
     * 
     * @returns The output types of the function
     */
    getCallOutputTypes(functionFragment: string[]): GlobalStateVariableType[] { 
        let args: string | string[] = []

        for (let index = 0; index < functionFragment.length; index++) {
            if (!functionFragment[index].includes("returns")) continue;
            args = functionFragment.slice(index + 1);
            args[0] = args[0].split("(")[1];
            args[args.length - 1] = args[args.length - 1].split(")")[0];
            break;
        }

        let _args: GlobalStateVariableType[] = [];

        for (const arg of args) { 
            if (["uint", "int"].includes(arg)) _args.push((arg + "256") as GlobalStateVariableType);
            if (!GlobalStateVariableTypeArray.includes(arg)) continue;
            _args.push(arg as GlobalStateVariableType);
        }

        return _args as GlobalStateVariableType[];
    }

    // DEFINITION FUNCTIONS:

    /**
     * @description
     * Defines a contract interface from a {@link S2CContract} contract object.
     * 
     * @param index The index of the contract in the sequence
     * @param _interface The interface of the contract
     *  
     * @returns The contract interface
     */
    @Step2Code.indentation.Indent()
    defineContractInterface({ index, interface: _interface }: S2CContract): string {
        return `interface Contract${index} { \n${_interface.map((_function) => `${this.getIndentation()}${_function}; \n`).join("")}}`;
    }

    /**
     * @description
     * Defines a contract variable from an address and an index.
     * 
     * @param address The address of the contract
     * @param index The index of the contract in the sequence
     * @returns The contract variable
     */
    @Step2Code.indentation.Indent()
    defineContractVariable(address: string, index: number): string {
        // Setting the contract variable into a constant:
        this.setVariable(`contract${index}`, `contract${index}`, "contract");
        return `${this.getIndentation()}Contract${index} contract${index} = Contract${index}(${address});`;
    }

    /**
     * @description
     * Defines a variable from a name, value and type.
     * 
     * @param name The name of the variable
     * @param value The value of the variable
     * @param type The type of the variable
     * 
     * @returns The variable definition
     */
    @Step2Code.indentation.Indent()
    defineVariable(name: string, value: string, type: GlobalStateVariableType): string { 
        this.setVariable(name, value, type);
        return `${this.getIndentation()}${type} ${name}` + (value === "" ? "" :` = ${value}`) + ";";
    }

    /**
     * @description
     * Defines a call from a {@link DDCall} call object and an input/output mapping.
     * 
     * @param call The call object
     * @param inputMappings The input mappings of the call
     * @param outputMappings The output mappings of the call
     * @param useVariable Whether to use the variable name or the contract index
     * @param nameOrContractIndex The name of the variable or the index of the contract
     * 
     * @returns The call definition
     */
    @Step2Code.indentation.Indent()
    defineCall(call: DDCall, {inputMappings, outputMappings}: {inputMappings: InputMapping[], outputMappings: string[]}, useVariable: boolean = true, nameOrContractIndex: string): string {
        const { contract: currentContract, callInfo, } = call;
        const { from, gasLimit, value: callValue } = callInfo;

        // Verifying that all variables exist:
        for (let index = 0; index < inputMappings.length; index++) {
            const { type, value: _value } = inputMappings[index];
            if (type === "stateMapping") this.getVariable(_value);
        }

        let inputMappingFragments: string[] = [];

        const functionFragment = this.extractFunctionFragment(currentContract.functionString);

        const { isPayable } = this.getFunctionModifiers(functionFragment)

        if (!!outputMappings.length) {
            // If the outputMappings are shorter than the actual output we will simply only memoize the first n values
            
            const outputTypes = this.getCallOutputTypes(functionFragment);

            if (outputMappings.length > outputTypes.length) throw new Error("Invalid output mappings.");

            outputTypes.forEach((type, index) => {
                if (outputMappings[index] === undefined) {
                    outputMappings[index] = " ";
                    return;
                } // assigning to a space so that it gets rendered as an unused return value
                inputMappingFragments.push(this.defineVariable(outputMappings[index], "", type).substring(4));
            })
        }

        const prankFragment: string =
            this.getIndentation() + `vm.prank(${from}); // Pranking the next call: \n`;

        return (
            // pranking: should end the prank and start a new one: | Using prank() instead of start/endPrank due to ease of use
            (!!from && inputMappingFragments.length === 1 ? prankFragment : "")
            // space:
            // + this.STATEMENT_SEPERATOR
            // pranking for the next call (case of multiple output variables):
            + (inputMappingFragments.length > 1 ? `${this.concatenateFragments(inputMappingFragments)} \n` : "")
            // output assignment (if applicable) | Probably needs to be re-written for clarity:
             + (!!from && inputMappingFragments.length > 1 ? "\n" + prankFragment : "")
            + (!!inputMappingFragments.length
                ? `${inputMappingFragments.length === 1 && outputMappings.length === 1
                    ? this.getIndentation() + inputMappingFragments[0].substring(8).split(";")[0] // Removing the additional indentation and semicolon
                    : `${this.getIndentation()}(${outputMappings.join(", ")})`} = `
                : this.getIndentation()
            )
            // variable call
            + ((useVariable ? `${nameOrContractIndex}` : `contract${nameOrContractIndex}`) + ".")
            // function call
            + `${currentContract.functionString.split(" ")[1].split("(")[0]}`
            // value and gasLimit
            + ((!!callValue && isPayable || !!gasLimit) ?
                `{${!!callValue ? `value: ${callValue}` : ""}${!!callValue && !!gasLimit ? ", " : ""}${!!gasLimit ? `gasLimit: ${gasLimit}` : ""}}`
                : ""
            )
            // inputs
            + `(${inputMappings.map((_mapping) => _mapping.value).join(", ")});`
        );
    }

    /**
     * @description
     * Defines an ether vm.deal to an address. 
     * 
     * @param to The address to deal funds to
     * 
     * @returns The vm deal definition
     */
    @Step2Code.indentation.Indent()
    defineVmDeal(to: string): string { 
        return `${this.getIndentation()}vm.deal(${to}, ${this.settings.fundsToCaller});`;
    }

    // MULTI-DEFINITION FUNCTIONS:

    defineContractInterfaces(): string[] {
        return Object.keys(this.addressToContract).map((_address) => this.defineContractInterface(this.addressToContract[_address]));
    }

    defineContractVariables(): string[] { 
        return Object.keys(this.addressToContract).map((_address) => this.defineContractVariable(_address, this.addressToContract[_address].index));
    }

    defineExecutorAcounts(): string[] { 
        return Object.keys(this.addressToAccount).map((_address) => this.defineVariable(`account${this.addressToAccount[_address]}`, _address, "address"));
    }

    defineVariables(variableNames: string[]): string[] { 
        return variableNames.map((_variableName) => {
            const { value, type } = this.state[_variableName];
            return this.defineVariable(_variableName, value, type);
        });
    }

    defineCalls(): string[] { 
        return this.calls.map((_call, index) => {
            const { inputMappings, outputMappings } = this.sequence[index];
            return this.defineCall(
                this.calls[index], { inputMappings, outputMappings }, false, (this.addressToContract[_call.contract.address].index).toString()
            )
        });
    }

    defineVmDeals(): string[] { 
        return Object.keys(this.addressToAccount).map((_address) => this.defineVmDeal(_address));
    }

    // Utils:

    elementSeperator(): string  {
        this.increaseIndentationLevel();
        return this.STATEMENT_SEPERATOR;
    };

    /**
     * @description
     * Generates the test contract from the sequence object and settings after they have been processed.
     * 
     * @returns The generated test contract
     */
    createTestFromSequence(): string {  

        return (
            // license:
            `// SPDX-License-Identifier: UNLICENSED \n`
            + `pragma solidity 0.8.19; \n`
            // space
            + this.STATEMENT_SEPERATOR
            + `import { Test } from "forge-std/Test.sol"; \n`
            // space
            + this.STATEMENT_SEPERATOR
            // interfaces:
            + `${this.concatenateFragments(this.defineContractInterfaces())}`
            // space
            + this.STATEMENT_SEPERATOR
            // contract declaration:
            + `contract TestContract is Test {`
            + this.STATEMENT_SEPERATOR
            // constants:
            + `${this.concatenateFragments(this.defineContractVariables())}`
            // space
            + this.STATEMENT_SEPERATOR
            // executor accounts:
            + `${this.concatenateFragments(this.defineExecutorAcounts())}`
            // space
            + this.elementSeperator()
                + `${this.getIndentation()}function setUp() public {`
                + this.STATEMENT_SEPERATOR
            // dealling funds:
                    + this.concatenateFragments(this.defineVmDeals())
                    // @audit not implemented due to a need for a more complex type definition:
                    // + this.settings.tokensToCaller!.length ? this.settings.tokensToCaller!.map((token) => `${this.getIndentation()}vm.deal(${[token.address, this.addressToAccount[0], token.amount].join(", ")})`) + this.STATEMENT_SEPERATOR : ""
                + `\n${this.getIndentation()}}`
                // space
                +this.STATEMENT_SEPERATOR
                // function declaration:
                + `${this.getIndentation()}function testExploit() public {`
                    + this.STATEMENT_SEPERATOR
                    // calls:
                    + `${this.concatenateFragments(this.defineCalls())} \n`
                // function closure:
                + `${this.getIndentation()}}`
            // Contract closure:
            + `\n}`
        );
        //! @audit-info EXAMPLE OUTPUT:
        // // SPDX-License-Identifier: UNLICENSED
        // pragma solidity 0.8.19;
        //
        // import { Test } from "forge-std/Test.sol";
        //
        // interface Contract1 {
        //     function balanceOf(address account) external view returns (uint);
        // }

        // contract TestContract is Test {
        //     Contract1 contract1 = Contract1(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);

        //     function testExploit() public {
        //         contract1.balanceOf(0x0EBBf3b11ae65958d6265641C48f19126a575bD5);
        //     }
        // }
    }
}