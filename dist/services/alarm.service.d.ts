import { AuthService } from "./auth.service.js";
import { Alarm, AlarmSeverity, AlarmStatus } from "../types.js";
export declare class AlarmService {
    private readonly authService;
    private readonly openRemoteUrl;
    private readonly realm;
    constructor(authService: AuthService, config?: {
        openRemoteUrl: string;
        realm: string;
    });
    fetchAlarms(filters?: {
        status?: AlarmStatus | string;
        severity?: AlarmSeverity | string;
    }): Promise<Alarm[]>;
    acknowledgeAlarm(id: string): Promise<unknown>;
    resolveAlarm(id: string): Promise<unknown>;
    private forwardAlarmAction;
    private parseAlarm;
    private extractAssignedUserId;
    private stringOrNull;
}
