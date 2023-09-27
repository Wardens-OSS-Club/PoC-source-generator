import Step2Code from ".";
import { GlobalState, GlobalStateVariable } from "../interfaces";
import { GlobalStateVariableType } from "../utils/types";

export class IndentationLevelManager {
    static readonly INDENTATION_LEVEL = "    ";

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

    Indent(iterations: number = 1): Function {
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

    concatenateFragments(fragments: string[]): string { 
        return fragments.join(this.STATEMENT_SEPERATOR);
    }
}

export class GlobalStateManager extends IndentationLevelHandler {
    state: GlobalState = {};

    setVariable(name: string, value: string, type: GlobalStateVariableType): void { 
        this.state[name] = { value, type };
    }

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