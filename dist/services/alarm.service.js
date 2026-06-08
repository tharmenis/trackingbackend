import axios from "axios";
export class AlarmService {
    constructor(authService, config) {
        this.authService = authService;
        this.openRemoteUrl = config?.openRemoteUrl || process.env.OPENREMOTE_URL || "";
        this.realm = config?.realm || process.env.OPENREMOTE_REALM || "";
    }
    async fetchAlarms(filters) {
        const token = await this.authService.getToken();
        const url = `${this.openRemoteUrl}/api/${this.realm}/alarm`;
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` },
            params: {
                ...(filters?.status ? { status: filters.status } : {}),
                ...(filters?.severity ? { severity: filters.severity } : {}),
            },
        });
        return response.data.map((alarm) => this.parseAlarm(alarm));
    }
    async acknowledgeAlarm(id) {
        return this.forwardAlarmAction(id, "acknowledge");
    }
    async resolveAlarm(id) {
        return this.forwardAlarmAction(id, "resolve");
    }
    async forwardAlarmAction(id, action) {
        const token = await this.authService.getToken();
        const url = `${this.openRemoteUrl}/api/${this.realm}/alarm/${encodeURIComponent(id)}`;
        const status = action === "acknowledge" ? "ACKNOWLEDGED" : "RESOLVED";
        const response = await axios.put(url, { status }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    }
    parseAlarm(alarm) {
        const severityRaw = String(alarm.severity ?? "unknown").toUpperCase();
        const statusRaw = String(alarm.status ?? "unknown").toUpperCase();
        return {
            id: String(alarm.id),
            severity: severityRaw,
            status: statusRaw,
            title: String(alarm.title ?? alarm.message ?? alarm.id),
            description: this.stringOrNull(alarm.description ?? alarm.message),
            assignedUserId: this.extractAssignedUserId(alarm),
            raw: alarm,
        };
    }
    extractAssignedUserId(alarm) {
        const direct = alarm.assignedUserId ?? alarm.assigneeId;
        if (typeof direct === "string" && direct.length > 0) {
            return direct;
        }
        if (alarm.assignee && typeof alarm.assignee.id === "string" && alarm.assignee.id.length > 0) {
            return alarm.assignee.id;
        }
        return null;
    }
    stringOrNull(value) {
        if (typeof value === "string" && value.length > 0) {
            return value;
        }
        return null;
    }
}
