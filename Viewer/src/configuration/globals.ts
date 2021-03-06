import { Engine } from "babylonjs";

export class ViewerGlobals {

    public disableInit: boolean = false;
    public disableWebGL2Support: boolean = false;

    public get version(): string {
        return Engine.Version;
    }

}

export let viewerGlobals: ViewerGlobals = new ViewerGlobals();