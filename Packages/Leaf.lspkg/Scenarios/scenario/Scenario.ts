/**
 * LEAF Framework - Scenario Base Class
 */
@component
export abstract class Scenario extends BaseScriptComponent {
    public abstract run(): Promise<void>;
}

