
export enum LOGLEVEL{
    NONE = 5,
    DEBUG=1,
    INFO=2,
    WARNING=3,
    ERROR=4
}
export const loglevel = LOGLEVEL.INFO; // 1 is log, 2 is warning, 3 is error. putting on 0 will have no logs
