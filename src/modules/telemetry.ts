import * as vscode from 'vscode';
import { Config } from '../config';

const APP_INSIGHTS_KEY = '4bf4cf26-e6f8-4d6d-bb6f-9e7b3cee7cdf';

export class Telemetry {

    private static appInsights: any;
    private static client: any;
    private static initialized = false;
    private static enabled: boolean;

    static init(config: Config) {
        this.enabled = vscode.debug.activeDebugSession === undefined && config.enableTelemetry;

        if (this.initialized || !this.enabled) {
            return;
        }

        try {
            this.appInsights = require('applicationinsights');
            this.appInsights.setup(APP_INSIGHTS_KEY)
                .setAutoDependencyCorrelation(false)
                .setAutoCollectRequests(false)
                .setAutoCollectPerformance(false)
                .setAutoCollectExceptions(true)
                .setAutoCollectDependencies(false)
                .setAutoCollectConsole(false)
                .setUseDiskRetryCaching(true)
                .setSendLiveMetrics(true)
                .start();
            this.client = this.appInsights.defaultClient;

            const extension = vscode.extensions.getExtension('TzachOvadia.todo-list');
            this.appInsights.defaultClient.context.tags[this.appInsights.defaultClient.context.keys.cloudRole] = extension.packageJSON.name;

            if (vscode && vscode.env) {
                this.client.context.tags[this.client.context.keys.userId] = vscode.env.machineId;
                this.client.context.tags[this.client.context.keys.sessionId] = vscode.env.sessionId;
            }

            this.initialized = true;
        } catch (e) {
            console.error('Could not initialize Telemetry', e);
        }
    }

    static updateConfiguration(config: Config) {
        this.init(config);
    }

    static trackLoad() {
        if (!this.enabled) {
            return;
        }
        this.client.context.tags[this.client.context.keys.operationName] = 'state';
        this.client.trackTrace({ message: 'Load' });
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