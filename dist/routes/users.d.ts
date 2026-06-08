import { Router } from "express";
import { PushTokenStore } from "../services/push-token.store.js";
export declare function createUsersRouter(pushTokenStore: PushTokenStore): Router;
