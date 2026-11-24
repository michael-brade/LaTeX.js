import { type Constructor } from "../util/mixin.ts"

import type { GroupsAPI } from "./groups.ts"
import type { MacroManagementAPI } from "./macro-management.ts"


export function Environments<TBase extends Constructor<GroupsAPI & MacroManagementAPI>>(Base: TBase)
{
    /**
     * This mixin is part of the generator and handles LaTeX environments: an environment is a group
     * that has to be balanced, and that executes the macros \<env> at the beginning and \end<env> at the end.
     */
    abstract class EnvironmentsMixin extends Base
    {
        // no state of its own to reset, but declaring reset() here makes the emitted .d.ts declare it as a
        // method; otherwise it is inherited from the intersection of the mixin APIs in the type constraint
        // above and is emitted as "reset: (() => void) & (() => void) & (() => void);", and
        // Generator's "override reset()" then fails (TS2425)
        override reset(): void
        {
            super.reset()
        }

        // \begin{envId}: start the environment
        // the macro \<envId> is executed by the parser once its arguments are parsed
        begin(envId: string): void
        {
            if (!this.hasMacro(envId))
                this.error(`unknown environment: ${envId}`);

            this.startBalanced();
            this.enterGroup();
            this._manager.beginArgs(envId);
        }


        // \end{endId}: end the environment endId, checks if id == endId (the parser passes
        // the corresponding begin-id, too)
        //
        // returns the result of the macro \end<id> if there is one, otherwise undefined
        end(id: string, endId: string): unknown[] | undefined
        {
            if (id !== endId)
                this.error(`environment '${id}' is missing its end, found '${endId}' instead`);

            let end: unknown[] | undefined;
            if (this.hasMacro("end" + id))
                end = this.macro("end" + id, [], false);

            this.exitGroup();

            if (!this.isBalanced())
                this.error(`${id}: groups need to be balanced in environments!`);

            this.endBalanced();

            return end;
        }
    }

    return EnvironmentsMixin
}
