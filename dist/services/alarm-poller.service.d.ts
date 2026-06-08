import { AlarmService } from "./alarm.service.js";
import { PushService } from "./push.service.js";
import { PushTokenStore } from "./push-token.store.js";
export declare class AlarmPollerService {
    private readonly alarmService;
    private readonly pushTokenStore;
    private readonly pushService;
    private readonly intervalMs;
    private readonly seenHighAlarmIds;
    private pollerHandle;
    private initialized;
    constructor(params: {
        alarmService: AlarmService;
        pushTokenStore: PushTokenStore;
        pushService: PushService;
        intervalMs: number;
    });
    start(): void;
    stop(): void;
    pollOnce(): Promise<void>;
}
