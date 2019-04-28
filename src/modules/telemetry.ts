import * as vscode from 'vscode';
import { Config } from '../config';

export class Telemetry {

    private static appInsights: any;
    private static client: any;
    private static initialized = false;
    private static enabled: boolean;

    static init(key: string, config: Config) {
        if (this.initialized) {
            return;
        }

        this.enabled = config.enableTelemetry;

        try {
            this.appInsights = require('applicationinsights');
            this.appInsights.setup(key);
            this.appInsights.start();
            this.client = this.appInsights.defaultClient;

            const extension = vscode.extensions.getExtension('TzachOvadia.todo-list');

            if (vscode && vscode.env) {
                this.client.context.tags[this.client.context.keys.appName] = extension.packageJSON.name;
                this.client.context.tags[this.client.context.keys.userId] = vscode.env.machineId;
                this.client.context.tags[this.client.context.keys.sessionId] = vscode.env.sessionId;
            }

            this.appInsights.defaultClient.commonProperties = {
                appName: extension.packageJSON.name
            };
            this.initialized = true;
        } catch (e) {
            console.error('Could not initialize Telemetry', e);
        }
    }

    static updateConfiguration(config: Config) {
        this.enabled = config.enableTelemetry;
    }

    static trackLoad() {
        if (!this.enabled) {
            return;
        }
        this.client.context.tags[this.client.context.keys.operationName] = 'state';
        this.client.trackTrace({ name: 'Load' });
    }

    static trackException(error: Error, initiator?: string) {
        if (!this.enabled) {
            return;
        }
        this.client.context.tags[this.client.context.keys.operationName] = 'state';
        const event = { exception: error, properties: {} };
        if (initiator) {
            event.properties = { initiator };
        }
        this.client.trackException(event);
    }

    static trackFeatureActivation(operationName: string, featureName: string) {
        if (!this.enabled) {
            return;
        }

        this.client.context.tags[this.client.context.keys.operationParentId] = 'featureActivated';
        this.client.context.tags[this.client.context.keys.operationName] = operationName;
        const event = {
            name: featureName,
        };
        this.client.trackEvent(event);
    }
}

export function TrackFeature(name?: string) {
    return function (target, propertyKey: string, descriptor: PropertyDescriptor) {
        var originalMethod = descriptor.value;

        descriptor.value = function (...args: any[]) {
            try {
                Telemetry.trackFeatureActivation(target.constructor.name, name || propertyKey);
                return originalMethod.apply(this, args);
            } catch (e) {
                Telemetry.trackException(e);
                throw e;
            }
        }

        return descriptor;
    }
}