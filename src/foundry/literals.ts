import { FunctionExecutionOptions, GlobalStateVariableWithName } from "../interfaces/base";
import { FunctionModifierProperties, FunctionModifier } from "../interfaces/foundry";
import { _FoundryLiteralBuilderBase } from "./utils";

export default class LiteralsBuilder extends _FoundryLiteralBuilderBase {
    
    // LITERAL KEYWORD STRINGS:
    
    /**
     * @description The standard syntax for interface keyword.
     * @example
     interface {name} {
       {property}: {type}
     }
    */
    readonly INTERFACE: string = "interface";
    
    /**
     * @description The standard syntax for contract keyword.
     * @example
     Contract syntax:
     contract {name} {
        contents...
     } 
    */
    readonly CONTRACT: string = "contract";

    /**
     * @description The standard syntax for function keyword.
     * @example
     function {name}({parameters}) {modifiers} {options} {returns} {
        contents...
     }
    */
    readonly FUNCTION: string = "function";

    /**
     * @description The standard syntax for licensing.
     * @example
        // SPDX-License-Identifier: {LICENSE}
    */
    readonly LICENSE: string = "// SPDX-License-Identifier: UNLICENSED";

    /**
      * @description The standard syntax for version.
    */
    readonly VERSION: string = "0.8.19";

    /**
     * @description The standard syntax for pragma.
     * @example
        pragma solidity {VERSION};
    */
    readonly PRAGMA: string = `pragma solidity ${this.VERSION};`;

    /**
     * @description The standard syntax for import keyword.
     * @example
     import {name} from "{path}"
    */
    readonly FOUNDRY_TEST_IMPORT: string = 'import { Test } from "forge-std/Test.sol";';

    // METHODS:

    /**
     * @description
     * @param _b Wheher the indentation should be added or not
     * Returns the indentation string based on the current indentation level.
     * @returns The indentation string
     */
    _indentation(_b: boolean): string {
        return _b ? this.getIndentation() : "";
     }

    /**
     * 
     * @description Defines an interface with the given name and functions.
     * @param name The name of the interface
     * @param functions the function strings to be added to the interface
     * @returns The interface string
     */
    buildInterface(name: string, functions: string[]): string { 
        return `${this.INTERFACE} ${name} {${functions.join("\n" + this.getIndentation())}}`
    }

    /**
     * 
     * @description Defines a contract or function variable with the given name and type.
     * @param name The name of the contract
     * @param interfaces The interfaces to be added to the contract
     * @param functions The functions to be added to the contract
     * @param indentation The indentation level of the contract
     * @returns The contract string
     */
    @LiteralsBuilder.indentation.Indent()
    buildVariableDefinition(
        name: string,
        type: string,
        value: string,
        indentation: boolean = true
    ): string { 
        value = value === "" ? "" : ` = ${type}(${value})`;
        return `${this._indentation(indentation)}${type} ${name}` + value + ";";
    }

    /**
     * @description Builds a a function output tuple from the given variables.
     * @param name The name of the contract
     * @param interfaces The interfaces to be added to the contract
     * @param functions The functions to be added to the contract
     * @param indentation The indentation level of the contract
     * @returns The contract string
     */
    @LiteralsBuilder.indentation.Indent()
    buildFunctionCallOutputTuple(
        length: number,
        variables: GlobalStateVariableWithName[],
        indentation: boolean = true
    ): string { 
        if (length === 0) return "";
        else if (length === 1) return `${variables[0].value.type} ${variables[0].name} = `;
        else if (length > variables.length)
            variables = variables.concat(new Array(length - variables.length).fill(""));

        const _variables = variables.map(variable => variable.name).join(", ");

        return `${this._indentation(indentation)}(${_variables}) = `;
    }

    /**
     * @description Builds a function execution options string from the given options.
     * @param options The options to be added to the function call
     * @param modifiers The modifiers to be added to the function call
     * @returns The options string
     */
    buildFunctionExecutionOptions(options?: FunctionExecutionOptions, modifiers?: FunctionModifierProperties): string { 
        if (!options) return "";
        if (modifiers && modifiers.isPayable) options.value = "";
        
        let fragments: string[] | string = [];

        for (const [key, value] of Object.entries(options)) {
            // Checking for undefined explicitly because value can be 0 or some other literal that JS equates to false.
            if (value === undefined) continue;
            fragments.push(`${key}: ${value}`);
        }

        fragments = fragments.join(", ");

        return fragments.length ? `{${fragments}}` : "";
    }

    /**
     * @description Builds a function call string from the given parameters.
     * @param name The name of the function
     * @param parameters The parameters to be added to the function
     * @param options The execution options to be added to the function
     * @param modifiers The modifiers to be added to the function
     * @param indentation The indentation level of the contract
     * @returns The function string
     */
    @LiteralsBuilder.indentation.Indent()
    buildFunctionCall(
        destination: string,
        name: string,
        parameters: string[],
        options?: FunctionExecutionOptions,
        modifiers?: FunctionModifierProperties,
        comment?: string,
        indentation: boolean = true
    ): string {
        const _parameters: string = parameters.join(", ");
        const _options: string = this.buildFunctionExecutionOptions(options!, modifiers!);
        comment = comment !== undefined ? `// ${comment}` : "";

        return `${this._indentation(indentation)}${destination}.${name}${_options}(${_parameters}); ${comment}`;
    }

    /**
     * @description Builds a function definition from the given parameters.
     * @param name The name of the function
     * @param parameters The parameters to be added to the function
     * @param modifiers The modifiers to be added to the function
     * @param indentation The indentation level of the contract
     * @returns The function definition string
     */
    @LiteralsBuilder.indentation.Indent()
    buildFunctionDefinition(
        name: string,
        parameters: string[],
        modifiers?: FunctionModifier[],
        contents?: string,
        indentation: boolean = true
    ): string { 
        if (!modifiers) modifiers = ["public"];
        const _parameters: string = parameters.join(", ");
        const _modifiers: string = modifiers.join(", ");

        return `${this._indentation(indentation)}${this.FUNCTION} ${name}(${_parameters}) ${_modifiers} {\n${contents}\n}`;
    }

    /**
     * @description Builds a contract string from the given contents.
     * @param name The name of the contract
     * @param contents The contents to be added to the contract
     * @returns The contract string
     */
    buildContract(name: string = "TestContract", contents: string[]): string { 
        return `${this.CONTRACT} ${name} {\n${contents.join("\n")}\n}`;
    }
}