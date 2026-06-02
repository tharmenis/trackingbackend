import axios from "axios";
import { AuthService } from "./auth.service.js";
import { Alarm, AlarmSeverity, AlarmStatus } from "../types.js";

interface OpenRemoteAlarm {
  id: string;
  severity?: string;
  status?: string;
  title?: string;
  message?: string;
  description?: string;
  assigneeId?: string;
  assignedUserId?: string;
  assignee?: { id?: string; username?: string };
  [key: string]: unknown;
}

export class AlarmService {
  private readonly authService: AuthService;
  private readonly openRemoteUrl: string;
  private readonly realm: string;

  constructor(authService: AuthService, config?: { openRemoteUrl: string; realm: string }) {
    this.authService = authService;
    this.openRemoteUrl = config?.openRemoteUrl || process.env.OPENREMOTE_URL || "";
    this.realm = config?.realm || process.env.OPENREMOTE_REALM || "";
  }

  async fetchAlarms(filters?: {
    status?: AlarmStatus | string;
    severity?: AlarmSeverity | string;
  }): Promise<Alarm[]> {
    const token = await this.authService.getToken();
    const url = `${this.openRemoteUrl}/api/${this.realm}/alarm`;

    const response = await axios.get<OpenRemoteAlarm[]>(url, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.severity ? { severity: filters.severity } : {}),
      },
    });

    return response.data.map((alarm) => this.parseAlarm(alarm));
  }

  async acknowledgeAlarm(id: string): Promise<unknown> {
    return this.forwardAlarmAction(id, "acknowledge");
  }

  async resolveAlarm(id: string): Promise<unknown> {
    return this.forwardAlarmAction(id, "resolve");
  }

  private async forwardAlarmAction(id: string, action: "acknowledge" | "resolve"): Promise<unknown> {
    const token = await this.authService.getToken();
    const url = `${this.openRemoteUrl}/api/${this.realm}/alarm/${encodeURIComponent(id)}/${action}`;

    const response = await axios.put(url, undefined, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  }

  private parseAlarm(alarm: OpenRemoteAlarm): Alarm {
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

  private extractAssignedUserId(alarm: OpenRemoteAlarm): string | null {
    const direct = alarm.assignedUserId ?? alarm.assigneeId;
    if (typeof direct === "string" && direct.length > 0) {
      return direct;
    }

    if (alarm.assignee && typeof alarm.assignee.id === "string" && alarm.assignee.id.length > 0) {
      return alarm.assignee.id;
    }

    return null;
  }

  private stringOrNull(value: unknown): string | null {
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
    return null;
  }
}
