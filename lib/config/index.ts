import { Action } from "../behavior-tree";

export enum LOGLEVEL{
    NONE = 5,
    DEBUG=1,
    INFO=2,
    WARNING=3,
    ERROR=4
}
export const loglevel = LOGLEVEL.INFO; // 1 is log, 2 is warning, 3 is error. putting on 0 will have no logs
export const logToFile = true;

export function logConsole(severity: LOGLEVEL, ...args:string[]){
    if(loglevel <= severity){
        console.log(args);
    }
}
export function logInfo(...args:string[]){ return logConsole(LOGLEVEL.INFO); }
export function logDebug(...args:string[]){ return logConsole(LOGLEVEL.DEBUG); }
export function logWarning(...args:string[]){ return logConsole(LOGLEVEL.WARNING); }
export function logError(...args:string[]){ return logConsole(LOGLEVEL.ERROR); }

export function logFun(severity: LOGLEVEL, fun: (...args: any[]) => void, ...args:any[]){
    if(loglevel <= severity){
        fun(args);
    }
}
