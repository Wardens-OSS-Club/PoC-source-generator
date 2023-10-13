import { Mixin } from 'ts-mixer';

import { GlobalStateVariableWithName, IGlobalStateManager, IIndentationLevelHandler, IIndentationLevelManager } from "../interfaces/base";
import { GlobalState, GlobalStateVariable } from "../interfaces/base/index";
import { GlobalStateVariableType } from "../utils/types";

// @audit-info Using a function because Typescript does not support defining a type directly inside a class at execution time:
export function _getDynamicTypeFromArray<T>(_array: T[]): typeof _array[number] {
    type _type = typeof _array[number];
    return _array as unknown as _type;
}

/**
 * @description
 * Generates dynamic literal types from arrays.
 * 
 */
export class DynamicTypeCreationHandler {
    
    /**
     * @description
     * Generates a dynamic literal type from an array.
     *
     * @param _array The array to generate the dynamic literal type from.
     * @returns The generated dynamic literal type.
     */
    static getDynamicType<T>(_array: T[]): typeof _array[number] {
        return _getDynamicTypeFromArray<T>(_array);
    }

    /**
     * @description
     * Generates a dynamic literal type from an array.
     *
     * @param _array The array to generate the dynamic literal type from.
     * @returns The generated dynamic literal type.
     */
    getDynamicType<T>(_array: T[]): typeof _array[number] {
        return _getDynamicTypeFromArray<T>(_array);
    }
}

/**
 * @description
 * Manages the global state of the generated code.
 * 
*/
export class GlobalStateManager implements IGlobalStateManager {

    state: GlobalState = {};

    /**
     * @description
     * Sets the value of the variable with the given name to the given value.
    */
    setVariable(name: string, value: string, type: GlobalStateVariableType): void { 
        this.state[name] = { value, type };
    }

    /**
     * @description 
     * Returns the value of the variable with the given name. Throws an error if the variable does not exist.
     * @returns The value of the variable with the given name.
    */ 
    getVariable(name: string): GlobalStateVariable { 
        if (!this.state[name].type) throw new Error(`Variable ${name} does not exist.`);
        return this.state[name];
    }

    getVariableNameByValue(value: string): GlobalStateVariableWithName | null { 
        let lastValueOccurence: GlobalStateVariable | null = null
        let variableName: string | null = null;
        for (const _variableName in this.state) {
            const variable = this.state[_variableName];
            if (variable.value !== value) continue;
            
            if (variable.type === "address") return this.convertToGlobalStateVariableWithName(_variableName, value);
            
            variableName = _variableName;
            lastValueOccurence = variable;    
        }
        
        return lastValueOccurence ? this.convertToGlobalStateVariableWithName(variableName!, value) : null;
    }

    convertToGlobalStateVariableWithName(name: string, value: string): GlobalStateVariableWithName { 
        return { name, value: this.state[name] };
    }
}

/**
 * @description 
 * Manages the indentation level of the generated code with the Indent decorator used to decorate the block-building functions.
 * 
*/ 
export class IndentationLevelManager implements IIndentationLevelManager {
    // Using 4 spaces for indentation:
    static readonly INDENTATION_LAYER: string = " ".repeat(4);

    static current = 0;

    get(): string { 
        return IndentationLevelManager.INDENTATION_LAYER.repeat(IndentationLevelManager.current);
    }

    increase(): void {
        IndentationLevelManager.current++;
    }

    decrease(): void { 
        if (IndentationLevelManager.current < 1) return;
        IndentationLevelManager.current--;
    }

    /**
     * @description
     * Decorator to increase the indentation level of the generated code for the decorated function.
     * 
     * @param iterations The number of times to increase the indentation level. Defaults to 1.
     * @returns The decorated function.
     */
    Indent(iterations: number = 1): Function {
        // Destructing the context here because the context gets changed in the function definition bellow:
        const { increase: _increase, decrease: _decrease } = this;

        return function<T>(_: T, __: string, descriptor: PropertyDescriptor) {
            const originalMethod = descriptor.value;
            descriptor.value = function (...args: any[]) {
                for (let index = 0; index < iterations; index++) _increase();
                const result = originalMethod.apply(this, args);
                for (let index = 0; index < iterations; index++) _decrease();
                return result;
            }
        }
    }
}

/**
 * @description
 * Manages the indentation level of the generated code with the Indent decorator used to decorate the block-building functions.
 * 
*/
export class IndentationLevelHandler implements IIndentationLevelHandler {
    readonly STATEMENT_SEPERATOR = "\n\n";

    static indentation: IndentationLevelManager = new IndentationLevelManager();

    getIndentation(): string { 
        return IndentationLevelHandler.indentation.get();
    }

    increaseIndentationLevel(): void { 
        IndentationLevelHandler.indentation.increase();
    }

    decreaseIndentationLevel(): void { 
        IndentationLevelHandler.indentation.decrease();
    }

    /**
     * @description
     * Used to generate a string of the given fragments concatenated with the statement seperator.
     * 
     * @param fragments The fragments to concatenate
     * @returns The resulting string
     */
    concatenateFragments(fragments: string[]): string { 
        return fragments.join(this.STATEMENT_SEPERATOR);
    }
}

export default class Base extends Mixin(GlobalStateManager, IndentationLevelHandler, DynamicTypeCreationHandler) { constructor() { super(); } }
