import { Config } from '../config';

export abstract class BaseModule {

    constructor(protected config: Config) { }

    public updateConfiguration(config: Config) {
        this.config = config;
        this.onConfigChange();
    }

    protected onConfigChange(): void { };
}