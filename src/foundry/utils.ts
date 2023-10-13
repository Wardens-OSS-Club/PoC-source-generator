import { Mixin } from "ts-mixer";

import Base from "../base";
import { FunctionModifierProperties } from "../interfaces/foundry";
import { GlobalStateVariableType, GlobalStateVariableTypeArray } from "../utils/types";

/**
 * @description
 * Handles the destruction of functions into their building blocks.
 * 
 */
export class FunctionDestructor { 

    /**
     * @description
     * Extracts the function fragment from a function string and does basic verification on it.
     * 
     * @param functionString The function string to extract the function fragment from
     * @returns The function fragment
     */
    getFunctionFragment(functionString: string): string[] { 
        const fragment: string[] = functionString.split(" ");
        if (fragment.length < 2) throw new Error("Invalid function string.");

        const nameAndArgsIndex: 1 | 0 = (fragment[0] === "function" ? 1 : 0);
        const nameAndArgs: string[] = fragment[nameAndArgsIndex].split("(");
        if (nameAndArgs.length < 2) throw new Error("Invalid function string.");
        return fragment;
    }

    /**
     * 
     * @param functionFragment The function fragment to extract the function name from
     * @returns 
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
            if (!GlobalStateVariableTypeArray.includes(arg as any)) continue;
            _args.push(arg as GlobalStateVariableType);
        }

        return _args as GlobalStateVariableType[];
    }
    
    /**
     * @description
     * Extracts the modifiers from a function fragment. Currently only supports the payable modifier.
     * 
     * @param functionFragment The function fragment to extract the modifiers from
     * @returns The modifiers of the function
     */
    getFunctionModifiers(functionFragment: string | string[]): FunctionModifierProperties { 
        if (typeof functionFragment === "string") functionFragment = this.getFunctionFragment(functionFragment);

        return {
            isPayable: functionFragment.includes("payable")
        };
    }
}

/**
 * @description
 * Base mixin class inherited by the LiteralBuilder class
 * 
 */
export class _FoundryLiteralBuilderBase extends Mixin(Base, FunctionDestructor) { constructor() { super(); } }