import { AppState } from "../state";
export declare function loadRemote(): Promise<Partial<AppState> | null>;
export declare function scheduleSave(state: AppState, delayMs?: number): void;
export declare function saveNow(state: AppState): Promise<void>;
