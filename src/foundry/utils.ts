import Step2Code from ".";
import { GlobalState, GlobalStateVariable } from "../interfaces";
import { GlobalStateVariableType } from "../utils/types";

/**
 * @description 
 * Manages the indentation level of the generated code with the Indent decorator used to decorate the block-building functions.
 * 
*/ 
export class IndentationLevelManager {
    // Using 4 spaces for indentation:
    static readonly INDENTATION_LEVEL = " ".repeat(4);

    static current = 0;

    get(): string { 
        return IndentationLevelManager.INDENTATION_LEVEL.repeat(IndentationLevelManager.current);
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

        return function (_: Step2Code, __: string, descriptor: PropertyDescriptor) {
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
export class IndentationLevelHandler {
    readonly STATEMENT_SEPERATOR = "\n\n";

    static indentation: IndentationLevelManager = new IndentationLevelManager();

    getIndentation(): string { 

        return Step2Code.indentation.get();
    }

    increaseIndentationLevel(): void { 
        Step2Code.indentation.increase();
    }

    decreaseIndentationLevel(): void { 
        Step2Code.indentation.decrease();
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

/**
 * @description
 * Manages the global state of the generated code.
 * 
*/
export class GlobalStateManager extends IndentationLevelHandler {

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
}

// @audit-info unused: 
// (Maybe will need to be implemented if we want to support pranking over multiple calls with a start / stop prank pattern):

// class PrankManager extends GlobalStateManager { 

//     currentPrank: string = "";

//     setPrank(prank: string): void { 
//         this.currentPrank = prank;
//     }

//     getPrankAddress(): string { 
//         return this.currentPrank;
//     }
// }